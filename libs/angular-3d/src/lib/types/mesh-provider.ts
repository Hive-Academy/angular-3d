import { Mesh } from 'three';
import { InjectionToken } from '@angular/core';

/**
 * Interface for components that provide access to a Three.js mesh
 * Used by directives (float3d, rotate3d) to access and animate meshes
 */
export interface MeshProvider {
  /**
   * Get the Three.js mesh instance
   * Returns null if mesh is not yet initialized
   */
  getMesh(): Mesh | null;
}

/**
 * Injection token for MeshProvider
 * Components implement MeshProvider and provide themselves via this token
 * Directives inject this token to access the host component's mesh
 */
export const MESH_PROVIDER = new InjectionToken<MeshProvider>('MESH_PROVIDER');
