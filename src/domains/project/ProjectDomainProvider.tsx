/**
 * Project Domain Provider
 * Phase 31: App.tsx Decomposition
 * 
 * Manages project persistence (save/load) and dirty state.
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { PersistedProjectState, ProjectDomainContextType } from './types';

const ProjectDomainContext = createContext<ProjectDomainContextType | null>(null);

interface ProjectDomainProviderProps {
  children: ReactNode;
}

export function ProjectDomainProvider({ children }: ProjectDomainProviderProps) {
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // State getter reference - set by FlowRuntime during migration
  const stateGetterRef = useRef<(() => PersistedProjectState) | null>(null);
  
  const setStateGetter = useCallback((getter: () => PersistedProjectState) => {
    stateGetterRef.current = getter;
  }, []);
  
  const getState = useCallback((): PersistedProjectState | null => {
    return stateGetterRef.current ? stateGetterRef.current() : null;
  }, []);
  
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);
  
  const save = useCallback(async () => {
    const state = getState();
    if (!state) {
      console.warn('[ProjectDomain] No state getter registered');
      return;
    }
    
    try {
      // For now, save to localStorage (can be extended to file system)
      const key = `mixxclub:project:${projectName}`;
      localStorage.setItem(key, JSON.stringify(state));
      
      setIsDirty(false);
      setLastSavedAt(new Date());
      console.log(`[ProjectDomain] Saved project: ${projectName}`);
    } catch (error) {
      console.error('[ProjectDomain] Save failed:', error);
      throw error;
    }
  }, [projectName, getState]);
  
  const load = useCallback((state: PersistedProjectState) => {
    // This will be called by FlowRuntime's handleProjectLoad
    // The actual state restoration happens there during migration
    setIsDirty(false);
    setLastSavedAt(new Date());
    console.log('[ProjectDomain] Project loaded');
  }, []);
  
  const reset = useCallback(() => {
    setProjectName('Untitled Project');
    setIsDirty(false);
    setLastSavedAt(null);
    stateGetterRef.current = null;
    console.log('[ProjectDomain] Project reset');
  }, []);
  
  const value: ProjectDomainContextType = {
    projectName,
    isDirty,
    lastSavedAt,
    save,
    load,
    reset,
    setProjectName,
    markDirty,
    getState,
    setStateGetter,
  };
  
  return (
    <ProjectDomainContext.Provider value={value}>
      {children}
    </ProjectDomainContext.Provider>
  );
}

/**
 * Hook to access project domain
 */
export function useProject(): ProjectDomainContextType {
  const context = useContext(ProjectDomainContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectDomainProvider');
  }
  return context;
}

export default ProjectDomainProvider;
