import { collectDefaultMetrics, register } from 'prom-client';
import initWebVitals from './web-vitals';
import init, { type Metrics } from '.';

vi.mock('prom-client');
vi.mock('./web-vitals');

describe('[pkg] Metrics', () => {
  const appName = 'test';
  const appVersion = '1.1.0';

  let metrics: Metrics;

  beforeEach(() => {
    metrics = init({ appName, appVersion });
  });

  it('should collect default metrics', () => {
    expect(collectDefaultMetrics).toHaveBeenCalled();
  });

  it('should get registered metrics', async () => {
    const recordedMetrics = '...';
    vi.mocked(register.metrics).mockResolvedValue(recordedMetrics);

    expect(await metrics.getMetrics()).toBe(recordedMetrics);
  });

  it('should initialise metric observers', () => {
    expect(initWebVitals).toHaveBeenCalledWith({ appName, appVersion });
  });
});
