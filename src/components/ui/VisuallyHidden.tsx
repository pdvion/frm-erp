import type { ReactNode } from "react";

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}

export function VisuallyHidden({ children, as: Component = "span" }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}
