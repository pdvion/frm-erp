"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  BookOpen,
  Loader2,
  Calendar,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function TutorialPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: tutorial, isLoading, error } = trpc.tutorials.getBySlug.useQuery({ slug });
  const { data: allTutorials } = trpc.tutorials.list.useQuery();

  // Encontrar tutorial anterior e próximo
  const currentIndex = allTutorials?.findIndex((t) => t.slug === slug) ?? -1;
  const prevTutorial = currentIndex > 0 ? allTutorials?.[currentIndex - 1] : null;
  const nextTutorial = currentIndex >= 0 && currentIndex < (allTutorials?.length ?? 0) - 1
    ? allTutorials?.[currentIndex + 1]
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted mb-4">Tutorial não encontrado</p>
          <Link href="/docs" className="text-blue-600 hover:underline">
            Ver todos os tutoriais
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tutorial.title}
        icon={<BookOpen className="w-6 h-6" />}
        backHref="/docs"
        module="docs"
        badge={tutorial.module ? { label: tutorial.module, variant: "info" as const } : undefined}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-theme-card rounded-lg border border-theme p-8">
          {tutorial.description && (
            <p className="text-lg text-theme-secondary mb-6 pb-6 border-b border-theme">
              {tutorial.description}
            </p>
          )}

          <div className="prose prose-blue max-w-none">
            <MarkdownContent content={tutorial.content} />
          </div>

          <div className="mt-8 pt-6 border-t border-theme flex items-center justify-between text-sm text-theme-muted">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Atualizado em {tutorial.updatedAt ? new Date(tutorial.updatedAt).toLocaleDateString("pt-BR") : "-"}
            </div>
          </div>
        </article>

        {/* Navigation */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {prevTutorial ? (
            <Link
              href={`/docs/${prevTutorial.slug}`}
              className="flex items-center gap-3 p-4 bg-theme-card rounded-lg border border-theme hover:border-blue-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-theme-muted" />
              <div>
                <p className="text-xs text-theme-muted">Anterior</p>
                <p className="font-medium text-theme">{prevTutorial.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextTutorial && (
            <Link
              href={`/docs/${nextTutorial.slug}`}
              className="flex items-center justify-end gap-3 p-4 bg-theme-card rounded-lg border border-theme hover:border-blue-300 transition-colors text-right"
            >
              <div>
                <p className="text-xs text-theme-muted">Próximo</p>
                <p className="font-medium text-theme">{nextTutorial.title}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-theme-muted" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";
  let listItems: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 my-4 space-y-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-theme-secondary">{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [header, ...body] = tableRows;
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-theme-tertiary">
                {header.map((cell, i) => (
                  <th key={i} className="border border-theme px-4 py-2 text-left text-sm font-semibold text-theme">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.filter(row => !row.every(cell => cell.match(/^-+$/))).map((row, i) => (
                <tr key={i} className="hover:bg-theme-hover">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-theme px-4 py-2 text-sm text-theme-secondary">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-theme text-theme-muted p-4 rounded-lg overflow-x-auto my-6 text-sm">
            <code className={codeLang ? `language-${codeLang}` : ""}>{codeContent.trim()}</code>
          </pre>
        );
        codeContent = "";
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    if (line.includes("|") && line.trim().startsWith("|")) {
      flushList();
      inTable = true;
      const cells = line.split("|").map(c => c.trim()).filter(c => c);
      tableRows.push(cells);
      continue;
    } else if (inTable && !line.includes("|")) {
      flushTable();
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-3xl font-bold text-theme mt-8 mb-4">
          {line.slice(2)}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-2xl font-semibold text-theme mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-xl font-medium text-theme mt-5 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
      continue;
    }
    if (line.match(/^\d+\. /)) {
      listItems.push(line.replace(/^\d+\. /, ""));
      continue;
    }

    flushList();

    if (!line.trim()) {
      continue;
    }

    elements.push(
      <p key={`p-${elements.length}`} className="my-3 text-theme-secondary leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Combinar todos os padrões em um único regex
  const combinedRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let match;
  let keyCounter = 0;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Adicionar texto antes do match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    // Determinar qual padrão foi encontrado e renderizar
    if (match[1]) { // **bold**
      elements.push(<strong key={keyCounter++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) { // *italic*
      elements.push(<em key={keyCounter++}>{match[4]}</em>);
    } else if (match[5]) { // `code`
      elements.push(<code key={keyCounter++} className="bg-theme-tertiary px-1.5 py-0.5 rounded text-sm font-mono text-theme">{match[6]}</code>);
    } else if (match[7]) { // [link](url)
      elements.push(<a key={keyCounter++} href={match[9]} className="text-blue-600 hover:underline" rel="noopener noreferrer">{match[8]}</a>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? <>{elements}</> : text;
}
