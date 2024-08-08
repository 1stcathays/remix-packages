import { collectDefaultMetrics, register } from 'prom-client';
import type { Metric } from 'web-vitals';
import initWebVitals from './web-vitals';

export type Metrics = {
  /**
   * Observe a web vital metric
   * @param {Metric} metric - the metric to observe
   */
  observeWebVital(metric: Metric): void;

  /**
   * Gets all metric currently in the register
   */
  getMetrics(): Promise<string>;
};

export type InitOptions = {
  /**
   * Application name label added to all observations
   */
  appName: string;

  /**
   * Application version label added to all observations
   */
  appVersion: string;
};

export function initMetrics(options: InitOptions): Metrics {
  collectDefaultMetrics();

  const labels = {
    appName: options.appName,
    appVersion: options.appVersion,
  };

  return {
    getMetrics(): Promise<string> {
      return register.metrics();
    },
    ...initWebVitals(labels),
  };
}

export default initMetrics;
