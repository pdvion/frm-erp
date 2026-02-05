#!/usr/bin/env node

/**
 * VIO-984: Design System Validation Script
 * 
 * Este script verifica o uso de elementos HTML nativos que deveriam
 * ser substituídos por componentes do Design System.
 * 
 * Uso:
 *   pnpm ds:check           # Verifica src/app
 *   pnpm ds:check --strict  # Falha se encontrar violações
 *   pnpm ds:check --fix     # Mostra sugestões de correção
 */

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

// Elementos nativos que devem ser substituídos por componentes do DS
// Nota: Usamos regex case-sensitive para não confundir <button> com <Button>
const FORBIDDEN_ELEMENTS = [
  {
    pattern: /<button\b/g,
    element: "<button>",
    replacement: "<Button>",
    import: 'import { Button } from "@/components/ui/Button";',
  },
  {
    pattern: /<input\b(?![^>]*type=["'](?:hidden|file|checkbox|radio)["'])/g,
    element: "<input>",
    replacement: "<Input>",
    import: 'import { Input } from "@/components/ui/Input";',
    note: "Exceções: type='hidden', type='file', type='checkbox', type='radio'",
  },
  {
    pattern: /<select\b/g,
    element: "<select>",
    replacement: "<Select>",
    import: 'import { Select } from "@/components/ui/Select";',
  },
  {
    pattern: /<textarea\b/g,
    element: "<textarea>",
    replacement: "<Textarea>",
    import: 'import { Textarea } from "@/components/ui/Textarea";',
  },
];

// Diretórios a ignorar
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.next/**",
  "**/coverage/**",
  "**/dist/**",
  "**/build/**",
  // Componentes do próprio Design System
  "**/components/ui/**",
  // Arquivos de teste
  "**/*.test.tsx",
  "**/*.test.ts",
  "**/*.spec.tsx",
  "**/*.spec.ts",
];

// Cores para output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function findFiles(directory) {
  const pattern = path.join(directory, "**/*.{tsx,jsx}");
  return glob(pattern, { ignore: IGNORE_PATTERNS });
}

function checkFile(filePath, content) {
  const violations = [];
  const lines = content.split("\n");

  for (const rule of FORBIDDEN_ELEMENTS) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      // Encontrar a linha do match
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;
      const line = lines[lineNumber - 1];
      
      // Ignorar se estiver em um comentário
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")) {
        continue;
      }

      violations.push({
        file: filePath,
        line: lineNumber,
        column: match.index - beforeMatch.lastIndexOf("\n"),
        element: rule.element,
        replacement: rule.replacement,
        import: rule.import,
        note: rule.note,
        context: line.trim(),
      });
    }
  }

  return violations;
}

async function main() {
  const args = process.argv.slice(2);
  const isStrict = args.includes("--strict");
  const showFix = args.includes("--fix");
  const targetDir = args.find(arg => !arg.startsWith("--")) || "src/app";

  log(colors.cyan, "\n🎨 Design System Validator");
  log(colors.dim, `   Verificando: ${targetDir}\n`);

  const files = await findFiles(targetDir);
  let totalViolations = 0;
  const violationsByFile = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const violations = checkFile(file, content);
    
    if (violations.length > 0) {
      totalViolations += violations.length;
      violationsByFile.set(file, violations);
    }
  }

  if (totalViolations === 0) {
    log(colors.green, "✅ Nenhuma violação encontrada!");
    log(colors.dim, `   ${files.length} arquivos verificados.\n`);
    process.exit(0);
  }

  // Mostrar violações
  log(colors.yellow, `⚠️  ${totalViolations} violação(ões) encontrada(s) em ${violationsByFile.size} arquivo(s):\n`);

  for (const [file, violations] of violationsByFile) {
    const relativePath = path.relative(process.cwd(), file);
    log(colors.blue, `📄 ${relativePath}`);

    for (const v of violations) {
      console.log(`   ${colors.yellow}Linha ${v.line}:${colors.reset} ${v.element} → ${colors.green}${v.replacement}${colors.reset}`);
      console.log(`   ${colors.dim}${v.context}${colors.reset}`);
      
      if (showFix) {
        console.log(`   ${colors.cyan}Import: ${v.import}${colors.reset}`);
        if (v.note) {
          console.log(`   ${colors.dim}Nota: ${v.note}${colors.reset}`);
        }
      }
      console.log();
    }
  }

  // Resumo
  console.log("─".repeat(60));
  log(colors.dim, "\nResumo:");
  
  const summary = {};
  for (const violations of violationsByFile.values()) {
    for (const v of violations) {
      summary[v.element] = (summary[v.element] || 0) + 1;
    }
  }
  
  for (const [element, count] of Object.entries(summary)) {
    console.log(`   ${element}: ${count} ocorrência(s)`);
  }

  console.log();
  log(colors.dim, "Dica: Use 'pnpm ds:check --fix' para ver sugestões de correção.\n");

  if (isStrict) {
    log(colors.red, "❌ Modo strict: Build falhou devido a violações do Design System.\n");
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Erro:", error);
  process.exit(1);
});
