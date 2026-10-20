import { BoxGeometry, BufferAttribute, type BufferGeometry, type Color, ConeGeometry, CylinderGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createBlockGeometry } from "./blockGeometry";
import type { ScenePalette } from "./palette";

/** toco = toco de eucalipto em pé · tocoArrancado = deitado, com as raízes · torrao = terra solta · estaca = gabarito de obra. */
export const PROP_KINDS = ["toco", "tocoArrancado", "torrao", "estaca"] as const;
export type PropKind = (typeof PROP_KINDS)[number];

/** Cor por vértice escolhida pela altura e pela normal (as tampas têm vértices próprios). */
function paint(geometry: BufferGeometry, pick: (y: number, normalY: number) => Color): BufferGeometry {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const color = pick(position.getY(i), normal.getY(i));
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

/** Objetos do topo das ilhas. Tamanho unitário, base em y = 0: a escala da instância dá o tamanho real. */
export function createPropGeometry(kind: PropKind, palette: ScenePalette): BufferGeometry {
  switch (kind) {
    case "toco":
      return paint(new CylinderGeometry(0.85, 1.1, 1, 9).translate(0, 0.5, 0), (_y, ny) =>
        ny > 0.9 ? palette.wood : palette.bark,
      );
    case "tocoArrancado": {
      const stump = new CylinderGeometry(0.8, 0.95, 0.9, 8).translate(0, 0.45, 0);
      const roots = Array.from({ length: 6 }, (_, i) =>
        new ConeGeometry(0.2, 1.1, 5)
          .translate(0, 0.55, 0)
          .rotateZ(-(Math.PI / 2 + 0.5))
          .rotateY((i / 6) * Math.PI * 2 + 0.3)
          .translate(0, 0.12, 0),
      );
      const merged = mergeGeometries([stump, ...roots]);
      [stump, ...roots].forEach((part) => part.dispose());
      return paint(merged, (y, ny) => (ny > 0.9 && y > 0.85 ? palette.wood : y < 0.3 ? palette.soilDark : palette.bark));
    }
    case "torrao":
      return createBlockGeometry("torrao", 29, palette);
    case "estaca":
      return paint(new BoxGeometry(1, 1, 1, 1, 5, 1).translate(0, 0.5, 0), (y) =>
        y > 0.75 ? palette.tokens["amarelo-maquina"] : palette.wood,
      );
  }
}
