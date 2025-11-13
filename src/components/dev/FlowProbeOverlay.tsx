import React, { useMemo, useState } from "react";
import {
  addSessionProbeNote,
  exportSessionProbeSnapshot,
  useSessionProbeStore,
} from "../../hooks/useSessionProbe";
import { clearSessionProbe } from "../../state/sessionProbe";

const downloadJson = (payload: string) => {
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mixx-session-probe-${new Date().toISOString()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const FlowProbeOverlay: React.FC = () => {
  const store = useSessionProbeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [note, setNote] = useState("");

  if (!store.enabled) {
    return null;
  }

  const events = useMemo(() => store.events.slice(-10).reverse(), [store.events]);
  const currentContext = store.context;
  const currentTimeLabel = currentContext
    ? currentContext.currentTime.toFixed(2)
    : "–";
  const selectionLabel =
    currentContext && currentContext.selection
      ? `${currentContext.selection.start.toFixed(2)}s → ${currentContext.selection.end.toFixed(2)}s`
      : "none";
  const zoomLabel = currentContext
    ? Math.round(currentContext.pixelsPerSecond)
    : 0;
  const scrollLabel = currentContext ? Math.round(currentContext.scrollX) : 0;
  const selectedClipNames =
    currentContext && currentContext.selectedClips.length
      ? currentContext.selectedClips.map((clip) => clip.name).join(", ")
      : "none";

  const handleAddMarker = () => {
    const label = note.trim();
    addSessionProbeNote(label || `Marker ${store.markers.length + 1}`);
    setNote("");
  };

  const handleExport = () => {
    const serialized = exportSessionProbeSnapshot();
    if (!serialized) return;
    downloadJson(serialized);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1200] w-[340px] text-xs text-white">
      <div className="backdrop-blur-xl rounded-2xl border border-white/15 bg-slate-900/70 shadow-[0_28px_60px_rgba(8,15,25,0.55)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/60">
          <div>
            <div className="text-sm font-semibold tracking-wide uppercase text-white/80">
              Session Probe
            </div>
            <div className="text-[10px] text-white/50">
              ALS + Bloom telemetry · Flow rehearsal only
            </div>
          </div>
          <button
            type="button"
            className="px-2 py-1 text-[10px] uppercase tracking-[0.32em] bg-white/10 hover:bg-white/15 rounded-full transition"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>

        {!collapsed && (
          <div className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
            <section>
              <header className="flex items-center justify-between mb-2">
                <span className="uppercase tracking-[0.32em] text-[10px] text-white/60">
                  Live Context
                </span>
                <span className="text-white/40 text-[10px]">
                  t = {currentTimeLabel}s
                </span>
              </header>
              {currentContext ? (
                <ul className="space-y-1.5">
                  <li className="text-white/70">
                    {currentContext.viewMode.toUpperCase()} · Bloom{" "}
                    {currentContext.bloomContext.toUpperCase()}
                  </li>
                  <li className="text-white/60">
                    {currentContext.isPlaying ? "Playing" : "Stopped"} · Loop{" "}
                    {currentContext.isLooping ? "On" : "Off"} · Follow{" "}
                    {currentContext.followPlayhead ? "On" : "Off"}
                  </li>
                  <li className="text-white/60">
                    Grid {zoomLabel} px/s · Scroll {scrollLabel} px
                  </li>
                  <li className="text-white/60">
                    Selection {selectionLabel}
                  </li>
                  <li className="text-white/60">
                    Selected clips: {selectedClipNames}
                  </li>
                </ul>
              ) : (
                <div className="text-white/50">Awaiting context…</div>
              )}
            </section>

            <section>
              <header className="flex items-center justify-between mb-2">
                <span className="uppercase tracking-[0.32em] text-[10px] text-white/60">
                  Latest Signals
                </span>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-[0.32em] text-cyan-300 hover:text-cyan-200 transition"
                  onClick={clearSessionProbe}
                >
                  Clear
                </button>
              </header>
              <ul className="space-y-2">
                {events.length === 0 && (
                  <li className="text-white/50">No events captured yet.</li>
                )}
                {events.map((event) => (
                  <li
                    key={`${event.channel}-${event.timestamp}`}
                    className="rounded-lg bg-white/5 px-3 py-2 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium">
                        {event.channel.toUpperCase()}
                      </span>
                      <span className="text-white/40">
                        {(
                          (event.timestamp - (store.startedAt ?? event.timestamp)) /
                          1000
                        ).toFixed(2)}
                        s
                      </span>
                    </div>
                    {event.channel === "als" && (
                      <div className="text-white/60 text-[11px] mt-1 space-y-0.5">
                        <div>Source · {event.payload.source}</div>
                        {event.payload.master && (
                          <div>
                            Master Temp · {event.payload.master.temperature}
                          </div>
                        )}
                      </div>
                    )}
                    {event.channel === "bloom" && (
                      <div className="text-white/60 text-[11px] mt-1 space-y-0.5">
                        <div>Source · {event.payload.source}</div>
                        <div>Action · {event.payload.action}</div>
                      </div>
                    )}
                    {event.channel === "timeline" && (
                      <div className="text-white/60 text-[11px] mt-1 space-y-0.5">
                        <div>Event · {event.payload.kind}</div>
                        <div>Scroll · {Math.round(event.payload.scrollX)} px</div>
                        <div>
                          Zoom · {event.payload.pixelsPerSecond.toFixed(2)} px/s
                        </div>
                        {event.payload.ratioRange && (
                          <div>
                            Window ·{" "}
                            {Math.round(event.payload.ratioRange[0] * 100)}% →{" "}
                            {Math.round(event.payload.ratioRange[1] * 100)}%
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <header className="uppercase tracking-[0.32em] text-[10px] text-white/60">
                Markers
              </header>
              <div className="flex items-center space-x-2">
                <input
                  className="flex-1 rounded-lg bg-white/10 border border-white/10 px-2 py-1 text-white/80 placeholder:text-white/40 text-[11px] focus:outline-none focus:border-cyan-300/70"
                  placeholder="Add marker note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg bg-cyan-500/80 hover:bg-cyan-400 text-[11px] font-semibold transition"
                  onClick={handleAddMarker}
                >
                  Drop
                </button>
              </div>
              <div className="text-white/50 text-[11px]">
                Total markers: {store.markers.length}
              </div>
            </section>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-slate-900/60">
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/40">
            Export Flow Trace
          </div>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-semibold transition"
            onClick={handleExport}
          >
            Save JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowProbeOverlay;


