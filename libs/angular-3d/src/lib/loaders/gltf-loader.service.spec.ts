import { GltfLoaderService } from './gltf-loader.service';

// Mock three-stdlib loaders
jest.mock('three-stdlib', () => {
  const mockScene = {
    traverse: jest.fn(),
    children: [],
  };

  const mockGltf = {
    scene: mockScene,
    scenes: [mockScene],
    animations: [],
    cameras: [],
    asset: { version: '2.0' },
  };

  return {
    GLTFLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn(
        (
          url: string,
          onLoad?: (gltf: typeof mockGltf) => void,
          onProgress?: (event: ProgressEvent) => void,
          onError?: (error: Error) => void
        ) => {
          // Simulate async load
          setTimeout(() => {
            if (url.includes('error')) {
              onError?.(new Error('GLTF load failed'));
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
              onLoad?.(mockGltf);
            }
          }, 0);
        }
      ),
      setDRACOLoader: jest.fn(),
      setMeshoptDecoder: jest.fn(),
    })),
    DRACOLoader: jest.fn().mockImplementation(() => ({
      setDecoderPath: jest.fn(),
      preload: jest.fn(),
      dispose: jest.fn(),
    })),
    MeshoptDecoder: {
      decode: jest.fn(),
    },
  };
});

describe('GltfLoaderService', () => {
  let service: GltfLoaderService;

  beforeEach(() => {
    service = new GltfLoaderService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.clearCache();
    service.disposeDracoLoader();
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
    it('should return GltfLoadResult with signal accessors', () => {
      const result = service.load('/assets/model.glb');

      expect(result.data).toBeDefined();
      expect(result.loading).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.progress).toBeDefined();
      expect(result.promise).toBeDefined();
      expect(typeof result.data).toBe('function');
      expect(result.promise instanceof Promise).toBe(true);
    });

    it('should set loading to true initially', () => {
      const result = service.load('/assets/model.glb');

      expect(result.loading()).toBe(true);
      expect(result.data()).toBeNull();
    });

    it('should load GLTF and update signals', async () => {
      const result = service.load('/assets/model.glb');

      // Wait for async load
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.loading()).toBe(false);
      expect(result.data()).toBeTruthy();
      expect(result.data()?.scene).toBeTruthy();
      expect(result.error()).toBeNull();
      expect(result.progress()).toBe(100);
    });

    it('should return same result for same URL while loading', () => {
      const result1 = service.load('/assets/model.glb');
      const result2 = service.load('/assets/model.glb');

      expect(result1).toBe(result2);
    });

    it('should return cached result for already loaded model', async () => {
      const result1 = service.load('/assets/model.glb');

      // Wait for load
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Load again - should get cached result
      const result2 = service.load('/assets/model.glb');

      expect(result2.loading()).toBe(false);
      expect(result2.data()).toBeTruthy();
    });
  });

  describe('loadAsync', () => {
    it('should return promise that resolves to GLTF', async () => {
      const gltf = await service.loadAsync('/assets/model.glb');

      expect(gltf).toBeTruthy();
      expect(gltf.scene).toBeTruthy();
    });

    it('should reject on error', async () => {
      await expect(service.loadAsync('/assets/error.glb')).rejects.toThrow(
        'GLTF load failed'
      );
    });
  });

  describe('Draco support', () => {
    it('should configure Draco loader when useDraco is true', () => {
      service.load('/assets/model.glb', { useDraco: true });

      const DRACOLoader = jest.requireMock('three-stdlib').DRACOLoader;
      expect(DRACOLoader).toHaveBeenCalled();
    });

    it('should use custom decoder path when provided', () => {
      service.load('/assets/model.glb', {
        useDraco: true,
        dracoDecoderPath: '/custom/draco/',
      });

      const DRACOLoader = jest.requireMock('three-stdlib').DRACOLoader;
      const mockInstance = DRACOLoader.mock.results[0]?.value;
      expect(mockInstance?.setDecoderPath).toHaveBeenCalledWith(
        '/custom/draco/'
      );
    });
  });

  describe('caching', () => {
    it('should cache loaded GLTF models', async () => {
      service.load('/assets/model.glb');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.isCached('/assets/model.glb')).toBe(true);
      expect(service.getCacheSize()).toBe(1);
    });

    it('should use different cache keys for different options', async () => {
      service.load('/assets/model.glb', { useDraco: false });
      service.load('/assets/model.glb', { useDraco: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Different options = different cache entries
      expect(service.getCacheSize()).toBe(2);
    });

    it('should return cached GLTF via getCached', async () => {
      service.load('/assets/model.glb');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const cached = service.getCached('/assets/model.glb');
      expect(cached).toBeTruthy();
      expect(cached?.scene).toBeTruthy();
    });
  });

  describe('cache management', () => {
    it('should clear entire cache', async () => {
      service.load('/assets/model1.glb');
      service.load('/assets/model2.glb');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.getCacheSize()).toBe(2);

      service.clearCache();

      expect(service.getCacheSize()).toBe(0);
    });

    it('should remove specific model from cache', async () => {
      service.load('/assets/model.glb');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.isCached('/assets/model.glb')).toBe(true);

      service.removeFromCache('/assets/model.glb');

      expect(service.isCached('/assets/model.glb')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle load errors', async () => {
      const result = service.load('/assets/error.glb');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.loading()).toBe(false);
      expect(result.error()).toBeTruthy();
      expect(result.error()?.message).toBe('GLTF load failed');
      expect(result.data()).toBeNull();
    });
  });

  describe('disposeDracoLoader', () => {
    it('should dispose Draco loader resources', async () => {
      // Initialize Draco loader
      service.load('/assets/model.glb', { useDraco: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Dispose
      service.disposeDracoLoader();

      // Should be able to reinitialize
      service.load('/assets/model2.glb', { useDraco: true });

      const DRACOLoader = jest.requireMock('three-stdlib').DRACOLoader;
      // Should have been created twice (once initially, once after dispose)
      expect(DRACOLoader.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
