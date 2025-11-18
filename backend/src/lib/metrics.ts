/**
 * Simple metrics abstraction for tracking application metrics.
 * Currently logs to console, but can be extended to send to external systems
 * (Prometheus, DataDog, CloudWatch, etc.)
 */

interface MetricLabels {
  [key: string]: string | number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   */
  counter(name: string, value: number = 1, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    if (process.env.LOG_METRICS === 'true') {
      console.log(`[METRIC:COUNTER] ${key} += ${value} (total: ${current + value})`);
    }
  }

  /**
   * Set a gauge metric (point-in-time value)
   */
  gauge(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    if (process.env.LOG_METRICS === 'true') {
      console.log(`[METRIC:GAUGE] ${key} = ${value}`);
    }
  }

  /**
   * Record a histogram value (for timing, sizes, etc.)
   */
  histogram(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    if (process.env.LOG_METRICS === 'true') {
      console.log(`[METRIC:HISTOGRAM] ${key} observed ${value}`);
    }
  }

  /**
   * Time a function execution
   */
  async time<T>(name: string, fn: () => Promise<T>, labels?: MetricLabels): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.histogram(`${name}_duration_ms`, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.histogram(`${name}_duration_ms`, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  /**
   * Get current metric values (for debugging/monitoring endpoints)
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ])
      ),
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }
}

export const metrics = new MetricsCollector();

// Common metric helpers
export const recordAnalysis = (modelProvider: string, success: boolean) => {
  metrics.counter('narrative_analysis_total', 1, { provider: modelProvider, success: String(success) });
};

export const recordEngagement = (sourceType: string) => {
  metrics.counter('narrative_engagement_recorded', 1, { source_type: sourceType });
};

export const recordInsightQuery = (type: 'themes' | 'tones' | 'archetypes') => {
  metrics.counter('narrative_insight_queries', 1, { type });
};
