export type TrackContextMode = "record" | "playback" | "edit" | "performance";

export interface TrackUIState {
  context: TrackContextMode;
  laneHeight: number;
  collapsed: boolean;
}

export const DEFAULT_TRACK_CONTEXT: TrackContextMode = "playback";
export const DEFAULT_TRACK_LANE_HEIGHT = 108;
export const MIN_TRACK_LANE_HEIGHT = 64;
export const MAX_TRACK_LANE_HEIGHT = 192;
export const COLLAPSED_TRACK_LANE_HEIGHT = 52;


