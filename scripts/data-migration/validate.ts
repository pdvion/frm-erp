#!/usr/bin/env npx tsx
/**
 * FRM Data Migration Toolkit - CLI Unificado
 * 
 * Valida e importa dados de sistemas legados para o FRM ERP.
 * 
 * Uso:
 *   npx tsx scripts/data-migration/validate.ts --type legacy --file dados.csv
 *   npx tsx scripts/data-migration/validate.ts --type nfe --dir ./xmls/
 */

import { spawn } from "child_process";
import * as path from "path";

// Cores para output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHelp() {
  console.log(`
FRM Data Migration Toolkit

Uso:
  npx tsx scripts/data-migration/validate.ts [opções]

Opções:
  --type <tipo>     Tipo de validação: legacy, nfe (obrigatório)
  --file <arquivo>  Arquivo para validar
  --dir <diretório> Diretório com arquivos para validar
  --entity <tipo>   Tipo de entidade para dados legados
  --help            Exibir esta ajuda

Exemplos:
  # Validar dados legados
  npx tsx scripts/data-migration/validate.ts --type legacy --file dados.csv --entity customer

  # Validar XMLs de NFe
  npx tsx scripts/data-migration/validate.ts --type nfe --dir ./xmls/

Scripts Individuais:
  # Validar dados legados diretamente
  npx tsx scripts/data-migration/validate-legacy.ts dados.csv --entity customer

  # Validar NFe diretamente
  npx tsx scripts/data-migration/validate-nfe.ts ./xmls/ --company-cnpj 12345678000190
`);
}

function runScript(scriptPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", scriptPath, ...args], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Parse type
  const typeIndex = args.findIndex((a) => a === "--type" || a === "-t");
  const type = typeIndex >= 0 ? args[typeIndex + 1] : null;

  if (!type) {
    log("Erro: --type é obrigatório", "red");
    printHelp();
    process.exit(1);
  }

  log("\n=== FRM Data Migration Toolkit ===\n", "cyan");

  const scriptDir = path.dirname(new URL(import.meta.url).pathname);

  try {
    switch (type) {
      case "legacy": {
        const scriptPath = path.join(scriptDir, "validate-legacy.ts");
        // Remove --type from args and pass the rest
        const scriptArgs = args.filter((_, i) => i !== typeIndex && i !== typeIndex + 1);
        log("Executando: validate-legacy.ts", "blue");
        await runScript(scriptPath, scriptArgs);
        break;
      }
      case "nfe": {
        const scriptPath = path.join(scriptDir, "validate-nfe.ts");
        // Remove --type from args and pass the rest
        const scriptArgs = args.filter((_, i) => i !== typeIndex && i !== typeIndex + 1);
        log("Executando: validate-nfe.ts", "blue");
        await runScript(scriptPath, scriptArgs);
        break;
      }
      default:
        log(`Tipo desconhecido: ${type}`, "red");
        log("Tipos válidos: legacy, nfe", "yellow");
        process.exit(1);
    }
  } catch (error) {
    log(`\nErro: ${error instanceof Error ? error.message : String(error)}`, "red");
    process.exit(1);
  }
}

main().catch(console.error);
