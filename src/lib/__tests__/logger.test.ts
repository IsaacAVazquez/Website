import { logger } from '../logger';

describe('Logger', () => {
  let consoleSpy: {
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── warn ──────────────────────────────────────────────────────────────────

  describe('warn', () => {
    it('calls console.warn with [WARN] prefix in development', () => {
      logger.warn('something suspicious');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.anything()
      );
    });

    it('includes optional data in the call', () => {
      logger.warn('problem', { code: 42 });
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        { code: 42 }
      );
    });
  });

  // ─── error ─────────────────────────────────────────────────────────────────

  describe('error', () => {
    it('always calls console.error regardless of environment', () => {
      logger.error('boom');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.anything()
      );
    });

    it('includes error object when provided', () => {
      const err = new Error('test error');
      logger.error('something failed', err);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        err
      );
    });

    it('handles missing optional error argument', () => {
      expect(() => logger.error('bare message')).not.toThrow();
    });
  });

  // ─── production ────────────────────────────────────────────────────────────

  // The logger reads NODE_ENV once at import, so production needs its own copy.
  it('keeps warn silent in production and still logs errors', () => {
    const original = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        const { logger: productionLogger } = require('../logger') as typeof import('../logger');
        productionLogger.warn('quiet');
        productionLogger.error('loud');
      });
    } finally {
      Object.defineProperty(process.env, 'NODE_ENV', { value: original, writable: true });
    }

    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), expect.anything());
  });
});
