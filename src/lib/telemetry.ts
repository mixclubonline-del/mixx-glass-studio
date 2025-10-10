/**
 * Telemetry Logger - Central event tracking for Mixx Studio
 */

export interface TelemetryEvent {
  timestamp: number;
  source: 'MAE' | 'PBS' | 'EPE' | 'DNA' | 'UI';
  category: string;
  action: string;
  data?: any;
}

class TelemetryLogger {
  private events: TelemetryEvent[] = [];
  private maxEvents = 1000;

  log(event: Omit<TelemetryEvent, 'timestamp'>) {
    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Console output with emoji prefix
    const emoji = this.getEmoji(event.source);
    console.log(`${emoji} ${event.source} [${event.category}]:`, event.action, event.data || '');
  }

  private getEmoji(source: TelemetryEvent['source']): string {
    switch (source) {
      case 'PBS': return '🧠';
      case 'MAE': return '🌊';
      case 'EPE': return '🔮';
      case 'DNA': return '🧬';
      case 'UI': return '🎨';
    }
  }

  getRecentEvents(count = 50): TelemetryEvent[] {
    return this.events.slice(-count);
  }

  clear() {
    this.events = [];
  }
}

export const telemetry = new TelemetryLogger();
