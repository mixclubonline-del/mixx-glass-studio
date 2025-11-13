import React, { useMemo } from 'react';
import type { PrimeBrainStatus } from '../types/primeBrainStatus';

const CHANNEL_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  momentum: 'Momentum',
  pressure: 'Pressure',
  harmony: 'Harmony',
};

interface HeaderProps {
  primeBrainStatus: PrimeBrainStatus;
  hushFeedback: { color: string; intensity: number; isEngaged: boolean };
  isPlaying: boolean;
}

const Header: React.FC<HeaderProps> = ({ primeBrainStatus, hushFeedback, isPlaying }) => {
  const hushGlowStyle: React.CSSProperties = useMemo(
    () => ({
      transition: 'box-shadow 0.5s ease-in-out',
      boxShadow: hushFeedback.isEngaged
        ? `0 0 ${24 + hushFeedback.intensity * 48}px ${hushFeedback.color}`
        : 'none',
      borderRadius: '32px',
    }),
    [hushFeedback],
  );

  const pulseAura = useMemo(
    () => ({
      boxShadow: `0 0 28px ${primeBrainStatus.health.glowColor}`,
    }),
    [primeBrainStatus.health.glowColor],
  );

  const highlightFlag =
    primeBrainStatus.aiFlags.find((flag) => flag.severity !== 'info') ?? null;

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex h-20 items-center justify-center bg-glass-surface/95 p-4 text-sm text-ink shadow-[0px_32px_55px_rgba(4,12,26,0.48)] backdrop-blur-xl pointer-events-none border-b border-glass-border">
      <div
        className="pointer-events-auto absolute left-1/2 top-1/2 h-[172px] w-[480px] -translate-x-1/2 -translate-y-1/2"
        style={hushGlowStyle}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(9,16,28,0.9)] px-8 py-6 backdrop-blur-2xl shadow-[0_32px_80px_rgba(5,12,24,0.6)] ${
            isPlaying ? 'animate-als-breathing' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[0.55rem] uppercase tracking-[0.45em] text-ink/40">Prime Brain</span>
              <span
                className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-white/80"
                style={{
                  background: `${primeBrainStatus.health.glowColor}1a`,
                  border: `1px solid ${primeBrainStatus.health.glowColor}55`,
                }}
              >
                {primeBrainStatus.modeCaption}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[0.7rem] text-ink/60">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: primeBrainStatus.health.color,
                  boxShadow: `0 0 12px ${primeBrainStatus.health.glowColor}`,
                }}
              />
              <span>{highlightFlag?.message ?? primeBrainStatus.health.caption}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] gap-6">
            <div className="flex flex-col gap-3">
              {primeBrainStatus.alsChannels.map((channel) => (
                <div
                  key={channel.channel}
                  className="flex items-center gap-3 rounded-2xl border border-white/6 px-3 py-3 backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${channel.aura} 0%, rgba(9,16,28,0.85) 65%)`,
                    boxShadow: `0 18px 42px ${channel.aura}`,
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs font-semibold text-white/80"
                    style={{ background: channel.accent }}
                  >
                    {CHANNEL_LABELS[channel.channel]?.[0] ?? channel.channel[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[0.55rem] uppercase tracking-[0.35em] text-ink/45">
                      {CHANNEL_LABELS[channel.channel] ?? channel.channel}
                    </p>
                    <p className="text-sm text-ink">{channel.descriptor}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative flex flex-col items-center justify-center gap-4">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br shadow-[0_25px_60px_rgba(12,20,38,0.55)]">
                <div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${primeBrainStatus.velvet.gradient}`}
                />
                <div className="absolute inset-[18%] rounded-full border border-white/12 bg-[rgba(9,17,29,0.82)] backdrop-blur-xl" />
                <div className="relative z-10 flex max-w-[160px] flex-col items-center gap-2 text-center">
                  <span className="text-xs uppercase tracking-[0.4em] text-white/70">
                    {primeBrainStatus.velvet.label}
                  </span>
                  <p className="text-sm leading-relaxed text-white/80">{primeBrainStatus.velvet.tagline}</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 text-xs text-ink/60">
                {primeBrainStatus.bloomSummary && (
                  <p className="uppercase tracking-[0.3em] text-ink/50">{primeBrainStatus.bloomSummary}</p>
                )}
                {primeBrainStatus.guidanceLine && <p>{primeBrainStatus.guidanceLine}</p>}
                {!primeBrainStatus.bloomSummary &&
                  !primeBrainStatus.guidanceLine &&
                  (primeBrainStatus.userMemoryAnchors.length > 0 ? (
                    <p>Recall anchors primed.</p>
                  ) : (
                    <p>Recall listening for cues.</p>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {primeBrainStatus.velvet.anchors.map((anchor) => (
                <div
                  key={anchor.key}
                  className="rounded-2xl border border-white/10 px-3 py-3 backdrop-blur-md"
                  style={{
                    background: 'rgba(12,19,33,0.78)',
                    boxShadow: `0 12px 28px ${anchor.accent}25`,
                  }}
                >
                  <p className="text-[0.55rem] uppercase tracking-[0.35em] text-ink/45">{anchor.label}</p>
                  <p className="text-sm font-medium" style={{ color: anchor.accent }}>
                    {anchor.descriptor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-ink/60">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: primeBrainStatus.health.color,
                  boxShadow: `0 0 10px ${primeBrainStatus.health.glowColor}`,
                }}
              />
              <span>{primeBrainStatus.health.caption}</span>
            </div>
            <div className="flex items-center gap-4">
              {primeBrainStatus.lastAction && (
                <span className="whitespace-nowrap text-ink/55">
                  Last move: {primeBrainStatus.lastAction}
                </span>
              )}
              {primeBrainStatus.lastBloom && (
                <span className="whitespace-nowrap text-ink/55">
                  Bloom memory: {primeBrainStatus.lastBloom.name}
                </span>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[28px]" style={pulseAura} />
        </div>
      </div>
    </header>
  );
};

export default Header;