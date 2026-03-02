#!/usr/bin/env node
/**
 * parse-service-alerts.mjs
 *
 * Fetches the ZET RSS feed, diffs against the current service-alerts.json,
 * calls OpenAI GPT-4o-mini (structured output) for any new items, and
 * persists the result both to public/data/service-alerts.json (committed to
 * the repo) and optionally to Cloudflare KV (for edge serving via the CF worker).
 *
 * Required env vars:
 *   OLLAMA_API_KEY          – Ollama Cloud API key (https://ollama.com)
 *
 * Optional env vars (for Cloudflare KV write-back):
 *   CF_ACCOUNT_ID           – Cloudflare account ID
 *   CF_KV_NAMESPACE_ID      – KV namespace ID bound as KV_SERVICE_ALERTS
 *   CF_API_TOKEN            – Cloudflare API token with KV write permission
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RSS_URL = 'https://www.zet.hr/rss_promet.aspx';
const ALERTS_FILE = 'public/data/service-alerts.json';
const KV_KEY = 'service-alerts';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

// ---------------------------------------------------------------------------
// Types (JSDoc only – script is plain JS)
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   id: string,
 *   guid: string,
 *   title: string,
 *   lines: string[],
 *   type: 'route-change'|'stop-change'|'cancellation'|'new-service'|'other',
 *   startDate: string|null,
 *   endDate: string|null,
 *   affectedStops: string[],
 *   summary: string,
 *   pubDate: string,
 *   url: string,
 *   processedAt: string,
 * }} ServiceAlert
 */

// ---------------------------------------------------------------------------
// RSS fetching & parsing (no external deps)
// ---------------------------------------------------------------------------

/** @returns {Promise<{guid:string, title:string, description:string, link:string, pubDate:string}[]>} */
async function fetchRssItems() {
  const res = await fetch(RSS_URL, {
    headers: { 'User-Agent': 'ZET-Live-ServiceAlerts/1.0' },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const items = [];
  // Split on <item> boundaries
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    const block = match[1];
    const title = extractCdata(block, 'title') ?? extractTag(block, 'title') ?? '';
    const description = extractCdata(block, 'description') ?? extractTag(block, 'description') ?? '';
    const link = extractTag(block, 'link') ?? '';
    const pubDate = extractTag(block, 'pubDate') ?? '';
    const guid = extractTag(block, 'guid') ?? link;
    items.push({ guid: guid.trim(), title: title.trim(), description, link: link.trim(), pubDate: pubDate.trim() });
  }
  return items;
}

/** Extract CDATA content from a tag */
function extractCdata(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'));
  return m ? m[1] : null;
}

/** Extract plain text content from a tag (no CDATA) */
function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
  return m ? m[1] : null;
}

/** Strip HTML tags and collapse whitespace */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Stable ID from guid
// ---------------------------------------------------------------------------

function makeId(guid) {
  return createHash('md5').update(guid).digest('hex').slice(0, 12);
}

// ---------------------------------------------------------------------------
// OpenAI structured parsing
// ---------------------------------------------------------------------------

// Ollama Cloud endpoint
const OLLAMA_API_URL = 'https://ollama.com/api/chat';
// gemma3:12b – strong multilingual (incl. Croatian), reliable JSON output, ~24 GB.
// Other good options from https://ollama.com/api/tags:
//   ministral-3:14b  (~16 GB, Mistral multilingual)
//   gpt-oss:20b      (~14 GB, smaller/faster)
const OLLAMA_MODEL = 'gemma3:12b';

const SYSTEM_PROMPT = `You are a transit data parser for ZET (Zagreb Electric Tram), Croatia.
You receive a raw transit service alert in Croatian (title + plain-text description).
Extract structured data and return ONLY valid JSON with exactly these keys:
{
  "lines": ["6", "7"],          // tram/bus line numbers mentioned (strings)
  "type": "route-change",        // one of: route-change, stop-change, cancellation, new-service, other
  "startDate": "2026-03-02",     // ISO 8601 date or null
  "endDate": "2026-03-09",       // ISO 8601 date or null
  "affectedStops": ["Zapruđe"], // stop names (keep Croatian)
  "summary": "..."}              // 1-2 sentence plain-English summary

type values:
- route-change: detour or route modification
- stop-change: stop moved, closed, or temporarily relocated
- cancellation: service suspended or replaced (e.g. buses replacing trams)
- new-service: new route or extended service
- other: anything else

Return ONLY the JSON object. No markdown, no explanation.`;

/**
 * @param {string} title
 * @param {string} plainDescription
 * @returns {Promise<{lines:string[], type:string, startDate:string|null, endDate:string|null, affectedStops:string[], summary:string}>}
 */
async function parsWithLlm(title, plainDescription) {
  if (!OLLAMA_API_KEY) {
    console.warn('OLLAMA_API_KEY not set – skipping LLM parse, using defaults');
    return { lines: [], type: 'other', startDate: null, endDate: null, affectedStops: [], summary: title };
  }

  const userContent = `Title: ${title}\n\nDescription: ${plainDescription.slice(0, 2000)}`;

  const res = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      // Ollama JSON mode: instructs the model to respond with valid JSON
      format: 'json',
      stream: false,
      options: { temperature: 0 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  // Ollama chat response: { message: { role, content } }
  const content = json.message?.content;
  if (!content) throw new Error('Empty Ollama response');

  // Strip accidental markdown fences if the model adds them
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Cloudflare KV write-back
// ---------------------------------------------------------------------------

async function writeToKv(payload) {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.log('CF KV env vars not set – skipping KV write-back');
    return;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${KV_KEY}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`KV write failed ${res.status}: ${err}`);
  } else {
    console.log('✓ Written to Cloudflare KV');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching ZET RSS feed…');
  const rssItems = await fetchRssItems();
  console.log(`  ${rssItems.length} items in feed`);

  // Load existing alerts
  /** @type {{ alerts: ServiceAlert[], lastUpdate: string }} */
  let existing = { alerts: [], lastUpdate: new Date(0).toISOString() };
  if (existsSync(ALERTS_FILE)) {
    try {
      existing = JSON.parse(readFileSync(ALERTS_FILE, 'utf8'));
    } catch {
      console.warn('Could not parse existing alerts file – starting fresh');
    }
  }

  const existingIds = new Set(existing.alerts.map(a => a.guid));
  const newItems = rssItems.filter(item => !existingIds.has(item.guid));
  console.log(`  ${newItems.length} new item(s) to process`);

  const newAlerts = /** @type {ServiceAlert[]} */ ([]);

  for (const item of newItems) {
    console.log(`  Parsing: ${item.title}`);
    const plain = stripHtml(item.description);
    let parsed;
    try {
      parsed = await parsWithLlm(item.title, plain);
    } catch (err) {
      console.error(`  LLM error for "${item.title}":`, err.message);
      parsed = { lines: [], type: 'other', startDate: null, endDate: null, affectedStops: [], summary: item.title };
    }

    newAlerts.push({
      id: makeId(item.guid),
      guid: item.guid,
      title: item.title,
      lines: parsed.lines,
      type: /** @type {any} */ (parsed.type),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      affectedStops: parsed.affectedStops,
      summary: parsed.summary,
      pubDate: item.pubDate,
      url: item.link,
      processedAt: new Date().toISOString(),
    });
  }

  // Merge: new alerts first (most recent at top), then existing
  const merged = [...newAlerts, ...existing.alerts];

  // Keep only guids that still appear in the feed (prune removed items)
  const feedGuids = new Set(rssItems.map(i => i.guid));
  const pruned = merged.filter(a => feedGuids.has(a.guid));

  const output = {
    alerts: pruned,
    lastUpdate: new Date().toISOString(),
  };

  mkdirSync(dirname(ALERTS_FILE), { recursive: true });
  writeFileSync(ALERTS_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`✓ Saved ${pruned.length} alerts to ${ALERTS_FILE}`);

  if (newAlerts.length > 0 || pruned.length !== existing.alerts.length) {
    await writeToKv(output);
  } else {
    console.log('No changes – skipping KV write-back');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
