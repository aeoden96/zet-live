import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function processFiles() {
    const inputDir = 'future_improvements';
    const outputDir = 'public/static_data';

    // studentski restorani
    try {
        const restoraniRaw = readFileSync(join(inputDir, 'studentski_restorani.geojson'), 'utf-8');
        const restorani = JSON.parse(restoraniRaw);
        restorani.features = restorani.features.map((f: any) => ({
            id: f.id,
            type: "Feature",
            geometry: f.geometry,
            properties: {
                naziv: f.properties.naziv,
                adresa: f.properties.adresa,
                web: f.properties.web
            }
        }));
        writeFileSync(join(outputDir, 'studentski_restorani.json'), JSON.stringify(restorani));
        console.log("Processed studentski_restorani.json");
    } catch (e) { console.error("Error processing studentski restorani:", e); }

    // public fountains
    try {
        const zdenciRaw = readFileSync(join(inputDir, 'javni_zdenci.geojson'), 'utf-8');
        const zdenci = JSON.parse(zdenciRaw);
        zdenci.features = zdenci.features.map((f: any, i: number) => ({
            id: i,
            type: "Feature",
            geometry: f.geometry,
            properties: {
                lokacija: f.properties.lokacija,
                tip_zdenca: f.properties.tip_zdenca,
                ispravnost: f.properties.ispravnost,
                status: f.properties.status,
                opis_lokacije: f.properties.opis_lokacije,
            }
        }));
        writeFileSync(join(outputDir, 'javni_zdenci.json'), JSON.stringify(zdenci));
        console.log("Processed javni_zdenci.json");
    } catch (e) { console.error("Error processing javni zdenci:", e); }

    // pedestrian zones
    try {
        const pzonaRaw = readFileSync(join(inputDir, 'Geoportal_pjesacka_zona.geojson'), 'utf-8');
        const pzona = JSON.parse(pzonaRaw);
        pzona.features = pzona.features.map((f: any, i: number) => ({
            id: i,
            type: "Feature",
            geometry: f.geometry,
            properties: {
                naziv: f.properties.naziv || "Pješačka zona"
            }
        }));
        writeFileSync(join(outputDir, 'pjesacka_zona.geojson'), JSON.stringify(pzona));
        console.log("Processed pjesacka_zona.geojson");
    } catch (e) { console.error("Error processing pjesacka zona:", e); }

    // free wifi
    try {
        const wifiRaw = readFileSync(join(inputDir, 'Geoportal_besplatna_wifi_mreza.geojson'), 'utf-8');
        const wifi = JSON.parse(wifiRaw);
        wifi.features = wifi.features.map((f: any, i: number) => ({
            id: i,
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: f.geometry ? (f.geometry.coordinates || [0, 0]) : [0, 0]
            },
            properties: {
                lokacija: f.properties.Lokacija || f.properties.lokacija,
                nadlezan: f.properties.nadlezan
            }
        }));
        writeFileSync(join(outputDir, 'besplatna_wifi_mreza.json'), JSON.stringify(wifi));
        console.log("Processed besplatna_wifi_mreza.json");
    } catch (e) { console.error("Error processing wifi:", e); }
}

processFiles();
