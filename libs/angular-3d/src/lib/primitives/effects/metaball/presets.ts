// Metaball Preset Types and Configurations
import * as THREE from 'three/webgpu';

/**
 * Available color/lighting presets for metaballs
 */
export type MetaballPreset =
  | 'moody'
  | 'cosmic'
  | 'neon'
  | 'sunset'
  | 'holographic'
  | 'minimal';

/**
 * Position presets for quick sphere placement
 */
export type MetaballPositionPreset =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center';

/**
 * Normalized screen coordinates for position presets
 */
export const POSITION_PRESET_COORDS: Record<
  MetaballPositionPreset,
  [number, number]
> = {
  'top-left': [0.08, 0.92],
  'top-right': [0.92, 0.92],
  'bottom-left': [0.08, 0.08],
  'bottom-right': [0.92, 0.08],
  center: [0.5, 0.5],
  'top-center': [0.5, 0.92],
  'bottom-center': [0.5, 0.08],
  'left-center': [0.08, 0.5],
  'right-center': [0.92, 0.5],
};

/**
 * Configuration for metaball visual presets
 */
export interface MetaballPresetConfig {
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  specularPower: number;
  fresnelPower: number;
  backgroundColor: THREE.Color;
  sphereColor: THREE.Color;
  lightColor: THREE.Color;
  lightPosition: THREE.Vector3;
  smoothness: number;
  contrast: number;
  fogDensity: number;
  cursorGlowIntensity: number;
  cursorGlowRadius: number;
  cursorGlowColor: THREE.Color;
}

/**
 * Creates preset configurations with device-aware adjustments
 */
export function createMetaballPresets(
  _isMobile: boolean
): Record<MetaballPreset, MetaballPresetConfig> {
  return {
    moody: {
      ambientIntensity: 0.02,
      diffuseIntensity: 0.6,
      specularIntensity: 1.8,
      specularPower: 8,
      fresnelPower: 1.2,
      backgroundColor: new THREE.Color(0x050505),
      sphereColor: new THREE.Color(0x000000),
      lightColor: new THREE.Color(0xffffff),
      lightPosition: new THREE.Vector3(1, 1, 1),
      smoothness: 0.3,
      contrast: 2.0,
      fogDensity: 0.12,
      cursorGlowIntensity: 0.4,
      cursorGlowRadius: 1.2,
      cursorGlowColor: new THREE.Color(0xffffff),
    },
    cosmic: {
      ambientIntensity: 0.03,
      diffuseIntensity: 0.8,
      specularIntensity: 1.6,
      specularPower: 6,
      fresnelPower: 1.4,
      backgroundColor: new THREE.Color(0x000011),
      sphereColor: new THREE.Color(0x000022),
      lightColor: new THREE.Color(0x88aaff),
      lightPosition: new THREE.Vector3(0.5, 1, 0.5),
      smoothness: 0.4,
      contrast: 2.0,
      fogDensity: 0.15,
      cursorGlowIntensity: 0.8,
      cursorGlowRadius: 1.5,
      cursorGlowColor: new THREE.Color(0x4477ff),
    },
    neon: {
      ambientIntensity: 0.04,
      diffuseIntensity: 1.0,
      specularIntensity: 2.0,
      specularPower: 4,
      fresnelPower: 1.0,
      backgroundColor: new THREE.Color(0x000505),
      sphereColor: new THREE.Color(0x000808),
      lightColor: new THREE.Color(0x00ffcc),
      lightPosition: new THREE.Vector3(0.7, 1.3, 0.8),
      smoothness: 0.7,
      contrast: 2.0,
      fogDensity: 0.08,
      cursorGlowIntensity: 0.8,
      cursorGlowRadius: 1.4,
      cursorGlowColor: new THREE.Color(0x00ffaa),
    },
    sunset: {
      ambientIntensity: 0.04,
      diffuseIntensity: 0.7,
      specularIntensity: 1.4,
      specularPower: 7,
      fresnelPower: 1.5,
      backgroundColor: new THREE.Color(0x150505),
      sphereColor: new THREE.Color(0x100000),
      lightColor: new THREE.Color(0xff6622),
      lightPosition: new THREE.Vector3(1.2, 0.4, 0.6),
      smoothness: 0.35,
      contrast: 2.0,
      fogDensity: 0.1,
      cursorGlowIntensity: 0.8,
      cursorGlowRadius: 1.4,
      cursorGlowColor: new THREE.Color(0xff4422),
    },
    holographic: {
      ambientIntensity: 0.12,
      diffuseIntensity: 1.2,
      specularIntensity: 2.5,
      specularPower: 3,
      fresnelPower: 0.8,
      backgroundColor: new THREE.Color(0x0a0a15),
      sphereColor: new THREE.Color(0x050510),
      lightColor: new THREE.Color(0xccaaff),
      lightPosition: new THREE.Vector3(0.9, 0.9, 1.2),
      smoothness: 0.8,
      contrast: 1.6,
      fogDensity: 0.06,
      cursorGlowIntensity: 1.2,
      cursorGlowRadius: 2.2,
      cursorGlowColor: new THREE.Color(0xaa77ff),
    },
    minimal: {
      ambientIntensity: 0.0,
      diffuseIntensity: 0.25,
      specularIntensity: 1.3,
      specularPower: 11,
      fresnelPower: 1.7,
      backgroundColor: new THREE.Color(0x0a0a0a),
      sphereColor: new THREE.Color(0x000000),
      lightColor: new THREE.Color(0xffffff),
      lightPosition: new THREE.Vector3(1, 0.5, 0.8),
      smoothness: 0.25,
      contrast: 2.0,
      fogDensity: 0.1,
      cursorGlowIntensity: 0.3,
      cursorGlowRadius: 1.0,
      cursorGlowColor: new THREE.Color(0xffffff),
    },
  };
}

/**
 * Get background color hex for a preset (useful for Scene3dComponent)
 */
export function getPresetBackgroundHex(preset: MetaballPreset): number {
  const colors: Record<MetaballPreset, number> = {
    moody: 0x050505,
    cosmic: 0x000011,
    neon: 0x000505,
    sunset: 0x150505,
    holographic: 0x0a0a15,
    minimal: 0x0a0a0a,
  };
  return colors[preset];
}

/**
 * Get light color hex string for a preset
 */
export function getPresetLightColor(preset: MetaballPreset): string {
  const colors: Record<MetaballPreset, string> = {
    moody: '#ffffff',
    cosmic: '#88aaff',
    neon: '#00ffcc',
    sunset: '#ff6622',
    holographic: '#ccaaff',
    minimal: '#ffffff',
  };
  return colors[preset];
}
