import { BufferAttribute, BufferGeometry } from "three";

/**
 * Geometria em arrays crus. Atravessa do worker das ilhas para a página sem cópia
 * (os ArrayBuffer são transferidos), e só lá vira BufferGeometry.
 */
export interface MeshData {
  attributes: Record<string, { array: Float32Array; itemSize: number }>;
  index: Uint32Array;
}

export function toGeometry(mesh: MeshData): BufferGeometry {
  const geometry = new BufferGeometry();
  for (const [name, { array, itemSize }] of Object.entries(mesh.attributes)) {
    geometry.setAttribute(name, new BufferAttribute(array, itemSize));
  }
  geometry.setIndex(new BufferAttribute(mesh.index, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Os buffers a transferir no postMessage. */
export function meshBuffers(meshes: readonly (MeshData | null)[]): Transferable[] {
  return meshes.flatMap((mesh) =>
    mesh ? [...Object.values(mesh.attributes).map(({ array }) => array.buffer as ArrayBuffer), mesh.index.buffer as ArrayBuffer] : [],
  );
}
