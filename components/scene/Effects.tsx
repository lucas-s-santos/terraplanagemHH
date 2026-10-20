"use client";

import { EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

/**
 * Acabamento de cinema: vinheta e grão leves. Só no nível de qualidade alto,
 * então a cena precisa ficar bonita sem eles. O tone mapping é o mesmo do renderer
 * (Neutral, que preserva as cores da marca) para os dois níveis ficarem iguais.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.35} darkness={0.38} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
    </EffectComposer>
  );
}
