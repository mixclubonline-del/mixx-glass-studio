/**
 * DomainBridge - Gradual migration layer from App.tsx to Domain contexts
 * Phase 31: App.tsx Decomposition
 * 
 * This provider composes all domain providers and provides a bridge
 * for gradual migration from App.tsx state to domain-based state.
 */

import React, { ReactNode } from 'react';
import { AudioDomainProvider } from './audio';
import { TransportDomainProvider } from './transport';
import { TracksDomainProvider } from './tracks';
import { MixerDomainProvider } from './mixer';
import { PluginsDomainProvider } from './plugins';
import { AIDomainProvider } from './ai';
import { UIDomainProvider } from './ui';

interface DomainBridgeProps {
  children: ReactNode;
}

/**
 * DomainBridge composes all domain providers in the correct order.
 * 
 * Provider order (innermost to outermost dependencies):
 * 1. UI (no deps)
 * 2. AI (no deps)
 * 3. Plugins (no deps)
 * 4. Mixer (no deps)
 * 5. Tracks (no deps)
 * 6. Transport (needs AudioContext optional)
 * 7. Audio (outermost - provides AudioContext to all)
 */
export function DomainBridge({ children }: DomainBridgeProps) {
  return (
    <AudioDomainProvider>
      <TransportDomainProvider>
        <TracksDomainProvider>
          <MixerDomainProvider>
            <PluginsDomainProvider>
              <AIDomainProvider>
                <UIDomainProvider>
                  {children}
                </UIDomainProvider>
              </AIDomainProvider>
            </PluginsDomainProvider>
          </MixerDomainProvider>
        </TracksDomainProvider>
      </TransportDomainProvider>
    </AudioDomainProvider>
  );
}

export default DomainBridge;
