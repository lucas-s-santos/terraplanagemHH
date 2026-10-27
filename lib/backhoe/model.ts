import {
  ArcCurve,
  type BufferGeometry,
  CatmullRomCurve3,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  type Material,
  Mesh,
  type Object3D,
  QuadraticBezierCurve,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import type { BackhoeMaterials } from "./materials";
import {
  HydraulicCylinder,
  type P2,
  type TireSpec,
  anchor,
  band,
  mergeStatic,
  cylinderGeometry,
  polygon,
  post,
  rodZ,
  roundedBox,
  shell,
  slab,
  tire,
  wheelRim,
} from "./parts";

/**
 * Retroescavadeira genérica, sem marca, em metros: +x é a frente (pá carregadeira),
 * -x a traseira (a retro), y para cima, chão em y = 0. Medidas de uma máquina média
 * (entre-eixos de 2,2 m, pneu traseiro de 1,44 m).
 */

/** A posição de cada junta. Ângulos em radianos; 0 a 1 nas sapatas e na carga. */
export interface Pose {
  /** Giro da retro (positivo para +z). */
  swing: number;
  /** Lança: negativo levanta. */
  boom: number;
  /** Braço: positivo recolhe para perto da máquina. */
  stick: number;
  /** Caçamba de trás: positivo fecha (enche), negativo abre (despeja). */
  bucket: number;
  /** Braço da pá: positivo levanta. */
  loaderLift: number;
  /** Pá: positivo inclina para trás. */
  loaderTilt: number;
  /** Sapatas: 0 recolhidas, 1 no chão. */
  stabilizers: number;
  /** Terra na caçamba de trás: 0 vazia, 1 cheia. */
  load: number;
}

const REAR: TireSpec & { x: number; z: number } = { x: -0.95, z: 0.93, radius: 0.72, width: 0.48, rim: 0.34, lugs: 28 };
const FRONT: TireSpec & { x: number; z: number } = { x: 1.3, z: 0.86, radius: 0.53, width: 0.34, rim: 0.23, lugs: 22 };

/** Onde cada junta fica na máquina. */
const SWING_PIVOT = new Vector3(-2.38, 0.9, 0);
const BOOM_PIVOT: P2 = [-0.18, 0.42];
const BOOM_TIP: P2 = [-2.5, 0.05];
const STICK_LENGTH = 1.75;
const LOADER_PIVOT = new Vector3(0.47, 1.68, 0);
const LOADER_TIP: P2 = [2.45, -1.16];
const ARM_Z = 0.71;

/** A articulação da caçamba de trás (no plano do braço): balancim e biela. */
const ROCKER_PIVOT = new Vector2(-0.03, -STICK_LENGTH + 0.28);
const BUCKET_LINK_PIN = new Vector2(-0.22, 0.04);
const ROCKER_REST = new Vector2(-0.32, -STICK_LENGTH + 0.27);
const ROCKER_LENGTH = ROCKER_REST.distanceTo(ROCKER_PIVOT);
const LINK_LENGTH = ROCKER_REST.distanceTo(new Vector2(0, -STICK_LENGTH).add(BUCKET_LINK_PIN));

export function createBackhoe(m: BackhoeMaterials) {
  const geometries: BufferGeometry[] = [];
  const keep = <T extends BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };
  const mesh = (parent: Object3D, geometry: BufferGeometry, material: Material, x = 0, y = 0, z = 0) => {
    const item = new Mesh(keep(geometry), material);
    item.position.set(x, y, z);
    item.castShadow = material !== m.glass;
    item.receiveShadow = material !== m.glass;
    parent.add(item);
    return item;
  };
  /** O mesmo objeto nos dois lados (z e -z). */
  const mirrored = (fn: (side: 1 | -1) => void) => {
    fn(1);
    fn(-1);
  };
  const pinGeometries = new Map<string, BufferGeometry>();
  /** Pino prateado atravessando uma junta. */
  const pin = (parent: Object3D, x: number, y: number, radius: number, length: number, z = 0) => {
    const key = `${radius}-${length}`;
    let geometry = pinGeometries.get(key);
    if (!geometry) {
      geometry = keep(rodZ(radius, length, 20));
      pinGeometries.set(key, geometry);
    }
    const item = new Mesh(geometry, m.pin);
    item.position.set(x, y, z);
    item.castShadow = true;
    parent.add(item);
    return item;
  };

  const root = new Group();
  const body = new Group();
  root.add(body);

  // ---------- Chassi, eixos e capô ----------
  mesh(body, roundedBox(3.85, 0.36, 0.8, 0.05), m.steel, 0.07, 0.68, 0);
  mesh(body, rodZ(0.12, 1.62), m.steel, REAR.x, REAR.radius, 0);
  mesh(body, rodZ(0.09, 1.5), m.steel, FRONT.x, FRONT.radius, 0);
  // Tanque e caixa de ferramentas entre as rodas, com o degrau da cabine.
  mesh(body, roundedBox(0.82, 0.46, 1.24, 0.04), m.steel, 0.3, 0.72, 0);
  mirrored((s) => {
    mesh(body, roundedBox(0.42, 0.03, 0.2, 0.01), m.paint, -0.05, 0.5, s * 0.76);
    mesh(body, roundedBox(0.42, 0.03, 0.2, 0.01), m.paint, -0.05, 0.82, s * 0.76);
    mesh(body, roundedBox(0.03, 0.4, 0.2, 0.01), m.steel, -0.26, 0.66, s * 0.76);
    mesh(body, roundedBox(0.03, 0.4, 0.2, 0.01), m.steel, 0.16, 0.66, s * 0.76);
  });

  const hood = polygon([
    [0.42, 0.9],
    [2.0, 0.9],
    [2.06, 1.02],
    [2.06, 1.28],
    [1.96, 1.42],
    [0.42, 1.7],
  ]);
  mesh(body, slab(hood, 0.84, 0.06), m.paint);
  // Tampa escura do radiador, no caimento do capô, e a grade da frente.
  const slope = Math.atan2(1.7 - 1.42, 0.42 - 1.96);
  const radiator = mesh(body, roundedBox(0.62, 0.03, 0.78, 0.012), m.steel, 1.62, 1.545, 0);
  radiator.rotation.z = slope + Math.PI;
  mesh(body, roundedBox(0.05, 0.36, 0.74, 0.012), m.steel, 2.13, 1.15, 0);
  for (let i = 0; i < 5; i++) mesh(body, roundedBox(0.02, 0.025, 0.7, 0.005), m.interior, 2.16, 1.02 + i * 0.065, 0);
  mirrored((s) => mesh(body, roundedBox(0.04, 0.08, 0.14, 0.01), m.lamp, 2.14, 1.36, s * 0.32));
  // Para-choque (contrapeso) da frente.
  mesh(body, roundedBox(0.24, 0.32, 1.02, 0.05), m.paint, 2.2, 0.74, 0);

  // Torres onde o braço da pá se articula, dos dois lados do capô.
  const tower = polygon([
    [0.18, 0.86],
    [0.9, 0.86],
    [0.62, 1.8],
    [0.32, 1.8],
  ]);
  mirrored((s) => {
    mesh(body, slab(tower, 0.06, 0.015), m.paint, 0, 0, s * 0.6);
    pin(body, LOADER_PIVOT.x, LOADER_PIVOT.y, 0.055, 0.34, s * 0.66);
  });

  // ---------- Para-lamas ----------
  const arch = (radius: number, from: number, to: number) => new ArcCurve(0, 0, radius, from, to, false);
  mirrored((s) => {
    const rear = mesh(body, slab(band(arch(0.84, 0.12, Math.PI - 0.05), () => 0.07, 40, 4), 0.5, 0.03), m.paint);
    rear.position.set(REAR.x, REAR.radius, s * REAR.z);
    const inner: P2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = 0.28 + ((Math.PI - 0.56) * i) / 24;
      inner.push([REAR.x + Math.cos(a) * 0.86, REAR.radius + Math.sin(a) * 0.86]);
    }
    mesh(body, slab(polygon(inner), 0.04, 0.01), m.paint, 0, 0, s * 0.68);
    const front = mesh(body, slab(band(arch(0.6, 0.35, Math.PI - 0.35), () => 0.05, 32, 4), 0.38, 0.015), m.steel);
    front.position.set(FRONT.x, FRONT.radius, s * FRONT.z);
  });

  // ---------- Rodas ----------
  const wheel = (spec: typeof REAR, side: 1 | -1) => {
    const group = new Group();
    group.position.set(spec.x, spec.radius, side * spec.z);
    // A face de fora do aro fica em +z: do outro lado, gira a roda.
    if (side < 0) group.rotation.y = Math.PI;
    const { carcass, lug, matrices } = tire(spec);
    mesh(group, carcass, m.rubber);
    const lugs = new InstancedMesh(keep(lug), m.rubber, matrices.length);
    matrices.forEach((matrix, i) => lugs.setMatrixAt(i, matrix));
    lugs.castShadow = true;
    lugs.receiveShadow = true;
    group.add(lugs);
    const { disc, bolt, bolts } = wheelRim(spec.rim, spec.width);
    mesh(group, disc, m.paint);
    const nuts = new InstancedMesh(keep(bolt), m.pin, bolts.length);
    bolts.forEach((matrix, i) => nuts.setMatrixAt(i, matrix));
    group.add(nuts);
    root.add(group);
  };
  mirrored((s) => {
    wheel(REAR, s);
    wheel(FRONT, s);
  });

  // ---------- Cabine ----------
  const cab = new Group();
  body.add(cab);
  const CAB = { rear: -1.08, front: 0.38, floor: 1.0, roof: 2.62, half: 0.72 };
  const cabX = (CAB.rear + CAB.front) / 2;
  const cabLength = CAB.front - CAB.rear;
  mesh(cab, roundedBox(cabLength + 0.04, 0.3, CAB.half * 2 + 0.02, 0.04), m.steel, cabX, CAB.floor + 0.12, 0);
  const glassHeight = CAB.roof - CAB.floor - 0.27;
  const glassY = CAB.floor + 0.27 + glassHeight / 2;
  // Colunas, travessas e o batente da porta.
  for (const x of [CAB.rear + 0.04, CAB.front - 0.04]) {
    mirrored((s) => mesh(cab, roundedBox(0.08, glassHeight + 0.04, 0.08, 0.02), m.steel, x, glassY, s * (CAB.half - 0.04)));
  }
  mirrored((s) => mesh(cab, roundedBox(0.06, glassHeight, 0.06, 0.015), m.steel, -0.25, glassY, s * (CAB.half - 0.03)));
  for (const y of [CAB.floor + 0.29, CAB.roof - 0.02]) {
    mirrored((s) => mesh(cab, roundedBox(cabLength, 0.05, 0.05, 0.015), m.steel, cabX, y, s * (CAB.half - 0.03)));
    mesh(cab, roundedBox(0.05, 0.05, CAB.half * 2, 0.015), m.steel, CAB.rear + 0.03, y, 0);
    mesh(cab, roundedBox(0.05, 0.05, CAB.half * 2, 0.015), m.steel, CAB.front - 0.03, y, 0);
  }
  // Vidros: dos lados, na frente e atrás.
  mirrored((s) => mesh(cab, roundedBox(cabLength - 0.08, glassHeight, 0.012, 0.004), m.glass, cabX, glassY, s * (CAB.half - 0.035)));
  mesh(cab, roundedBox(0.012, glassHeight, CAB.half * 2 - 0.08, 0.004), m.glass, CAB.front - 0.03, glassY, 0);
  mesh(cab, roundedBox(0.012, glassHeight, CAB.half * 2 - 0.08, 0.004), m.glass, CAB.rear + 0.03, glassY, 0);
  // Teto em dois degraus, com aba.
  mesh(cab, roundedBox(cabLength + 0.26, 0.1, CAB.half * 2 + 0.2, 0.045), m.paint, cabX, CAB.roof + 0.05, 0);
  mesh(cab, roundedBox(cabLength - 0.1, 0.06, CAB.half * 2 - 0.16, 0.03), m.paint, cabX, CAB.roof + 0.12, 0);
  // Giroflex e faróis de trabalho.
  mesh(cab, post(0.065, 0.035, 18), m.steel, CAB.front - 0.12, CAB.roof + 0.15, CAB.half - 0.12);
  const beacon = mesh(cab, post(0.055, 0.1, 18, 0.05), m.beacon, CAB.front - 0.12, CAB.roof + 0.185, CAB.half - 0.12);
  beacon.castShadow = false;
  mirrored((s) => {
    mesh(cab, roundedBox(0.08, 0.08, 0.12, 0.015), m.steel, CAB.front + 0.06, CAB.roof - 0.04, s * (CAB.half - 0.1));
    mesh(cab, roundedBox(0.01, 0.05, 0.09, 0.005), m.lamp, CAB.front + 0.105, CAB.roof - 0.04, s * (CAB.half - 0.1));
    mesh(cab, roundedBox(0.08, 0.08, 0.12, 0.015), m.steel, CAB.rear - 0.06, CAB.roof - 0.04, s * (CAB.half - 0.22));
    mesh(cab, roundedBox(0.01, 0.05, 0.09, 0.005), m.lamp, CAB.rear - 0.105, CAB.roof - 0.04, s * (CAB.half - 0.22));
    // Retrovisores.
    mesh(cab, roundedBox(0.24, 0.025, 0.025, 0.008), m.steel, CAB.front + 0.1, 2.12, s * (CAB.half + 0.04));
    mesh(cab, roundedBox(0.04, 0.24, 0.15, 0.015), m.steel, CAB.front + 0.22, 2.1, s * (CAB.half + 0.1));
  });
  // Por dentro: banco, volante e os comandos da retro.
  mesh(cab, roundedBox(0.46, 0.12, 0.5, 0.04), m.interior, cabX, CAB.floor + 0.55, 0);
  mesh(cab, roundedBox(0.12, 0.62, 0.48, 0.05), m.interior, cabX - 0.26, CAB.floor + 0.88, 0);
  const column = mesh(cab, post(0.035, 0.62, 10), m.interior, CAB.front - 0.2, CAB.floor + 0.3, 0);
  column.rotation.z = 0.35;
  const steering = mesh(cab, new TorusGeometry(0.17, 0.018, 8, 28), m.interior, CAB.front - 0.33, CAB.floor + 0.92, 0);
  steering.rotation.y = Math.PI / 2;
  steering.rotation.x = 0.6;
  mirrored((s) => {
    mesh(cab, roundedBox(0.3, 0.42, 0.14, 0.03), m.interior, CAB.rear + 0.3, CAB.floor + 0.5, s * 0.36);
    mesh(cab, post(0.016, 0.2, 8), m.steel, CAB.rear + 0.3, CAB.floor + 0.71, s * 0.36);
  });
  // Escapamento, ao lado da cabine.
  mesh(body, post(0.05, 1.0, 14), m.steel, 0.66, 1.58, -0.34);
  mesh(body, post(0.058, 0.06, 14), m.steel, 0.66, 2.55, -0.34);

  // ---------- Traseira: quadro, sapatas e lanternas ----------
  mesh(body, roundedBox(0.5, 0.62, 1.2, 0.05), m.paint, -1.78, 0.95, 0);
  mesh(body, roundedBox(0.14, 0.14, 2.2, 0.03), m.steel, -2.0, 0.66, 0);
  mesh(body, roundedBox(0.14, 0.14, 2.2, 0.03), m.steel, -2.0, 1.16, 0);
  mesh(body, roundedBox(0.3, 0.76, 0.66, 0.05), m.paint, -2.2, 0.92, 0);
  mirrored((s) => mesh(body, roundedBox(0.03, 0.2, 0.1, 0.01), m.tail, -2.08, 0.92, s * 0.78));

  const legs: Group[] = [];
  mirrored((s) => {
    mesh(body, roundedBox(0.2, 0.74, 0.2, 0.03), m.paint, -2.0, 1.02, s * 1.06);
    const leg = new Group();
    leg.position.set(-2.0, 0, s * 1.06);
    mesh(leg, roundedBox(0.14, 0.8, 0.14, 0.02), m.steel, 0, 0.46, 0);
    mesh(leg, roundedBox(0.38, 0.06, 0.3, 0.02), m.paint, 0, 0.06, 0);
    mesh(leg, roundedBox(0.36, 0.03, 0.28, 0.01), m.rubber, 0, 0.018, 0);
    body.add(leg);
    legs.push(leg);
  });

  // ---------- Pá carregadeira ----------
  const loaderArm = new Group();
  loaderArm.position.copy(LOADER_PIVOT);
  body.add(loaderArm);
  const loaderCurve = new QuadraticBezierCurve(new Vector2(0, 0), new Vector2(1.55, -0.05), new Vector2(...LOADER_TIP));
  const armShape = band(loaderCurve, (t) => 0.25 - 0.05 * t);
  mirrored((s) => {
    mesh(loaderArm, slab(armShape, 0.08, 0.02), m.paint, 0, 0, s * ARM_Z);
    pin(loaderArm, LOADER_TIP[0], LOADER_TIP[1], 0.05, 0.16, s * ARM_Z);
  });
  const cross = loaderCurve.getPoint(0.6);
  mesh(loaderArm, rodZ(0.075, ARM_Z * 2), m.paint, cross.x, cross.y, 0);

  const loaderBucket = new Group();
  loaderBucket.position.set(LOADER_TIP[0], LOADER_TIP[1], 0);
  loaderArm.add(loaderBucket);
  const LOADER_WIDTH = 2.3;
  mesh(
    loaderBucket,
    shell(
      [
        [0.42, 0.5],
        [0.13, 0.44],
        [0.02, 0.16],
        [0.03, -0.2],
        [0.15, -0.42],
        [0.4, -0.5],
        [0.96, -0.5],
      ],
      0.03,
      LOADER_WIDTH,
    ),
    m.bucketPaint,
  );
  const loaderSide = polygon([
    [0.42, 0.51],
    [0.12, 0.46],
    [0.0, 0.16],
    [0.01, -0.2],
    [0.14, -0.44],
    [0.4, -0.52],
    [0.98, -0.52],
    [0.78, -0.18],
    [0.55, 0.28],
  ]);
  mirrored((s) => {
    mesh(loaderBucket, slab(loaderSide, 0.025, 0.008), m.bucketPaint, 0, 0, s * (LOADER_WIDTH / 2));
    mesh(
      loaderBucket,
      slab(
        polygon([
          [-0.07, -0.07],
          [0.12, -0.24],
          [0.2, 0.58],
          [0.02, 0.62],
          [-0.07, 0.07],
        ]),
        0.05,
        0.01,
      ),
      m.bucketPaint,
      0,
      0,
      s * 0.62,
    );
  });
  mesh(loaderBucket, roundedBox(0.16, 0.04, LOADER_WIDTH + 0.02, 0.01), m.steel, 0.94, -0.505, 0);
  const tooth = keep(
    slab(
      polygon([
        [0, 0.03],
        [0.15, 0.004],
        [0.15, -0.006],
        [0, -0.028],
      ]),
      0.055,
      0.008,
    ),
  );
  for (let i = 0; i < 9; i++) {
    const item = new Mesh(tooth, m.bucketSteel);
    item.position.set(1.0, -0.5, -LOADER_WIDTH / 2 + 0.13 + (i * (LOADER_WIDTH - 0.26)) / 8);
    item.castShadow = true;
    loaderBucket.add(item);
  }

  // ---------- Retro: giro, lança, braço e caçamba ----------
  const swing = new Group();
  swing.position.copy(SWING_PIVOT);
  body.add(swing);
  mesh(swing, roundedBox(0.34, 0.86, 0.52, 0.06), m.paint, -0.1, 0.14, 0);
  mesh(swing, roundedBox(0.2, 0.3, 0.6, 0.04), m.paint, -0.2, 0.42, 0);
  pin(swing, BOOM_PIVOT[0], BOOM_PIVOT[1], 0.07, 0.68);

  const boom = new Group();
  boom.position.set(BOOM_PIVOT[0], BOOM_PIVOT[1], 0);
  swing.add(boom);
  const boomCurve = new QuadraticBezierCurve(new Vector2(0, 0), new Vector2(-0.7, 1.0), new Vector2(...BOOM_TIP));
  const boomWidth = (t: number) => 0.32 - 0.1 * t + 0.14 * Math.sin(Math.PI * t) ** 1.4;
  mesh(boom, slab(band(boomCurve, boomWidth, 48), 0.3, 0.03), m.paint);
  pin(boom, BOOM_TIP[0], BOOM_TIP[1], 0.06, 0.46);
  // Suporte do cilindro do braço, no alto da curva.
  mesh(boom, roundedBox(0.16, 0.14, 0.2, 0.03), m.paint, -0.52, 0.62, 0);
  pin(boom, -0.52, 0.66, 0.04, 0.3);
  // Mangueiras ao longo da lança, pelo lado de cima.
  for (const z of [-0.07, 0, 0.07]) {
    const points: Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = 0.06 + (i / 16) * 0.86;
      const p = boomCurve.getPoint(t);
      const n = boomCurve.getTangent(t);
      const lift = boomWidth(t) / 2 + 0.035 + Math.abs(z) * 0.2;
      points.push(new Vector3(p.x - n.y * lift, p.y + n.x * lift, z));
    }
    mesh(boom, new TubeGeometry(new CatmullRomCurve3(points), 48, 0.019, 8), m.rubber);
  }

  const stick = new Group();
  stick.position.set(BOOM_TIP[0], BOOM_TIP[1], 0);
  boom.add(stick);
  const stickShape = polygon([
    [0.1, 0.6],
    [0.16, 0.3],
    [0.15, -0.1],
    [0.11, -STICK_LENGTH + 0.08],
    [0.06, -STICK_LENGTH - 0.08],
    [-0.08, -STICK_LENGTH - 0.08],
    [-0.13, -STICK_LENGTH + 0.16],
    [-0.17, -0.1],
    [-0.12, 0.35],
    [-0.04, 0.62],
  ]);
  mesh(stick, slab(stickShape, 0.22, 0.02), m.paint);
  pin(stick, 0, -STICK_LENGTH, 0.05, 0.66);
  pin(stick, ROCKER_PIVOT.x, ROCKER_PIVOT.y, 0.04, 0.36);
  pin(stick, -0.02, 0.52, 0.04, 0.3);

  const bucket = new Group();
  bucket.position.set(0, -STICK_LENGTH, 0);
  stick.add(bucket);
  const BUCKET_WIDTH = 0.6;
  mesh(
    bucket,
    shell(
      [
        [-0.14, 0.04],
        [-0.24, -0.2],
        [-0.24, -0.45],
        [-0.12, -0.62],
        [0.06, -0.7],
        [0.26, -0.66],
      ],
      0.025,
      BUCKET_WIDTH,
    ),
    m.bucketSteel,
  );
  const bucketSide = polygon([
    [0.08, 0.07],
    [-0.14, 0.06],
    [-0.25, -0.2],
    [-0.25, -0.45],
    [-0.13, -0.63],
    [0.06, -0.71],
    [0.27, -0.67],
    [0.2, -0.38],
    [0.1, -0.1],
  ]);
  mirrored((s) => {
    mesh(bucket, slab(bucketSide, 0.02, 0.006), m.bucketSteel, 0, 0, s * (BUCKET_WIDTH / 2));
    mesh(
      bucket,
      slab(
        polygon([
          [0.08, 0.08],
          [-0.27, 0.1],
          [-0.29, -0.05],
          [0.05, -0.09],
        ]),
        0.03,
        0.008,
      ),
      m.bucketSteel,
      0,
      0,
      s * 0.15,
    );
  });
  pin(bucket, BUCKET_LINK_PIN.x, BUCKET_LINK_PIN.y, 0.035, 0.42);
  const lip = new Vector2(0.26, -0.66);
  const toothAngle = Math.atan2(0.42, 0.9);
  for (let i = 0; i < 5; i++) {
    const item = new Mesh(tooth, m.bucketSteel);
    item.position.set(lip.x, lip.y, -BUCKET_WIDTH / 2 + 0.07 + (i * (BUCKET_WIDTH - 0.14)) / 4);
    item.rotation.z = toothAngle;
    item.scale.set(0.85, 1.1, 1);
    item.castShadow = true;
    bucket.add(item);
  }
  // A terra que a caçamba carrega (aparece conforme enche).
  const loadGeometry = keep(new IcosahedronGeometry(0.26, 2));
  const loadPosition = loadGeometry.getAttribute("position");
  for (let i = 0; i < loadPosition.count; i++) {
    const x = loadPosition.getX(i);
    const y = loadPosition.getY(i);
    const z = loadPosition.getZ(i);
    const bump = 1 + 0.16 * Math.sin(x * 37) * Math.cos(z * 29) + 0.1 * Math.sin(y * 51 + z * 17);
    loadPosition.setXYZ(i, x * bump, y * bump * 0.85, z * bump * 1.05);
  }
  loadGeometry.computeVertexNormals();
  const load = new Mesh(loadGeometry, m.load);
  load.position.set(0.0, -0.4, 0);
  load.castShadow = true;
  bucket.add(load);
  /** Onde as linhas da planta técnica tocam cada peça, no lado -z (o que as câmeras mostram). */
  const callouts = {
    loader: anchor(loaderBucket, 0.45, -0.05, -LOADER_WIDTH / 2),
    stabilizer: anchor(legs[1], 0, 0.22, -0.16),
    boom: anchor(boom, -0.98, 0.52, -0.16),
    bucket: anchor(bucket, 0, -0.38, -BUCKET_WIDTH / 2),
  };

  // Balancim e biela da caçamba (as duas chapas de cada lado).
  const linkPlate = keep(roundedBox(1, 0.075, 0.035, 0.012).translate(0.5, 0, 0));
  const rockers = [-1, 1].map((s) => {
    const item = new Mesh(linkPlate, m.paint);
    item.position.z = s * 0.15;
    item.castShadow = true;
    stick.add(item);
    return item;
  });
  const links = [-1, 1].map((s) => {
    const item = new Mesh(linkPlate, m.paint);
    item.position.z = s * 0.19;
    item.castShadow = true;
    stick.add(item);
    return item;
  });
  const rockerPin = pin(stick, 0, 0, 0.035, 0.5);
  const rockerEnd = anchor(stick, 0, 0, 0);

  // ---------- Cilindros ----------
  const cylinders: HydraulicCylinder[] = [];
  const cylinderMaterials = { barrel: m.steel, rod: m.chrome };
  const hydraulic = (a: Object3D, b: Object3D, radius: number, barrel: number, rod: number) => {
    const geometry = cylinderGeometry({ radius, barrel, rod });
    keep(geometry.barrel);
    keep(geometry.rod);
    cylinders.push(new HydraulicCylinder(root, a, b, geometry, cylinderMaterials));
  };
  // Lança: da base do giro até a barriga da lança.
  hydraulic(anchor(swing, -0.3, -0.2, 0), anchor(boom, -0.85, 0.28, 0), 0.085, 0.72, 0.78);
  // Braço: do alto da lança até a manivela do braço.
  hydraulic(anchor(boom, -0.52, 0.66, 0), anchor(stick, -0.02, 0.52, 0), 0.075, 1.3, 1.25);
  // Caçamba: pelo lado de fora do braço até o balancim.
  hydraulic(anchor(stick, -0.2, 0.18, 0), rockerEnd, 0.065, 0.95, 0.95);
  // Pá: elevação (por baixo dos braços) e inclinação (por cima).
  mirrored((s) => {
    mesh(body, roundedBox(0.14, 0.12, 0.08, 0.02), m.steel, 1.05, 0.9, s * 0.6);
    hydraulic(anchor(body, 1.05, 0.9, s * 0.6), anchor(loaderArm, 0.95, -0.2, s * 0.6), 0.07, 0.62, 0.62);
    hydraulic(anchor(loaderArm, 1.05, 0.1, s * ARM_Z), anchor(loaderBucket, 0.06, 0.5, s * ARM_Z), 0.06, 0.85, 0.85);
  });

  // Peças fixas fundidas por material. Ficam de fora as que a pose move sozinhas.
  const moving = new Set<Object3D>([load, rockerPin, ...rockers, ...links]);
  for (const group of [body, cab, swing, boom, stick, bucket, loaderArm, loaderBucket, ...legs]) {
    geometries.push(...mergeStatic(group, moving));
  }

  // ---------- Pose ----------
  const linkPin = new Vector2();
  const rocker = new Vector2();
  const solveBucketLinkage = (angle: number) => {
    // Pino da biela na caçamba, no plano do braço.
    linkPin.copy(BUCKET_LINK_PIN).rotateAround(new Vector2(), angle).add(new Vector2(0, -STICK_LENGTH));
    // A ponta do balancim está a ROCKER_LENGTH do pivô e a LINK_LENGTH do pino: interseção de dois círculos.
    const d = Math.min(Math.max(linkPin.distanceTo(ROCKER_PIVOT), Math.abs(ROCKER_LENGTH - LINK_LENGTH) + 1e-4), ROCKER_LENGTH + LINK_LENGTH - 1e-4);
    const a = (ROCKER_LENGTH ** 2 - LINK_LENGTH ** 2 + d ** 2) / (2 * d);
    const h = Math.sqrt(Math.max(ROCKER_LENGTH ** 2 - a ** 2, 0));
    const dir = linkPin.clone().sub(ROCKER_PIVOT).normalize();
    const mid = ROCKER_PIVOT.clone().addScaledVector(dir, a);
    // Das duas soluções, a de fora do braço (x menor).
    const p1 = new Vector2(mid.x - dir.y * h, mid.y + dir.x * h);
    const p2 = new Vector2(mid.x + dir.y * h, mid.y - dir.x * h);
    rocker.copy(p1.x < p2.x ? p1 : p2);

    const place = (item: Mesh, from: Vector2, to: Vector2) => {
      item.position.x = from.x;
      item.position.y = from.y;
      item.rotation.z = Math.atan2(to.y - from.y, to.x - from.x);
      item.scale.x = from.distanceTo(to);
    };
    rockers.forEach((item) => place(item, ROCKER_PIVOT, rocker));
    links.forEach((item) => place(item, rocker, linkPin));
    rockerPin.position.set(rocker.x, rocker.y, 0);
    rockerEnd.position.set(rocker.x, rocker.y, 0);
  };

  const setPose = (pose: Pose) => {
    swing.rotation.y = pose.swing;
    boom.rotation.z = pose.boom;
    stick.rotation.z = pose.stick;
    bucket.rotation.z = pose.bucket;
    loaderArm.rotation.z = pose.loaderLift;
    loaderBucket.rotation.z = pose.loaderTilt;
    // Sapata recolhida: 0,42 m acima do chão.
    legs.forEach((leg) => {
      leg.position.y = 0.42 * (1 - pose.stabilizers);
    });
    load.visible = pose.load > 0.02;
    load.scale.setScalar(0.35 + 0.65 * pose.load);
    solveBucketLinkage(pose.bucket);
    root.updateMatrixWorld(true);
    cylinders.forEach((cylinder) => cylinder.update());
  };

  return {
    root,
    setPose,
    callouts,
    dispose: () => geometries.forEach((geometry) => geometry.dispose()),
  };
}

export type Backhoe = ReturnType<typeof createBackhoe>;

