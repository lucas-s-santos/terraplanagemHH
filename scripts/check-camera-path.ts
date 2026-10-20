/**
 * Confere se o voo da câmera passa longe das ilhas. Rode depois de mexer em lib/scene/world.ts:
 *   npm run check:camera
 *
 * Amostra a curva da câmera (a mesma do CameraRig) no desktop e com a lente do celular
 * e mede a menor folga até cada ilha (aproximada por um cilindro de 1,2 × raio).
 * Precisa de Node 23.6+ (roda TypeScript direto, sem build).
 */
import { CatmullRomCurve3, Vector3 } from "three";
import { ISLANDS, LENS, STOPS, islandFocus, stopPosition } from "../lib/scene/world.ts";

const MIN_CLEARANCE = 5;
const SAMPLES = 4000;
let failed = false;

for (const [label, scale] of [
  ["desktop", LENS.wide.distance],
  ["celular", LENS.narrow.distance],
] as const) {
  const points = STOPS.map((stop) => {
    const focus = new Vector3(...islandFocus(stop.island));
    const camera = new Vector3(...stopPosition(stop));
    return focus.clone().add(camera.sub(focus).multiplyScalar(scale));
  });
  const curve = new CatmullRomCurve3(points, false, "centripetal");

  let worst = Infinity;
  let where = "";
  for (let k = 0; k <= SAMPLES; k++) {
    const t = k / SAMPLES;
    const p = curve.getPoint(t);
    for (const island of ISLANDS) {
      const [cx, cy, cz] = island.center;
      const side = Math.max(Math.hypot(p.x - cx, p.z - cz) - island.radius * 1.2, 0);
      const top = cy + 1.5;
      const bottom = cy - island.depth;
      const vertical = p.y > top ? p.y - top : p.y < bottom ? bottom - p.y : 0;
      const clearance = Math.hypot(side, vertical);
      if (clearance < worst) {
        worst = clearance;
        where = `${island.id}, parada ${(t * (STOPS.length - 1)).toFixed(2)}`;
      }
    }
  }

  const ok = worst >= MIN_CLEARANCE;
  failed ||= !ok;
  console.log(`${ok ? "ok " : "PERTO DEMAIS"}  ${label}: folga mínima ${worst.toFixed(2)} (${where})`);
}

process.exit(failed ? 1 : 0);
