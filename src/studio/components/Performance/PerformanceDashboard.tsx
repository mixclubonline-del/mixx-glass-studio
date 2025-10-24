/**
 * Mixx Club Studio - Performance Dashboard
 * Real-time visualization of system performance metrics
 * Shows CPU, memory, FPS, latency, and buffer pool stats
 */

import React from 'react';
import { usePerformance } from '../../../hooks/usePerformance';
import './PerformanceDashboard.css';

interface PerformanceGaugeProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  threshold?: number;
  critical?: number;
}

/**
 * Performance gauge component with color coding
 */
const PerformanceGauge: React.FC<PerformanceGaugeProps> = ({
  label,
  value,
  max = 100,
  unit = '',
  threshold = 70,
  critical = 90
}) => {
  let color = 'bg-green-600';
  let status = 'OPTIMAL';

  if (value >= critical) {
    color = 'bg-red-600';
    status = 'CRITICAL';
  } else if (value >= threshold) {
    color = 'bg-yellow-600';
    status = 'WARNING';
  }

  const percentage = (value / max) * 100;

  return (
    <div className="performance-gauge">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className={`text-xs font-bold px-2 py-1 rounded ${color}`}>
          {status}
        </span>
      </div>
      <div className="gauge-bar bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`gauge-bar-fill ${color} h-3 rounded-full transition-all duration-300`}
          data-percentage={Math.min(percentage, 100)}
        />
      </div>
      <div className="text-right text-xs text-gray-400 mt-1">
        {value.toFixed(1)}{unit} / {max}{unit}
      </div>
    </div>
  );
};

/**
 * PerformanceDashboard - Real-time performance monitoring
 */
const PerformanceDashboard: React.FC = () => {
  const { metrics, fftSize, getReport } = usePerformance();
  const [showDetails, setShowDetails] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  const isHealthy =
    metrics.cpuUsage < 70 &&
    metrics.memoryUsage < 75 &&
    metrics.renderFPS > 50;

  return (
    <div className="performance-dashboard bg-gray-900 border border-gray-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="text-lg font-bold text-white">Performance Monitor</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300"
        >
          {showDetails ? '✓ Details' : '○ Summary'}
        </button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <PerformanceGauge
          label="CPU Usage"
          value={metrics.cpuUsage}
          max={100}
          unit="%"
          threshold={70}
          critical={85}
        />
        <PerformanceGauge
          label="Memory Usage"
          value={metrics.memoryUsage}
          max={100}
          unit="%"
          threshold={75}
          critical={90}
        />
        <PerformanceGauge
          label="Render Performance"
          value={metrics.renderFPS}
          max={60}
          unit=" fps"
          threshold={45}
          critical={30}
        />
        <PerformanceGauge
          label="Audio Latency"
          value={metrics.audioLatency}
          max={10}
          unit=" ms"
          threshold={5}
          critical={8}
        />
      </div>

      {/* System Info */}
      <div className="bg-gray-800 rounded p-3 mb-4 text-xs text-gray-300 space-y-2">
        <div className="flex items-center justify-between">
          <span>Optimal FFT Size:</span>
          <span className="font-mono text-white">{fftSize}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Last Measurement:</span>
          <span className="font-mono text-white">
            {new Date(metrics.lastMeasurementTime).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Detailed Report */}
      {showDetails && (
        <div className="bg-gray-800 rounded p-3 mb-4">
          <button
            onClick={() => setExpandedSection(expandedSection === 'report' ? null : 'report')}
            className="w-full text-left text-xs font-bold text-gray-300 hover:text-white mb-2"
          >
            {expandedSection === 'report' ? '▼' : '▶'} Full Performance Report
          </button>
          {expandedSection === 'report' && (
            <pre className="text-xs text-gray-400 overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {getReport()}
            </pre>
          )}
        </div>
      )}

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`px-3 py-2 rounded text-center font-medium ${
          metrics.cpuUsage < 70 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          CPU: {metrics.cpuUsage.toFixed(0)}%
        </div>
        <div className={`px-3 py-2 rounded text-center font-medium ${
          metrics.renderFPS > 50 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          FPS: {metrics.renderFPS}
        </div>
        <div className={`px-3 py-2 rounded text-center font-medium ${
          metrics.memoryUsage < 75 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          MEM: {metrics.memoryUsage}%
        </div>
      </div>

      {/* Performance Tips */}
      {!isHealthy && (
        <div className="mt-4 p-3 rounded bg-yellow-900 border border-yellow-700">
          <p className="text-xs text-yellow-300 font-medium mb-2">💡 Performance Issues Detected</p>
          <ul className="text-xs text-yellow-200 space-y-1">
            {metrics.cpuUsage > 70 && (
              <li>• CPU usage high - reduce analysis quality or disable visualization</li>
            )}
            {metrics.memoryUsage > 75 && (
              <li>• Memory usage high - audio buffers may not be released properly</li>
            )}
            {metrics.renderFPS < 50 && (
              <li>• Frame rate dropping - check for long-running tasks on main thread</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
