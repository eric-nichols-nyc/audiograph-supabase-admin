// Simple in-memory store for metrics updates
type MetricsUpdate = {
  type: string;
  status: string;
  timestamp: string;
  artistsProcessed: number;
};

class MetricsStore {
  private updates: MetricsUpdate[] = [];
  private listeners: ((update: MetricsUpdate) => void)[] = [];
  
  addUpdate(update: MetricsUpdate) {
    this.updates.push(update);
    // Notify all listeners
    this.listeners.forEach(listener => listener(update));
  }
  
  getUpdates() {
    return [...this.updates];
  }
  
  subscribe(listener: (update: MetricsUpdate) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Export a singleton instance
export const metricsStore = new MetricsStore(); 