import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ProjectContextType {
  currentProject: string | null;
  setCurrentProject: (project: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const useTransport = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useTransport must be used within a ProjectProvider');
  }
  return {
    isPlaying: context.isPlaying,
    setIsPlaying: context.setIsPlaying,
    isRecording: context.isRecording,
    setIsRecording: context.setIsRecording,
  };
};

export const useAudioEngine = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useAudioEngine must be used within a ProjectProvider');
  }
  return {
    // Audio engine methods will be implemented here
    initialize: () => console.log('Audio engine initialized'),
    start: () => console.log('Audio engine started'),
    stop: () => console.log('Audio engine stopped'),
  };
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject,
    isPlaying,
    setIsPlaying,
    isRecording,
    setIsRecording,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
