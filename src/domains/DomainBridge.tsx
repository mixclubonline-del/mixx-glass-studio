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
import { ProjectDomainProvider } from './project';
import { SessionDomainProvider } from './session';

interface DomainBridgeProps {
  children: ReactNode;
}

/**
 * DomainBridge composes all domain providers in the correct order.
 * 
 * Provider order (innermost to outermost dependencies):
 * 1. Session (no deps - innermost for panel state)
 * 2. UI (no deps)
 * 3. AI (no deps)
 * 4. Plugins (no deps)
 * 5. Mixer (no deps)
 * 6. Tracks (no deps)
 * 7. Transport (needs AudioContext optional)
 * 8. Audio (provides AudioContext to all)
 * 9. Project (outermost - manages persistence)
 */
export function DomainBridge({ children }: DomainBridgeProps) {
  return (
    <ProjectDomainProvider>
      <AudioDomainProvider>
        <TransportDomainProvider>
          <TracksDomainProvider>
            <MixerDomainProvider>
              <PluginsDomainProvider>
                <AIDomainProvider>
                  <UIDomainProvider>
                    <SessionDomainProvider>
                      {children}
                    </SessionDomainProvider>
                  </UIDomainProvider>
                </AIDomainProvider>
              </PluginsDomainProvider>
            </MixerDomainProvider>
          </TracksDomainProvider>
        </TransportDomainProvider>
      </AudioDomainProvider>
    </ProjectDomainProvider>
  );
}

export default DomainBridge;
