/* eslint-disable react/forbid-elements, @next/next/no-html-link-for-pages */
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Erro Crítico
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ocorreu um erro grave na aplicação. Por favor, tente recarregar a
              página.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mb-4 font-mono">
                Código: {error.digest}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tentar novamente
              </button>
              <a
                href="/"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Página Inicial
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
