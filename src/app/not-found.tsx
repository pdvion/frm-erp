import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-tertiary">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-theme mb-2">
          Página não encontrada
        </h1>
        <p className="text-theme-muted mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ir para o Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-theme text-theme rounded-lg hover:bg-theme-hover transition-colors font-medium"
          >
            Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
