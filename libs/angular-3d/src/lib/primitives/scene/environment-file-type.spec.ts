import { detectFileType } from './environment-file-type';

describe('detectFileType', () => {
  describe('HDR routing (RGBELoader)', () => {
    it('routes .hdr files to hdr', () => {
      expect(detectFileType('/assets/studio.hdr')).toBe('hdr');
      expect(
        detectFileType(
          'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr'
        )
      ).toBe('hdr');
    });

    it('is case-insensitive', () => {
      expect(detectFileType('/assets/STUDIO.HDR')).toBe('hdr');
    });

    it('defaults to hdr for URLs without a recognized extension', () => {
      expect(detectFileType('/api/environment/latest')).toBe('hdr');
      expect(detectFileType('')).toBe('hdr');
    });
  });

  describe('EXR routing (EXRLoader)', () => {
    it('routes .exr files to exr', () => {
      expect(detectFileType('/assets/env.exr')).toBe('exr');
      expect(detectFileType('/assets/ENV.EXR')).toBe('exr');
    });
  });

  describe('LDR routing (THREE.TextureLoader)', () => {
    it.each(['.jpg', '.jpeg', '.png', '.webp'])(
      'routes %s files to ldr',
      (ext) => {
        expect(detectFileType(`/assets/panorama${ext}`)).toBe('ldr');
      }
    );

    it('is case-insensitive for LDR extensions', () => {
      expect(detectFileType('/assets/PANORAMA.JPG')).toBe('ldr');
      expect(detectFileType('/assets/sky.WebP')).toBe('ldr');
    });
  });

  describe('query strings and fragments', () => {
    it('ignores query strings when matching extensions', () => {
      expect(detectFileType('/assets/sky.jpg?v=2')).toBe('ldr');
      expect(detectFileType('/assets/env.exr?token=abc')).toBe('exr');
      expect(detectFileType('/assets/studio.hdr?cache=1')).toBe('hdr');
    });

    it('ignores hash fragments when matching extensions', () => {
      expect(detectFileType('/assets/sky.png#section')).toBe('ldr');
    });
  });
});
