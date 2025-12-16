import { TextureLoaderService } from './texture-loader.service';

// Mock Three.js TextureLoader
jest.mock('three', () => {
  const originalModule = jest.requireActual('three');

  // Create mock texture class
  class MockTexture {
    public uuid = 'mock-texture-uuid';
    public dispose = jest.fn();
  }

  return {
    ...originalModule,
    Texture: MockTexture,
    TextureLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn(
        (
          url: string,
          onLoad?: (texture: InstanceType<typeof MockTexture>) => void,
          onProgress?: (event: ProgressEvent) => void,
          onError?: (error: Error) => void
        ) => {
          const texture = new MockTexture();
          // Simulate async load
          setTimeout(() => {
            if (url.includes('error')) {
              onError?.(new Error('Load failed'));
            } else {
              onProgress?.({
                loaded: 50,
                total: 100,
                lengthComputable: true,
              } as ProgressEvent);
              onProgress?.({
                loaded: 100,
                total: 100,
                lengthComputable: true,
              } as ProgressEvent);
              onLoad?.(texture);
            }
          }, 0);
          return texture;
        }
      ),
    })),
  };
});

describe('TextureLoaderService', () => {
  let service: TextureLoaderService;

  beforeEach(() => {
    service = new TextureLoaderService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty cache initially', () => {
      expect(service.getCacheSize()).toBe(0);
    });
  });

  describe('load', () => {
    it('should return TextureLoadResult with signal accessors', () => {
      const result = service.load('/assets/test.jpg');

      expect(result.data).toBeDefined();
      expect(result.loading).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.progress).toBeDefined();
      expect(typeof result.data).toBe('function');
      expect(typeof result.loading).toBe('function');
    });

    it('should set loading to true initially', () => {
      const result = service.load('/assets/test.jpg');

      expect(result.loading()).toBe(true);
      expect(result.data()).toBeNull();
    });

    it('should load texture and update signals', async () => {
      const result = service.load('/assets/test.jpg');

      // Wait for async load
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.loading()).toBe(false);
      expect(result.data()).toBeTruthy();
      expect(result.error()).toBeNull();
      expect(result.progress()).toBe(100);
    });

    it('should return same result for same URL while loading', () => {
      const result1 = service.load('/assets/test.jpg');
      const result2 = service.load('/assets/test.jpg');

      expect(result1).toBe(result2);
    });

    it('should return cached result for already loaded texture', async () => {
      const result1 = service.load('/assets/test.jpg');

      // Wait for load
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Load again - should get cached result
      const result2 = service.load('/assets/test.jpg');

      expect(result2.loading()).toBe(false);
      expect(result2.data()).toBeTruthy();
    });
  });

  describe('caching', () => {
    it('should cache loaded textures', async () => {
      service.load('/assets/test.jpg');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.isCached('/assets/test.jpg')).toBe(true);
      expect(service.getCacheSize()).toBe(1);
    });

    it('should return cached texture via getCached', async () => {
      service.load('/assets/test.jpg');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const cached = service.getCached('/assets/test.jpg');
      expect(cached).toBeTruthy();
    });

    it('should return undefined for non-cached URL', () => {
      const cached = service.getCached('/assets/not-loaded.jpg');
      expect(cached).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('should clear cache and dispose textures', async () => {
      service.load('/assets/test1.jpg');
      service.load('/assets/test2.jpg');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.getCacheSize()).toBe(2);

      service.clearCache();

      expect(service.getCacheSize()).toBe(0);
    });

    it('should remove specific texture from cache', async () => {
      service.load('/assets/test.jpg');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.isCached('/assets/test.jpg')).toBe(true);

      service.removeFromCache('/assets/test.jpg');

      expect(service.isCached('/assets/test.jpg')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle load errors', async () => {
      const result = service.load('/assets/error.jpg');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.loading()).toBe(false);
      expect(result.error()).toBeTruthy();
      expect(result.error()?.message).toBe('Load failed');
      expect(result.data()).toBeNull();
    });
  });
});
