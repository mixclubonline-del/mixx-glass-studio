import React, { useState } from 'react';
import { useNexusLogic } from '../../logic/NexusLogicEngine';
import { AuraColors, AuraGradients, AuraEffects, auraAlpha } from '../../theme/aura-tokens';

import { NexusRule } from '../../logic/NexusTypes';
import { Plus, Trash2, Play, Square, ShieldCheck, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Activity, Link, Globe } from 'lucide-react';
import './LogicNexusPanel.css';

export const LogicNexusPanel: React.FC = () => {
  const { 
    rules, addRule, removeRule, toggleRule, rejectRule, 
    masterAnalysis, loudnessMetrics, trends, 
    registers, setRegister, registerIntent,
    markers, clips,
    transportTime, bpm 
  } = useNexusLogic();
  const [isAdding, setIsAdding] = useState(false);

  // AURA Branding: "Nexus Terminal"
  return (
    <div className="logic-nexus-panel">
      {/* Header */}
      <div className="logic-nexus-header">
        <div className="logic-nexus-title-group">
          <div className="logic-nexus-pulse-dot animate-pulse" />
          <h2 className="logic-nexus-title">AURA LOGIC NEXUS</h2>
          <span className="logic-nexus-version">v1.0.9-RESONANCE</span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="logic-nexus-new-rule-btn"
        >
          <Plus className="w-4 h-4" />
          NEW RULE
        </button>
      </div>

      {/* Neural Telemetry */}
      <div className="logic-nexus-telemetry">
        <div className="logic-nexus-telemetry-module">
          <span className="logic-nexus-metric-label">LUFS_INT</span>
          <div className="logic-nexus-metric-value-group">
            <span className="logic-nexus-metric-value">
              {loudnessMetrics?.integratedLUFS !== undefined && loudnessMetrics.integratedLUFS !== -Infinity 
                ? loudnessMetrics.integratedLUFS.toFixed(1) 
                : '---'}
            </span>
            {trends?.LUFS_INTEGRATED === 'UP' && <TrendingUp size={10} className="text-aura-cyan opacity-80" />}
            {trends?.LUFS_INTEGRATED === 'DOWN' && <TrendingDown size={10} className="text-aura-magenta opacity-80" />}
            {trends?.LUFS_INTEGRATED === 'STABLE' && <Minus size={10} className="text-aura-cyan opacity-40" />}
          </div>
        </div>
        <div className="logic-nexus-telemetry-module">
          <span className="logic-nexus-metric-label">PRESENCE</span>
          <div className="logic-nexus-metric-value-group">
            <span className="logic-nexus-metric-value nexus-accent-cyan">
              {masterAnalysis?.soul ? masterAnalysis.soul.toFixed(0) : '0'}%
            </span>
            {trends?.PRESENCE === 'UP' && <TrendingUp size={10} className="text-aura-cyan opacity-80" />}
            {trends?.PRESENCE === 'DOWN' && <TrendingDown size={10} className="text-aura-magenta opacity-80" />}
            {trends?.PRESENCE === 'STABLE' && <Minus size={10} className="text-aura-cyan opacity-40" />}
          </div>
        </div>
        <div className="logic-nexus-telemetry-module">
          <span className="logic-nexus-metric-label">AIR</span>
          <div className="logic-nexus-metric-value-group">
            <span className="logic-nexus-metric-value nexus-accent-cyan">
              {masterAnalysis?.air ? masterAnalysis.air.toFixed(0) : '0'}%
            </span>
            {trends?.AIRINESS === 'UP' && <TrendingUp size={10} className="text-aura-cyan opacity-80" />}
            {trends?.AIRINESS === 'DOWN' && <TrendingDown size={10} className="text-aura-magenta opacity-80" />}
            {trends?.AIRINESS === 'STABLE' && <Minus size={10} className="text-aura-cyan opacity-40" />}
          </div>
        </div>
        <div className="logic-nexus-telemetry-controls">
          {/* Phase 9: Engine Telemetry */}
          <div className="logic-nexus-telemetry-module items-end">
            <span className="logic-nexus-metric-label">Q_COHERENCE</span>
            <div className="logic-nexus-metric-value-group mt-0.5">
              <div className="logic-nexus-gauge-container w-10">
                <div className="logic-nexus-gauge-bar" style={{ 
                  '--logic-gauge-width': '85%', 
                  '--logic-gauge-bg': AuraColors.violet, 
                  '--logic-gauge-shadow': `0 0 4px ${AuraColors.violet}` 
                } as React.CSSProperties} />
              </div>
              <span className="text-[10px] text-aura-violet">0.85</span>
            </div>
          </div>
          <div className="logic-nexus-telemetry-module items-end">
            <span className="logic-nexus-metric-label">NEURAL_HORIZON</span>
            <div className="logic-nexus-gauge-container w-20">
              <div className="logic-nexus-gauge-bar" style={{ 
                '--logic-gauge-width': `${Math.min(100, (transportTime % (60/bpm)) / (60/bpm) * 100)}%`, 
                '--logic-gauge-bg': AuraGradients.primary,
                '--logic-gauge-shadow': AuraEffects.glow.sm
              } as React.CSSProperties} />
            </div>
          </div>
          <div className="logic-nexus-telemetry-divider" />
        </div>
      </div>
      
      {/* Phase 8: Neural Horizon HUD */}
      <div className="logic-nexus-horizon-hud">
        <div className="logic-nexus-horizon-header">
          <span className="logic-nexus-metric-label">NEURAL_HORIZON</span>
          <span className="text-xs">T+{transportTime.toFixed(1)}s</span>
        </div>
        
        <div className="logic-nexus-horizon-track">
          {/* Grid Lines */}
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="logic-nexus-horizon-grid" style={{ '--horizon-grid-left': `${(i/8) * 100}%` } as React.CSSProperties} />
          ))}
          
          {/* Markers */}
          {markers.map(m => {
            const timeToEvent = m.time - transportTime;
            const lookaheadWindow = 10; // 10 seconds horizontal span
            if (timeToEvent < 0 || timeToEvent > lookaheadWindow) return null;
            return (
              <div key={m.id} className="logic-nexus-horizon-marker" style={{
                '--horizon-marker-left': `${(timeToEvent / lookaheadWindow) * 100}%`,
                '--horizon-marker-bg': m.color || AuraColors.cyan,
                '--horizon-marker-shadow': `0 0 8px ${m.color || AuraColors.cyan}`,
              } as React.CSSProperties}>
                <span className="logic-nexus-horizon-marker-label" style={{
                  '--horizon-label-color': m.color || AuraColors.cyan
                } as React.CSSProperties}>
                  {m.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="logic-nexus-rules-container">
        {rules.length === 0 ? (
          <div className="logic-nexus-empty-state">
            <ShieldCheck className="logic-nexus-empty-icon" />
            <p className="logic-nexus-empty-text-sm">NEXUS TERMINAL IDLE</p>
            <p className="text-xs opacity-60">Create a rule to begin neural automation</p>
          </div>
        ) : (
          rules.map((rule: NexusRule) => {
            const isFiring = rule.lastFired && (
              rule.trigger.type === 'BEAT' 
                ? false 
                : (Date.now() - (rule.lastFired as number) < 400)
            );

            return (
              <div
                key={rule.id}
                className="logic-nexus-rule-card"
                style={{
                  '--logic-rule-bg': isFiring 
                    ? auraAlpha(AuraColors.cyan, 0.2) 
                    : (rule.suppressUntil && Date.now() < rule.suppressUntil 
                        ? auraAlpha(AuraColors.violet, 0.1) 
                        : auraAlpha(AuraColors.twilight, 0.4)),
                  '--logic-rule-border': `1px solid ${auraAlpha(
                    isFiring ? AuraColors.cyan : (rule.enabled ? AuraColors.cyan : AuraColors.violet), 
                    isFiring ? 0.8 : (rule.suppressUntil && Date.now() < rule.suppressUntil ? 0.1 : 0.2)
                  )}`,
                  '--logic-rule-shadow': isFiring 
                    ? `0 0 20px ${auraAlpha(AuraColors.cyan, 0.3)}` 
                    : (rule.enabled && (!rule.suppressUntil || Date.now() > rule.suppressUntil) 
                        ? `inset 0 0 20px ${auraAlpha(AuraColors.cyan, 0.05)}` 
                        : 'none'),
                  '--logic-rule-scale': isFiring ? 'scale(1.02)' : 'scale(1)',
                  '--logic-rule-opacity': rule.suppressUntil && Date.now() < rule.suppressUntil ? 0.5 : 1,
                } as React.CSSProperties}
              >
                <div className="logic-nexus-rule-details">
                  <div className="logic-nexus-rule-header">
                    <span 
                      className="logic-nexus-rule-name-text logic-nexus-rule-name" 
                      style={{ '--logic-rule-name-color': rule.enabled ? AuraColors.cyan : '#aaa' } as React.CSSProperties}
                    >
                      {rule.name.toUpperCase()}
                    </span>
                    {isFiring && (
                      <span className="logic-nexus-firing-indicator">
                        FIRING
                      </span>
                    )}
                  </div>
                  <span className="logic-nexus-rule-condition">
                    IF {rule.trigger.type === 'AGENT_INTENT' ? `INTENT:${rule.trigger.params.intent}` : rule.trigger.type} 
                    {rule.trigger.type === 'ARRANGEMENT_LOOKAHEAD' ? ` (${rule.trigger.params.eventType})` : ''}
                    {rule.trigger.params.metricType ? `(${rule.trigger.params.metricType})` : ''} 
                    {rule.trigger.params.secondaryTrigger ? ` ${rule.trigger.params.logicType} ${rule.trigger.params.secondaryTrigger.type}` : ''}
                    {rule.trigger.params.register ? ` [REG:${rule.trigger.params.register}=${rule.trigger.params.registerValue}]` : ''}
                    {rule.trigger.params.leadTimeMs || rule.trigger.params.lookaheadMs ? ` [PRE-${rule.trigger.params.leadTimeMs || rule.trigger.params.lookaheadMs}ms]` : ''}
                    → THEN {rule.action.type === 'SERVICE_ORCHESTRATION' ? `ORCHESTRATE:${rule.action.params.service}` : rule.action.type}
                    {rule.action.params.registerKey ? ` [SET_REG:${rule.action.params.registerKey}]` : ''}
                  </span>
                  
                  {/* Synthesis & Confidence Gauges */}
                  <div className="flex-row items-center gap-3 mt-2">
                    <div className="w-10 h-0.5 bg-white/10 rounded-[1px]">
                      <div 
                        className="h-full bg-aura-cyan opacity-60" 
                        style={{ '--rule-fill-width': rule.enabled ? '100%' : '0%' } as React.CSSProperties} 
                      />
                    </div>
                    <div className="flex flex-col w-[60px]">
                      <div className="logic-nexus-gauge-container mt-0">
                        <div 
                          className="logic-nexus-gauge-bar" 
                          style={{ 
                            '--logic-gauge-width': `${(rule.confidenceScore ?? 1) * 100}%`, 
                            '--logic-gauge-bg': (rule.confidenceScore ?? 1) > 0.6 ? AuraColors.cyan : AuraColors.violet,
                            '--logic-gauge-opacity': 0.8 
                          } as React.CSSProperties} 
                        />
                      </div>
                      <span className="text-[8px] opacity-40 mt-0.5 tracking-[0.05em]">
                        CONFV: {Math.round((rule.confidenceScore ?? 1) * 100)}%
                      </span>
                    </div>

                    {/* Phase 8: Anticipation Meter */}
                    {rule.trigger.type === 'ARRANGEMENT_LOOKAHEAD' && (
                      <div className="flex-col w-20">
                        <div className="logic-nexus-gauge-container mt-0 bg-black/30">
                          <div className="logic-nexus-gauge-bar" style={{ 
                            '--logic-gauge-width': '40%', 
                            '--logic-gauge-bg': AuraGradients.aurora,
                            '--logic-gauge-opacity': 0.8 
                          } as React.CSSProperties} />
                        </div>
                        <span className="text-[8px] opacity-60 mt-0.5 tracking-[0.05em] text-aura-magenta">
                          ANTICIPATION
                        </span>
                      </div>
                    )}

                    {/* Synapse Hook Icons */}
                    {(rule.trigger.type === 'AGENT_INTENT' || rule.action.type === 'SERVICE_ORCHESTRATION') && (
                      <div className="flex gap-2 ml-auto">
                        {rule.trigger.type === 'AGENT_INTENT' && <Activity size={12} className="text-aura-cyan" />}
                        {rule.action.type === 'SERVICE_ORCHESTRATION' && <Globe size={12} className="text-aura-violet" />}
                        <Link size={12} className="text-aura-cyan opacity-50" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="logic-nexus-rule-actions">
                  <button
                    onClick={() => rejectRule(rule.id)}
                    className="logic-nexus-action-btn"
                    title="Reject Nexus Action (Dislike/Inhibit)"
                    style={{
                      '--nexus-action-border': `1px solid ${auraAlpha(AuraColors.magenta, 0.2)}`,
                      '--nexus-action-color': AuraColors.magenta,
                      '--nexus-action-opacity': rule.enabled ? 1 : 0.3
                    } as React.CSSProperties}
                  >
                    <AlertTriangle size={16} />
                  </button>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="logic-nexus-action-btn"
                    title={rule.enabled ? "Deactivate Neural Rule" : "Activate Neural Rule"}
                    style={{
                      '--nexus-action-border': `1px solid ${auraAlpha(rule.enabled ? AuraColors.cyan : '#444', 0.5)}`,
                      '--nexus-action-color': rule.enabled ? AuraColors.cyan : '#444',
                    } as React.CSSProperties}
                  >
                    {rule.enabled ? <Play size={16} /> : <Square size={16} />}
                  </button>
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="logic-nexus-action-btn"
                    title="Purge Neural Rule"
                    style={{
                      '--nexus-action-border': `1px solid ${auraAlpha(AuraColors.magenta, 0.3)}`,
                      '--nexus-action-color': AuraColors.magenta,
                    } as React.CSSProperties}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Synapse Registry */}
      {Object.keys(registers).length > 0 && (
        <div className="logic-nexus-registry">
          <div className="logic-nexus-registry-header">
            <Zap size={12} className="logic-nexus-registry-icon" />
            <span className="logic-nexus-registry-title">SYNAPSE REGISTRY</span>
          </div>
          <div className="logic-nexus-registry-grid">
            {Object.entries(registers).map(([key, val]) => (
              <div key={key} className="logic-nexus-registry-item">
                <span className="logic-nexus-registry-key">{key}:</span>
                <span className="logic-nexus-registry-val">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Stats */}
      <div className="logic-nexus-footer">
        <div className="logic-nexus-footer-content">
          <span className="logic-nexus-engine-id">NEXUS_ENGINE_v1.0.7-SYNAPSE</span>
          <span className="logic-nexus-stats">ACTIVE_RULES: {rules.filter((r: NexusRule) => r.enabled).length}</span>
        </div>
      </div>
    </div>
  );
};
