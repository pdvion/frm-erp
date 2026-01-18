/**
 * Cliente IMAP para recebimento automático de XMLs de NFe por email
 * Conecta a uma caixa de email e busca anexos XML
 */

import Imap from "imap";
import { simpleParser, ParsedMail, Attachment } from "mailparser";

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  folder?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  size: number;
}

export interface EmailMessage {
  uid: number;
  messageId: string;
  from: string;
  subject: string;
  date: Date;
  attachments: EmailAttachment[];
}

export interface FetchResult {
  success: boolean;
  messages: EmailMessage[];
  xmlFiles: Array<{
    filename: string;
    content: string;
    fromEmail: string;
    subject: string;
    date: Date;
  }>;
  errors: string[];
}

function createImapConnection(config: EmailConfig): Imap {
  return new Imap({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    tls: config.tls,
    tlsOptions: { rejectUnauthorized: false },
  });
}

function openInbox(imap: Imap, folder: string): Promise<Imap.Box> {
  return new Promise((resolve, reject) => {
    imap.openBox(folder, false, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

function searchMessages(imap: Imap, criteria: (string | string[])[]): Promise<number[]> {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

function fetchMessage(imap: Imap, uid: number): Promise<ParsedMail> {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch([uid], { bodies: "", struct: true });
    
    fetch.on("message", (msg) => {
      let buffer = "";
      
      msg.on("body", (stream) => {
        stream.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
        });
      });
      
      msg.once("end", async () => {
        try {
          const parsed = await simpleParser(buffer);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });
    
    fetch.once("error", reject);
  });
}

function markAsSeen(imap: Imap, uid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.addFlags([uid], ["\\Seen"], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function moveToFolder(imap: Imap, uid: number, folder: string): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.move([uid], folder, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function fetchXmlAttachments(
  config: EmailConfig,
  options: {
    onlyUnread?: boolean;
    markAsRead?: boolean;
    moveToFolder?: string;
    maxMessages?: number;
  } = {}
): Promise<FetchResult> {
  const {
    onlyUnread = true,
    markAsRead = true,
    moveToFolder: targetFolder,
    maxMessages = 50,
  } = options;

  const result: FetchResult = {
    success: false,
    messages: [],
    xmlFiles: [],
    errors: [],
  };

  const imap = createImapConnection(config);

  return new Promise((resolve) => {
    imap.once("ready", async () => {
      try {
        const folder = config.folder || "INBOX";
        await openInbox(imap, folder);

        // Buscar mensagens
        const criteria: (string | string[])[] = onlyUnread ? ["UNSEEN"] : ["ALL"];
        const uids = await searchMessages(imap, criteria);

        // Limitar quantidade
        const limitedUids = uids.slice(0, maxMessages);

        for (const uid of limitedUids) {
          try {
            const parsed = await fetchMessage(imap, uid);

            const message: EmailMessage = {
              uid,
              messageId: parsed.messageId || "",
              from: parsed.from?.text || "",
              subject: parsed.subject || "",
              date: parsed.date || new Date(),
              attachments: [],
            };

            // Processar anexos
            if (parsed.attachments && parsed.attachments.length > 0) {
              for (const att of parsed.attachments) {
                const filename = att.filename || "";
                const isXml = filename.toLowerCase().endsWith(".xml") ||
                  att.contentType === "application/xml" ||
                  att.contentType === "text/xml";

                if (isXml) {
                  const content = att.content.toString("utf8");
                  
                  message.attachments.push({
                    filename,
                    content,
                    contentType: att.contentType,
                    size: att.size,
                  });

                  result.xmlFiles.push({
                    filename,
                    content,
                    fromEmail: message.from,
                    subject: message.subject,
                    date: message.date,
                  });
                }
              }
            }

            if (message.attachments.length > 0) {
              result.messages.push(message);

              // Marcar como lido
              if (markAsRead) {
                await markAsSeen(imap, uid);
              }

              // Mover para pasta
              if (targetFolder) {
                await moveToFolder(imap, uid, targetFolder);
              }
            }
          } catch (msgErr) {
            result.errors.push(`Erro ao processar mensagem ${uid}: ${msgErr}`);
          }
        }

        result.success = true;
      } catch (err) {
        result.errors.push(`Erro geral: ${err}`);
      } finally {
        imap.end();
        resolve(result);
      }
    });

    imap.once("error", (err: Error) => {
      result.errors.push(`Erro de conexão: ${err.message}`);
      resolve(result);
    });

    imap.connect();
  });
}

export async function testConnection(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  const imap = createImapConnection(config);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      imap.end();
      resolve({ success: false, error: "Timeout de conexão" });
    }, 10000);

    imap.once("ready", async () => {
      clearTimeout(timeout);
      try {
        const folder = config.folder || "INBOX";
        await openInbox(imap, folder);
        imap.end();
        resolve({ success: true });
      } catch (err) {
        imap.end();
        resolve({ success: false, error: String(err) });
      }
    });

    imap.once("error", (err: Error) => {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message });
    });

    imap.connect();
  });
}
