import { Histogram, type LabelValues, linearBuckets } from 'prom-client';
import type { Metric } from 'web-vitals';

export default function init(labels: LabelValues<string>) {
  const labelNames = ['navigationType', 'rating', 'id', ...Object.keys(labels)];

  function extractLabels(metric: Metric): Record<string, string | number> {
    return {
      ...labels,
      navigationType: metric.navigationType,
      rating: metric.rating,
    };
  }

  const lcp = new Histogram({
    buckets: linearBuckets(0, 250, 20),
    help: 'Delta value for LCP (Largest Contentful Paint) in ms',
    labelNames,
    name: 'ui_lcp_delta',
  });

  const cls = new Histogram({
    buckets: [0, 0.0001, 0.001, 0.01, 0.1, 0.2, 0.3, 0.5, 1, 2, 5, 10],
    help: 'Delta value for CLS (Cumulative Layout Shift)',
    labelNames,
    name: 'ui_cls_delta',
  });

  const fcp = new Histogram({
    buckets: linearBuckets(0, 250, 20),
    help: 'Delta value for FCP (First Contentful Paint) in ms',
    labelNames,
    name: 'ui_fcp_delta',
  });

  const fid = new Histogram({
    buckets: linearBuckets(0, 10, 20),
    help: 'Delta value for FID (First Input Delay) in ms',
    labelNames,
    name: 'ui_fid_delta',
  });

  return {
    observeWebVital(metric: Metric) {
      switch (metric.name) {
        case 'CLS':
          cls.observe(extractLabels(metric), metric.delta);
          break;
        case 'LCP':
          lcp.observe(extractLabels(metric), metric.delta);
          break;
        case 'FCP':
          fcp.observe(extractLabels(metric), metric.delta);
          break;
        case 'FID':
          fid.observe(extractLabels(metric), metric.delta);
          break;
      }
    },
  };
}
