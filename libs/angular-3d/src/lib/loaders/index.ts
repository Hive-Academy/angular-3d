// @hive-academy/angular-3d - Loaders module
// Texture and GLTF loaders with caching

// Services
export {
  TextureLoaderService,
  type TextureLoadState,
  type TextureLoadResult,
} from './texture-loader.service';

export {
  GltfLoaderService,
  type GltfLoaderOptions,
  type GltfLoadState,
  type GltfLoadResult,
} from './gltf-loader.service';

// Injectable functions
export {
  injectTextureLoader,
  type TextureLoaderResult,
} from './inject-texture-loader';

export { injectGltfLoader, type GltfLoaderResult } from './inject-gltf-loader';
