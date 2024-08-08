import logger from 'pino';
import { createLogger } from './index';

vi.mock('pino');

describe('[pkg] Logger', () => {
  it('should create logger with defaults', () => {
    createLogger();

    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      redact: ['headers.Authorization'],
    });
  });

  it('should create logger with settings', () => {
    const level = 'debug';
    const redact = ['secure.path'];

    createLogger({ level, redact });
    expect(logger).toHaveBeenCalledWith({ level, redact });
  });
});
