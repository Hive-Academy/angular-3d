/**
 * Type declarations for Three.js TSL addons
 *
 * These modules are JavaScript-only in Three.js and don't have official TypeScript definitions.
 * This file provides minimal type declarations for the TSL postprocessing nodes we use.
 *
 * @see https://threejs.org/docs/#examples/en/tsl/display/BloomNode
 * @see https://threejs.org/docs/#examples/en/tsl/display/DepthOfFieldNode
 */

declare module 'three/addons/tsl/display/BloomNode.js' {
  import { TempNode, Node } from 'three/webgpu';

  /**
   * BloomNode - Post processing node for creating a bloom effect.
   *
   * @param inputNode - The node that represents the input of the effect
   * @param strength - The strength of the bloom (default: 1)
   * @param radius - The radius of the bloom, must be in [0,1] (default: 0)
   * @param threshold - The luminance threshold (default: 0)
   */
  export class BloomNode extends TempNode {
    public constructor(
      inputNode: Node,
      strength?: number,
      radius?: number,
      threshold?: number
    );

    public inputNode: Node;
    public strength: { value: number };
    public radius: { value: number };
    public threshold: { value: number };
    public smoothWidth: { value: number };

    public getTextureNode(): Node;
    public setSize(width: number, height: number): void;
    public dispose(): void;
  }

  /**
   * TSL function for creating a bloom effect.
   */
  export function bloom(
    node: Node,
    strength?: number,
    radius?: number,
    threshold?: number
  ): BloomNode;

  // Default export
  export default BloomNode;
}

declare module 'three/addons/tsl/display/DepthOfFieldNode.js' {
  import { TempNode, Node } from 'three/webgpu';

  /**
   * DepthOfFieldNode - Post processing node for creating depth of field effect.
   *
   * @param textureNode - The texture node that represents the input of the effect
   * @param viewZNode - Represents the viewZ depth values of the scene
   * @param focusDistanceNode - The focus distance in world units
   * @param focalLengthNode - How far an object can be from focal plane before going out-of-focus
   * @param bokehScaleNode - A unitless value to adjust the size of the bokeh
   */
  export class DepthOfFieldNode extends TempNode {
    public constructor(
      textureNode: Node,
      viewZNode: Node,
      focusDistanceNode?: Node | number,
      focalLengthNode?: Node | number,
      bokehScaleNode?: Node | number
    );

    public textureNode: Node;
    public viewZNode: Node;
    public focusDistanceNode: Node;
    public focalLengthNode: Node;
    public bokehScaleNode: Node;

    public getTextureNode(): Node;
    public setSize(width: number, height: number): void;
    public dispose(): void;
  }

  /**
   * TSL function for creating a depth-of-field effect.
   */
  export function dof(
    node: Node,
    viewZNode: Node,
    focusDistance?: Node | number,
    focalLength?: Node | number,
    bokehScale?: Node | number
  ): DepthOfFieldNode;

  // Default export
  export default DepthOfFieldNode;
}

declare module 'three/addons/tsl/display/GaussianBlurNode.js' {
  import { TempNode, Node } from 'three/webgpu';

  /**
   * GaussianBlurNode - Post processing node for gaussian blur.
   */
  export class GaussianBlurNode extends TempNode {
    public constructor(textureNode: Node, directionNode?: Node, sigma?: number);
    public dispose(): void;
  }

  /**
   * TSL function for creating gaussian blur.
   */
  export function gaussianBlur(
    node: Node,
    directionNode?: Node,
    sigma?: number
  ): GaussianBlurNode;

  // Default export
  export default GaussianBlurNode;
}
