import {
  type BufferGeometry,
  type Curve,
  CylinderGeometry,
  ExtrudeGeometry,
  InstancedMesh,
  LatheGeometry,
  type Material,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Shape,
  SplineCurve,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Pontos 2D curtos: [x, y]. */
export type P2 = readonly [number, number];

const v2 = ([x, y]: P2) => new Vector2(x, y);

/** Chapa: um perfil lateral extrudado na largura, centrado em z, com a borda arredondada. */
export function slab(shape: Shape, depth: number, bevel = 0.02, curveSegments = 10): BufferGeometry {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

export function polygon(points: readonly P2[]): Shape {
  return new Shape(points.map(v2));
}

/**
 * Faixa de largura variável ao longo de uma curva, com as pontas redondas (onde ficam os pinos):
 * o perfil da lança, do braço e dos braços da pá.
 */
export function band(curve: Curve<Vector2>, width: (t: number) => number, segments = 32, capSegments = 10): Shape {
  const upper: Vector2[] = [];
  const lower: Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const normal = new Vector2(-tangent.y, tangent.x).multiplyScalar(width(t) / 2);
    upper.push(p.clone().add(normal));
    lower.push(p.clone().sub(normal));
  }
  const cap = (t: number, from: number) => {
    const center = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const radius = width(t) / 2;
    const start = Math.atan2(tangent.y, tangent.x) + Math.PI / 2 + from;
    const points: Vector2[] = [];
    for (let k = 1; k < capSegments; k++) {
      const a = start - (Math.PI * k) / capSegments;
      points.push(new Vector2(center.x + radius * Math.cos(a), center.y + radius * Math.sin(a)));
    }
    return points;
  };
  return new Shape([...upper, ...cap(1, 0), ...lower.reverse(), ...cap(0, -Math.PI)]);
}

/** Chapa curva de espessura constante (o fundo das caçambas), a partir de uma linha de pontos. */
export function shell(points: readonly P2[], thickness: number, depth: number): BufferGeometry {
  const curve = new SplineCurve(points.map(v2));
  return slab(band(curve, () => thickness, 48, 4), depth, 0.008, 4);
}

export function roundedBox(width: number, height: number, depth: number, radius = 0.03): BufferGeometry {
  return new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, width / 2, height / 2, depth / 2));
}

/** Cilindro deitado no eixo z (pinos, eixos, tubos transversais). */
export function rodZ(radius: number, length: number, segments = 18): BufferGeometry {
  return new CylinderGeometry(radius, radius, length, segments).rotateX(Math.PI / 2);
}

/** Cilindro em pé, com a base em y = 0. */
export function post(radius: number, height: number, segments = 16, top = radius): BufferGeometry {
  return new CylinderGeometry(top, radius, height, segments).translate(0, height / 2, 0);
}

// ---------- Pneus e aros ----------

export interface TireSpec {
  radius: number;
  width: number;
  rim: number;
  /** Garras por fileira (são duas fileiras, em V). */
  lugs: number;
}

/** A carcaça do pneu (perfil girado) com o eixo em z, e as garras do desenho em V. */
export function tire({ radius, width, rim, lugs }: TireSpec) {
  const half = width / 2;
  const crown = radius - 0.045;
  const profile: P2[] = [
    [rim + 0.005, -half * 0.8],
    [rim + 0.05, -half * 0.96],
    [rim + (crown - rim) * 0.5, -half],
    [crown - 0.06, -half * 0.97],
    [crown - 0.015, -half * 0.86],
    [crown, -half * 0.62],
    [crown + 0.004, 0],
    [crown, half * 0.62],
    [crown - 0.015, half * 0.86],
    [crown - 0.06, half * 0.97],
    [rim + (crown - rim) * 0.5, half],
    [rim + 0.05, half * 0.96],
    [rim + 0.005, half * 0.8],
  ];
  const carcass = new LatheGeometry(profile.map(v2), 64).rotateX(Math.PI / 2);

  const height = 0.034 * (radius / 0.72);
  const lug = roundedBox(0.07 * (radius / 0.72), height, width * 0.5, 0.012);
  const matrices: Matrix4[] = [];
  const axis = new Vector3(0, 0, 1);
  const up = new Vector3(0, 1, 0);
  for (const side of [-1, 1]) {
    for (let i = 0; i < lugs; i++) {
      const phi = ((i + (side > 0 ? 0.5 : 0)) / lugs) * Math.PI * 2;
      const r = crown + height / 2 - 0.006;
      const q = new Quaternion()
        .setFromAxisAngle(axis, phi - Math.PI / 2)
        .multiply(new Quaternion().setFromAxisAngle(up, side * 0.5));
      const position = new Vector3(Math.cos(phi) * r, Math.sin(phi) * r, side * half * 0.36);
      matrices.push(new Matrix4().compose(position, q, new Vector3(1, 1, 1)));
    }
  }
  return { carcass, lug, matrices };
}

/** Aro de roda (a face de fora em +z) e a posição dos parafusos. */
export function wheelRim(rim: number, width: number) {
  const half = width / 2;
  const profile: P2[] = [
    [0.001, half * 0.42],
    [0.085, half * 0.42],
    [0.1, half * 0.36],
    [0.115, half * 0.2],
    [0.17, half * 0.16],
    [rim * 0.72, half * 0.16],
    [rim * 0.84, half * 0.34],
    [rim - 0.012, half * 0.7],
    [rim + 0.028, half * 0.76],
    [rim + 0.03, half * 0.84],
  ];
  const disc = new LatheGeometry(profile.map(v2), 48).rotateX(Math.PI / 2);
  const bolt = rodZ(0.017, 0.03, 8);
  const bolts: Matrix4[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    bolts.push(new Matrix4().makeTranslation(Math.cos(a) * 0.138, Math.sin(a) * 0.138, half * 0.2));
  }
  return { disc, bolt, bolts };
}

// ---------- Hidráulica ----------

export interface CylinderSpec {
  radius: number;
  barrel: number;
  rod: number;
}

/**
 * Cilindro hidráulico entre dois pontos de fixação, em peças diferentes: a camisa sai de `a`
 * apontando para `b`, a haste cromada sai de `b` apontando para `a`. Conforme as juntas giram,
 * a haste entra e sai da camisa. Chame `update()` depois de mexer nas juntas.
 */
export class HydraulicCylinder {
  private readonly barrel: Mesh;
  private readonly rod: Mesh;
  private readonly pa = new Vector3();
  private readonly pb = new Vector3();

  constructor(
    private readonly parent: Object3D,
    private readonly a: Object3D,
    private readonly b: Object3D,
    geometry: { barrel: BufferGeometry; rod: BufferGeometry },
    materials: { barrel: Material; rod: Material },
  ) {
    this.barrel = new Mesh(geometry.barrel, materials.barrel);
    this.rod = new Mesh(geometry.rod, materials.rod);
    this.barrel.castShadow = true;
    this.rod.castShadow = true;
    parent.add(this.barrel, this.rod);
  }

  update() {
    this.a.getWorldPosition(this.pa);
    this.b.getWorldPosition(this.pb);
    this.barrel.position.copy(this.parent.worldToLocal(this.pa.clone()));
    this.rod.position.copy(this.parent.worldToLocal(this.pb.clone()));
    this.barrel.lookAt(this.pb);
    this.rod.lookAt(this.pa);
  }
}

/** Geometria de um cilindro: camisa com olhal na base e haste com olhal na ponta, os dois no eixo +z. */
export function cylinderGeometry({ radius, barrel, rod }: CylinderSpec) {
  const tube = new CylinderGeometry(radius, radius, barrel, 18).rotateX(Math.PI / 2).translate(0, 0, barrel / 2);
  const rodGeometry = new CylinderGeometry(radius * 0.52, radius * 0.52, rod, 14)
    .rotateX(Math.PI / 2)
    .translate(0, 0, rod / 2);
  return { barrel: tube, rod: rodGeometry };
}

/**
 * Junta as peças fixas de um grupo por material: a mesma imagem com bem menos chamadas de desenho
 * (no celular faz diferença). `keep`: peças que se mexem sozinhas e precisam ficar separadas.
 * Devolve as geometrias novas, para descartar no fim.
 */
export function mergeStatic(group: Object3D, keep: ReadonlySet<Object3D>): BufferGeometry[] {
  const byMaterial = new Map<Material, Mesh[]>();
  for (const child of group.children) {
    if (!(child instanceof Mesh) || child instanceof InstancedMesh || keep.has(child)) continue;
    const material = child.material as Material;
    byMaterial.set(material, [...(byMaterial.get(material) ?? []), child]);
  }
  const created: BufferGeometry[] = [];
  for (const [material, meshes] of byMaterial) {
    if (meshes.length < 2) continue;
    // Umas geometrias têm índice e outras não: sem índice, todas se juntam.
    const parts = meshes.map((mesh) => {
      mesh.updateMatrix();
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      return geometry.applyMatrix4(mesh.matrix);
    });
    const merged = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (!merged) continue;
    const mesh = new Mesh(merged, material);
    mesh.castShadow = meshes[0].castShadow;
    mesh.receiveShadow = meshes[0].receiveShadow;
    group.remove(...meshes);
    group.add(mesh);
    created.push(merged);
  }
  return created;
}

/** Ponto de fixação: um Object3D vazio preso numa peça. */
export function anchor(parent: Object3D, x: number, y: number, z: number): Object3D {
  const point = new Object3D();
  point.position.set(x, y, z);
  parent.add(point);
  return point;
}
