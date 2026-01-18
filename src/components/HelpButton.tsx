"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { HelpCircle, X, ExternalLink, Loader2 } from "lucide-react";

interface HelpButtonProps {
  module: string;
  className?: string;
}

export function HelpButton({ module, className = "" }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: tutorial, isLoading } = trpc.tutorials.getByModule.useQuery(
    { module },
    { enabled: isOpen }
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${className}`}
        title="Ajuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                {tutorial?.title || "Ajuda"}
              </h2>
              <div className="flex items-center gap-2">
                {tutorial && (
                  <a
                    href={`/docs/${tutorial.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Abrir em nova aba"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : tutorial ? (
                <div className="prose prose-sm max-w-none">
                  <MarkdownContent content={tutorial.content} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    Nenhum tutorial disponível para este módulo.
                  </p>
                  <Link
                    href="/docs"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Ver todos os tutoriais
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Renderização simples de Markdown
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let listItems: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="my-1">{formatInline(item)}</li>
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
        <table key={`table-${elements.length}`} className="w-full my-4 border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {header.map((cell, i) => (
                <th key={i} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.filter(row => !row.every(cell => cell.match(/^-+$/))).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-gray-200 px-3 py-2 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
            <code>{codeContent.trim()}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Tables
    if (line.includes("|")) {
      flushList();
      inTable = true;
      const cells = line.split("|").map(c => c.trim()).filter(c => c);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headers
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
          {line.slice(2)}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-semibold text-gray-900 mt-5 mb-3">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-lg font-medium text-gray-900 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // Lists
    if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
      continue;
    }
    if (line.match(/^\d+\. /)) {
      listItems.push(line.replace(/^\d+\. /, ""));
      continue;
    }

    flushList();

    // Empty lines
    if (!line.trim()) {
      continue;
    }

    // Paragraphs
    elements.push(
      <p key={`p-${elements.length}`} className="my-2 text-gray-700">
        {formatInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Code
  text = text.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
  // Links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}
