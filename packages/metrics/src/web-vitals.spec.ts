import { Histogram } from 'prom-client';
import type { Metric } from 'web-vitals';
import init from './web-vitals';

vi.mock('prom-client');

describe('[module] Web Vital Metrics', () => {
  const appName = 'test app';
  const appVersion = '1.1.0';

  let observe: (metric: Metric) => void;
  let histogram: Histogram;

  beforeEach(() => {
    histogram = new Histogram({ help: 'A test metric', name: 'test_metric' });

    vi.spyOn(histogram, 'observe');
    vi.mocked(Histogram).mockReturnValue(histogram);

    const { observeWebVital } = init({ appName, appVersion });
    observe = observeWebVital;
  });

  it('should record a fcp web vital metric', () => {
    const webVital: Metric = {
      delta: 0.4,
      entries: [],
      id: 'fcp-123',
      name: 'FCP',
      navigationType: 'navigate',
      rating: 'good',
      value: 0.4,
    };

    observe(webVital);

    expect(histogram.observe).toHaveBeenCalledWith(
      {
        appName,
        appVersion,
        navigationType: webVital.navigationType,
        rating: webVital.rating,
      },
      webVital.delta,
    );
  });

  it('should record a cls web vital metric', () => {
    const webVital: Metric = {
      delta: 0.6,
      entries: [],
      id: 'cls-123',
      name: 'CLS',
      navigationType: 'reload',
      rating: 'poor',
      value: 0.6,
    };

    observe(webVital);

    expect(histogram.observe).toHaveBeenCalledWith(
      {
        appName,
        appVersion,
        navigationType: webVital.navigationType,
        rating: webVital.rating,
      },
      webVital.delta,
    );
  });

  it('should record a fid web vital metric', () => {
    const webVital: Metric = {
      delta: 2.4,
      entries: [],
      id: 'fid-123',
      name: 'FID',
      navigationType: 'navigate',
      rating: 'needs-improvement',
      value: 2.4,
    };

    observe(webVital);

    expect(histogram.observe).toHaveBeenCalledWith(
      {
        appName,
        appVersion,
        navigationType: webVital.navigationType,
        rating: webVital.rating,
      },
      webVital.delta,
    );
  });

  it('should record an lcp web vital metric', () => {
    const webVital: Metric = {
      delta: 0.2,
      entries: [],
      id: 'lcp-123',
      name: 'LCP',
      navigationType: 'navigate',
      rating: 'good',
      value: 0.2,
    };

    observe(webVital);

    expect(histogram.observe).toHaveBeenCalledWith(
      {
        appName,
        appVersion,
        navigationType: webVital.navigationType,
        rating: webVital.rating,
      },
      webVital.delta,
    );
  });
});
