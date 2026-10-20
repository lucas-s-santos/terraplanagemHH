"use client";

import { Component, type ReactNode } from "react";

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
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
