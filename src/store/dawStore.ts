import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransportState {
  playing: boolean;
  position: number;
  bpm: number;
  loop: boolean;
}

interface Track {
  id: string;
  name: string;
  plugins: string[];
}

interface UIState {
  spectrumVisible: boolean;
  spectrumWidth: number;
  spectrumHeight: number;
  metersVisible: boolean;
}

interface DAWState {
  transport: TransportState;
  tracks: Record<string, Track>;
  pluginRack: Record<string, string[]>;
  ui: UIState;
  windows: Record<string, any>;
}

interface DAWStore extends DAWState {
  setTransport: (updates: Partial<TransportState>) => void;
  addTrack: (id: string, name: string) => void;
  setPluginRack: (trackId: string, plugins: string[]) => void;
  setUI: (updates: Partial<UIState>) => void;
  saveSession: (sessionName?: string) => Promise<void>;
  loadSession: (sessionName?: string) => Promise<void>;
}

const validateSessionName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 100) return false;
  // Allow alphanumeric, spaces, hyphens, underscores
  const validPattern = /^[a-zA-Z0-9 _-]+$/;
  return validPattern.test(name);
};

const validateState = (state: any): state is DAWState => {
  if (!state || typeof state !== 'object') return false;
  
  // Validate transport
  if (!state.transport || typeof state.transport !== 'object') return false;
  if (typeof state.transport.playing !== 'boolean') return false;
  if (typeof state.transport.position !== 'number') return false;
  if (typeof state.transport.bpm !== 'number') return false;
  if (typeof state.transport.loop !== 'boolean') return false;
  
  // Validate tracks
  if (!state.tracks || typeof state.tracks !== 'object') return false;
  
  // Validate pluginRack
  if (!state.pluginRack || typeof state.pluginRack !== 'object') return false;
  
  // Validate ui
  if (!state.ui || typeof state.ui !== 'object') return false;
  
  return true;
};

const baseStore = (set: any, get: any): DAWStore => ({
  transport: { playing: false, position: 0, bpm: 120, loop: false },
  tracks: {},
  pluginRack: {},
  ui: {
    spectrumVisible: true,
    spectrumWidth: 420,
    spectrumHeight: 120,
    metersVisible: true,
  },
  windows: {},

  setTransport: (updates) =>
    set((s: DAWState) => ({ transport: { ...s.transport, ...updates } })),
  
  addTrack: (id, name) =>
    set((s: DAWState) => ({
      tracks: { ...s.tracks, [id]: { id, name, plugins: [] } },
    })),
  
  setPluginRack: (trackId, plugins) =>
    set((s: DAWState) => ({
      pluginRack: { ...s.pluginRack, [trackId]: plugins },
    })),
  
  setUI: (u) => set((s: DAWState) => ({ ui: { ...s.ui, ...u } })),

  async saveSession(sessionName = "default") {
    try {
      // Validate session name
      if (!validateSessionName(sessionName)) {
        toast.error("Invalid session name. Use 1-100 alphanumeric characters.");
        return;
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to save sessions");
        return;
      }

      const state = get();
      const { error } = await supabase
        .from("sessions")
        .upsert(
          [{ 
            user_id: session.user.id,
            name: sessionName, 
            data: state 
          }], 
          { onConflict: "user_id,name" }
        );
      
      if (error) {
        console.error("Session save error:", error);
        toast.error("Failed to save session");
        return;
      }

      toast.success(`Session "${sessionName}" saved successfully`);
    } catch (error) {
      console.error("Session save error:", error);
      toast.error("Failed to save session");
    }
  },

  async loadSession(sessionName = "default") {
    try {
      // Validate session name
      if (!validateSessionName(sessionName)) {
        toast.error("Invalid session name");
        return;
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("You must be logged in to load sessions");
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .select("data")
        .eq("name", sessionName)
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Session load error:", error);
        toast.error("Failed to load session");
        return;
      }

      if (!data) {
        toast.error(`Session "${sessionName}" not found`);
        return;
      }

      // Validate state before loading
      if (!validateState(data.data)) {
        console.error("Invalid session state format");
        toast.error("Session data is corrupted");
        return;
      }

      set(data.data);
      toast.success(`Session "${sessionName}" loaded successfully`);
    } catch (error) {
      console.error("Session load error:", error);
      toast.error("Failed to load session");
    }
  },
});

export const useDAWStore = create(
  persist(baseStore, {
    name: "mixclub-session",
    version: 1,
    partialize: (s) => ({
      transport: s.transport,
      tracks: s.tracks,
      pluginRack: s.pluginRack,
      ui: s.ui,
    }),
  })
);