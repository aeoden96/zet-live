/**
 * Settings page
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Map, Database, Trash2, Info, MapPin, List } from 'lucide-react';
import { useSettingsStore, type StopDisplayMode } from '../../stores/settingsStore';
import { useDataCacheStore } from '../../stores/dataCache';
import { useInitialData } from '../../hooks/useInitialData';

// Map tile providers handled automatically via theme + detailedMap setting

const STOP_DISPLAY_MODES: { id: StopDisplayMode; name: string; description: string }[] = [
  { id: 'individual', name: 'Individualne stanice', description: 'Prikazuje svaku platformu zasebno; prozirnost se smanjuje pri manjem uvećanju' },
  { id: 'grouped', name: 'Grupirane stanice', description: 'Klasični prikaz s grupiranim roditeljskim stanicama i platformama po uvećanju' },
];

export function SettingsPage() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const sandboxVisible = useSettingsStore((state) => state.sandboxVisible);
  const setSandboxVisible = useSettingsStore((state) => state.setSandboxVisible);
  const detailedMap = useSettingsStore((state) => state.detailedMap);
  const setDetailedMap = useSettingsStore((state) => state.setDetailedMap);
  const stopDisplayMode = useSettingsStore((state) => state.stopDisplayMode);
  const setStopDisplayMode = useSettingsStore((state) => state.setStopDisplayMode);
  const showAllVehicles = useSettingsStore((state) => state.showAllVehicles);
  const setShowAllVehicles = useSettingsStore((state) => state.setShowAllVehicles);
  const appMode = useSettingsStore((state) => state.appMode);
  const setAppMode = useSettingsStore((state) => state.setAppMode);
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);

  const clearCache = useDataCacheStore((state) => state.clearCache);
  const getCacheStats = useDataCacheStore((state) => state.getCacheStats);
  const cacheVersion = useDataCacheStore((state) => state.version);

  const { feedVersion, feedStartDate, feedEndDate } = useInitialData();

  const cacheStats = getCacheStats();

  const handleClearCache = () => {
    if (window.confirm('Clear cached data? The app will reload to fetch fresh data.')) {
      clearCache();
      window.location.reload();
    }
  };

  const handleShowOnboarding = () => {
    setOnboardingCompleted(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="btn btn-circle btn-ghost btn-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Postavke</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Appearance Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg flex items-center gap-2">
              {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              Izgled
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tema</p>
                <p className="text-sm text-base-content/70">Svijetla ili tamna tema</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Sun className="w-4 h-4" />
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                />
                <Moon className="w-4 h-4" />
              </label>
            </div>
          </div>
        </div>

        {/* App Mode Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg flex items-center gap-2">
              {appMode === 'map' ? <Map className="w-5 h-5" /> : <List className="w-5 h-5" />}
              Način rada
            </h2>
            <p className="text-sm text-base-content/70 mb-2">
              Karta prikazuje vozila i stanice na karti. Popis prikazuje favorite, linije i stanice u obliku liste.
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="app-mode"
                  className="radio radio-primary mt-1"
                  checked={appMode === 'map'}
                  onChange={() => setAppMode('map')}
                />
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-1.5"><Map className="w-4 h-4" /> Karta</p>
                  <p className="text-sm text-base-content/70">Puni prikaz s interaktivnom kartom, GPS vozilima i stanicama</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="app-mode"
                  className="radio radio-primary mt-1"
                  checked={appMode === 'list'}
                  onChange={() => setAppMode('list')}
                />
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-1.5"><List className="w-4 h-4" /> Popis</p>
                  <p className="text-sm text-base-content/70">Lagan način rada bez karte — favoriti, linije, obližnje stanice i obavijesti</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg flex items-center gap-2">
              <Map className="w-5 h-5" />
              Karta
            </h2>
            <div className="space-y-3">
              <p className="font-medium">Detaljnija karta</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Uključi za detaljniji stil karte (Standard / HOT). Vrijedi za svijetlu i tamnu temu.</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary mt-1"
                  checked={detailedMap}
                  onChange={(e) => setDetailedMap(e.target.checked)}
                />
              </div>
            </div>

            <div className="divider my-2" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-base-content/70" />
                  <p className="font-medium">Javni prijevoz</p>
                </div>
                <p className="text-sm text-base-content/70 mt-0.5">Prikazuje stanice, linije, pretragu i GPS položaje vozila</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary mt-1"
                checked={showAllVehicles}
                onChange={(e) => setShowAllVehicles(e.target.checked)}
              />
            </div>

            <div className="divider my-2" />

            <div className="space-y-3">
              <p className="font-medium">Prikaz stanica</p>
              {STOP_DISPLAY_MODES.map((mode) => (
                <label key={mode.id} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="stop-display-mode"
                    className="radio radio-primary mt-1"
                    checked={stopDisplayMode === mode.id}
                    onChange={() => setStopDisplayMode(mode.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{mode.name}</p>
                    <p className="text-sm text-base-content/70">{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sandbox Mode Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg">Sandbox način rada</h2>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium">Prikaži Sandbox</p>
                <p className="text-sm text-base-content/70">
                  Alat za ručno postavljanje vremena i testiranje reda vožnje
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary mt-1"
                checked={sandboxVisible}
                onChange={(e) => setSandboxVisible(e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Data & Cache Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Podaci i predmemorija
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Broj zapisa</span>
                <span className="font-medium">{cacheStats.entryCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Veličina</span>
                <span className="font-medium">{formatBytes(cacheStats.sizeBytes)}</span>
              </div>
              {cacheVersion && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">Verzija</span>
                  <span className="font-medium">{cacheVersion}</span>
                </div>
              )}
              <button
                onClick={handleClearCache}
                className="btn btn-outline btn-error btn-sm w-full mt-2"
              >
                <Trash2 className="w-4 h-4" />
                Obriši predmemoriju
              </button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg flex items-center gap-2">
              <Info className="w-5 h-5" />
              O aplikaciji
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Verzija aplikacije</span>
                <span className="font-medium">1.0.0</span>
              </div>
              {feedVersion && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">GTFS verzija</span>
                  <span className="font-medium">{feedVersion}</span>
                </div>
              )}
              {feedStartDate && feedEndDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">Podaci vrijede</span>
                  <span className="font-medium text-right">
                    {feedStartDate} - {feedEndDate}
                  </span>
                </div>
              )}
              <button
                onClick={handleShowOnboarding}
                className="btn btn-outline btn-sm w-full mt-2"
              >
                Prikaži uvod ponovno
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
