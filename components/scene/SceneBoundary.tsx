"use client";

import { Component, type ReactNode } from "react";
import { useSceneStore } from "@/lib/store";

interface State {
  failed: boolean;
}

/** Sem WebGL ou com erro na cena, a página segue com o céu de reserva em CSS. */
export class SceneBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("[cena] desativada:", error);
    // O preloader termina de nivelar e sai; fica o céu de reserva.
    useSceneStore.getState().setLoad(1);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
