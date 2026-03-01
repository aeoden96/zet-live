import { RefreshCw } from 'lucide-react';
import { useAppUpdate } from '../../hooks/useAppUpdate';

/**
 * Fixed banner shown when a new app version has been downloaded in the
 * background. Prompts the user to reload and apply the update.
 */
export function UpdatePrompt() {
  const { needRefresh, updateApp } = useAppUpdate();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-xl bg-base-100 border border-base-300 shadow-lg px-4 py-3 text-sm">
      <RefreshCw size={16} className="shrink-0 text-primary" />
      <span className="text-base-content">Nova verzija je dostupna</span>
      <button
        onClick={updateApp}
        className="btn btn-primary btn-sm ml-1"
      >
        Osvježi
      </button>
    </div>
  );
}
