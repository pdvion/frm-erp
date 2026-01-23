"use client";

interface SkipLinkProps {
  href?: string;
  children?: string;
}

export function SkipLink({
  href = "#main-content",
  children = "Pular para o conteúdo principal",
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {children}
    </a>
  );
}
