/**
 * Cliente IMAP para recebimento automático de XMLs de NFe por email
 * Conecta a uma caixa de email e busca anexos XML
 * Usa imapflow - biblioteca moderna e mantida ativamente
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

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

function createImapClient(config: EmailConfig): ImapFlow {
  return new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.tls,
    auth: {
      user: config.user,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
    logger: false,
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

  const client = createImapClient(config);

  try {
    await client.connect();

    const folder = config.folder || "INBOX";
    const lock = await client.getMailboxLock(folder);

    try {
      // Buscar mensagens
      const searchCriteria = onlyUnread ? { seen: false } : {};
      
      let count = 0;
      for await (const message of client.fetch(searchCriteria, {
        uid: true,
        envelope: true,
        source: true,
      })) {
        if (count >= maxMessages) break;

        try {
          if (!message.source) continue;
          const parsed = await simpleParser(message.source);

          const emailMessage: EmailMessage = {
            uid: message.uid,
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
                
                emailMessage.attachments.push({
                  filename,
                  content,
                  contentType: att.contentType,
                  size: att.size,
                });

                result.xmlFiles.push({
                  filename,
                  content,
                  fromEmail: emailMessage.from,
                  subject: emailMessage.subject,
                  date: emailMessage.date,
                });
              }
            }
          }

          if (emailMessage.attachments.length > 0) {
            result.messages.push(emailMessage);

            // Marcar como lido
            if (markAsRead) {
              await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"]);
            }

            // Mover para pasta
            if (targetFolder) {
              await client.messageMove({ uid: message.uid }, targetFolder);
            }
          }

          count++;
        } catch (msgErr) {
          result.errors.push(`Erro ao processar mensagem ${message.uid}: ${msgErr}`);
        }
      }

      result.success = true;
    } finally {
      lock.release();
    }
  } catch (err) {
    result.errors.push(`Erro geral: ${err}`);
  } finally {
    await client.logout();
  }

  return result;
}

export async function testConnection(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  const client = createImapClient(config);

  try {
    await client.connect();
    
    const folder = config.folder || "INBOX";
    const lock = await client.getMailboxLock(folder);
    lock.release();
    
    await client.logout();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
