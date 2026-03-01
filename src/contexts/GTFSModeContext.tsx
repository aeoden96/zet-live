/**
 * React context that makes the active GTFSModeConfig available to any
 * descendant without prop-drilling.
 *
 * Usage (provider):
 *   <GTFSModeProvider config={TRANSIT_MODE}>…</GTFSModeProvider>
 *
 * Usage (consumer anywhere in the tree):
 *   const { dataDir } = useGTFSMode();
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { GTFSModeConfig } from '../config/modes';
import { TRANSIT_MODE } from '../config/modes';

const GTFSModeContext = createContext<GTFSModeConfig>(TRANSIT_MODE);

interface GTFSModeProviderProps {
  config: GTFSModeConfig;
  children: ReactNode;
}

export function GTFSModeProvider({ config, children }: GTFSModeProviderProps) {
  return (
    <GTFSModeContext.Provider value={config}>
      {children}
    </GTFSModeContext.Provider>
  );
}

/** Returns the active GTFSModeConfig for the nearest provider in the tree. */
export function useGTFSMode(): GTFSModeConfig {
  return useContext(GTFSModeContext);
}
