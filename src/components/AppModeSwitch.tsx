/**
 * Renders map or list mode based on the persisted appMode setting.
 */
import App from '../App';
import { ListApp } from './ListMode/ListApp';
import { useSettingsStore } from '../stores/settingsStore';

export function AppModeSwitch() {
  const appMode = useSettingsStore((s) => s.appMode);
  return appMode === 'list' ? <ListApp /> : <App />;
}
