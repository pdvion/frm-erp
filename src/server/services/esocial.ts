/**
 * Serviço eSocial Completo
 *
 * Geração de eventos, validação, construção de XML,
 * controle de lotes e transmissão.
 */

import type { PrismaClient } from "@prisma/client";

// ============================================================================
// TIPOS
// ============================================================================

export type ESocialEventType =
  | "S_1000" | "S_1005" | "S_1010" | "S_1020"
  | "S_1200" | "S_1210" | "S_1260" | "S_1270" | "S_1280"
  | "S_1298" | "S_1299"
  | "S_2190" | "S_2200" | "S_2205" | "S_2206"
  | "S_2230" | "S_2231" | "S_2240" | "S_2298" | "S_2299"
  | "S_2300" | "S_2306" | "S_2399"
  | "S_2400" | "S_2405" | "S_2410" | "S_2416" | "S_2418" | "S_2420"
  | "S_3000" | "S_3500"
  | "S_5001" | "S_5002" | "S_5003" | "S_5011" | "S_5012" | "S_5013";

export type ESocialEventStatus =
  | "DRAFT" | "VALIDATED" | "QUEUED" | "SENT"
  | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXCLUDED";

export type ESocialBatchStatus =
  | "OPEN" | "CLOSED" | "SENDING" | "SENT" | "PROCESSED" | "ERROR";

export type GroupType = "TABLES" | "NON_PERIODIC" | "PERIODIC";

export interface EventDefinition {
  type: ESocialEventType;
  name: string;
  group: GroupType;
  description: string;
  /** Prazo em dias úteis antes do vencimento */
  deadlineDays: number;
}

export interface GenerateEventsInput {
  companyId: string;
  year: number;
  month: number;
  eventTypes?: ESocialEventType[];
  employeeIds?: string[];
}

export interface GenerateEventsResult {
  generated: number;
  skipped: number;
  errors: Array<{ employeeId?: string; eventType: string; error: string }>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface XmlBuildResult {
  eventId: string;
  xml: string;
  errors: ValidationError[];
}

export interface BatchSendResult {
  batchId: string;
  protocolNumber: string | null;
  sentCount: number;
  errors: string[];
}

export interface ESocialDashboard {
  totalEvents: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  pendingCount: number;
  sentCount: number;
  acceptedCount: number;
  rejectedCount: number;
  openBatches: number;
  lastSentAt: Date | null;
  currentPeriod: { year: number; month: number };
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Definições de todos os eventos eSocial suportados */
export const EVENT_DEFINITIONS: EventDefinition[] = [
  // Tabelas (Grupo 1)
  { type: "S_1000", name: "Empregador/Contribuinte", group: "TABLES", description: "Informações do empregador/contribuinte/órgão público", deadlineDays: 0 },
  { type: "S_1005", name: "Tabela de Estabelecimentos", group: "TABLES", description: "Estabelecimentos, obras ou unidades de órgãos públicos", deadlineDays: 0 },
  { type: "S_1010", name: "Tabela de Rubricas", group: "TABLES", description: "Rubricas da folha de pagamento", deadlineDays: 0 },
  { type: "S_1020", name: "Tabela de Lotações Tributárias", group: "TABLES", description: "Lotações tributárias", deadlineDays: 0 },

  // Não periódicos (Grupo 2)
  { type: "S_2190", name: "Registro Preliminar", group: "NON_PERIODIC", description: "Registro preliminar de trabalhador", deadlineDays: 0 },
  { type: "S_2200", name: "Admissão", group: "NON_PERIODIC", description: "Cadastramento inicial do vínculo e admissão/ingresso de trabalhador", deadlineDays: 1 },
  { type: "S_2205", name: "Alteração Cadastral", group: "NON_PERIODIC", description: "Alteração de dados cadastrais do trabalhador", deadlineDays: 15 },
  { type: "S_2206", name: "Alteração Contratual", group: "NON_PERIODIC", description: "Alteração de contrato de trabalho/relação estatutária", deadlineDays: 15 },
  { type: "S_2230", name: "Afastamento Temporário", group: "NON_PERIODIC", description: "Afastamento temporário", deadlineDays: 15 },
  { type: "S_2231", name: "Cessação Condições Ambiente", group: "NON_PERIODIC", description: "Cessação de condições do ambiente de trabalho", deadlineDays: 15 },
  { type: "S_2240", name: "Condições Ambientais", group: "NON_PERIODIC", description: "Condições ambientais do trabalho — agentes nocivos", deadlineDays: 15 },
  { type: "S_2298", name: "Reintegração", group: "NON_PERIODIC", description: "Reintegração/Outros provimentos", deadlineDays: 15 },
  { type: "S_2299", name: "Desligamento", group: "NON_PERIODIC", description: "Desligamento", deadlineDays: 10 },
  { type: "S_2300", name: "TSV — Início", group: "NON_PERIODIC", description: "Trabalhador sem vínculo empregatício — início", deadlineDays: 7 },
  { type: "S_2306", name: "TSV — Alteração", group: "NON_PERIODIC", description: "Trabalhador sem vínculo — alteração contratual", deadlineDays: 15 },
  { type: "S_2399", name: "TSV — Término", group: "NON_PERIODIC", description: "Trabalhador sem vínculo — término", deadlineDays: 15 },
  { type: "S_2400", name: "Cadastro Beneficiário", group: "NON_PERIODIC", description: "Cadastro de beneficiário — entes públicos", deadlineDays: 15 },
  { type: "S_3000", name: "Exclusão de Eventos", group: "NON_PERIODIC", description: "Exclusão de eventos", deadlineDays: 0 },

  // Periódicos (Grupo 3)
  { type: "S_1200", name: "Remuneração", group: "PERIODIC", description: "Remuneração de trabalhador vinculado ao RGPS", deadlineDays: 15 },
  { type: "S_1210", name: "Pagamentos", group: "PERIODIC", description: "Pagamentos de rendimentos do trabalho", deadlineDays: 15 },
  { type: "S_1260", name: "Comercialização Rural PF", group: "PERIODIC", description: "Comercialização da produção rural pessoa física", deadlineDays: 15 },
  { type: "S_1270", name: "Avulsos Não Portuários", group: "PERIODIC", description: "Contratação de trabalhadores avulsos não portuários", deadlineDays: 15 },
  { type: "S_1280", name: "Info Complementares", group: "PERIODIC", description: "Informações complementares aos eventos periódicos", deadlineDays: 15 },
  { type: "S_1298", name: "Reabertura Periódicos", group: "PERIODIC", description: "Reabertura dos eventos periódicos", deadlineDays: 0 },
  { type: "S_1299", name: "Fechamento Periódicos", group: "PERIODIC", description: "Fechamento dos eventos periódicos", deadlineDays: 15 },
];

/** Mapa rápido de tipo → definição */
export const EVENT_MAP = new Map<ESocialEventType, EventDefinition>(
  EVENT_DEFINITIONS.map((d) => [d.type, d])
);

/** Mapeamento de ContractType Prisma → código eSocial */
const CONTRACT_TYPE_MAP: Record<string, string> = {
  CLT: "1",        // Empregado
  TEMPORARY: "2",  // Trabalhador temporário
  APPRENTICE: "5", // Aprendiz
  INTERN: "9",     // Estagiário (TSV)
  PJ: "0",         // Não se aplica
};

/** Mapeamento de TerminationType → motivo eSocial */
const TERMINATION_REASON_MAP: Record<string, string> = {
  RESIGNATION: "01",          // Pedido de demissão
  DISMISSAL_NO_CAUSE: "02",   // Rescisão sem justa causa
  DISMISSAL_WITH_CAUSE: "03", // Rescisão por justa causa
  MUTUAL_AGREEMENT: "33",     // Rescisão por acordo
  CONTRACT_END: "04",         // Término de contrato
  RETIREMENT: "07",           // Aposentadoria
  DEATH: "10",                // Falecimento
};

/** Mapeamento de LeaveType → código eSocial de afastamento */
const LEAVE_TYPE_MAP: Record<string, string> = {
  MEDICAL: "01",       // Acidente/doença do trabalho
  MATERNITY: "06",     // Licença maternidade
  PATERNITY: "19",     // Licença paternidade
  BEREAVEMENT: "16",   // Licença por falecimento
  MARRIAGE: "15",      // Licença casamento
  MILITARY: "21",      // Serviço militar
  JURY_DUTY: "22",     // Licença para exercício de mandato
  BLOOD_DONATION: "24",// Doação de sangue
  UNION: "23",         // Atividade sindical
  OTHER: "99",         // Outros
};

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Gera o ID do evento no formato eSocial
 * ID{cnpj14}{yyyyMMddHHmmss}{seq5}
 */
export function generateEventId(cnpj: string, sequence: number, date?: Date): string {
  const d = date ?? new Date();
  const ts = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
  const cleanCnpj = cnpj.replace(/\D/g, "").padStart(14, "0");
  return `ID${cleanCnpj}${ts}${String(sequence).padStart(5, "0")}`;
}

/**
 * Formata CPF para o padrão eSocial (apenas números, 11 dígitos)
 */
export function formatCpfForESocial(cpf: string | null | undefined): string {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "").padStart(11, "0");
}

/**
 * Formata CNPJ para o padrão eSocial (apenas números, 14 dígitos)
 */
export function formatCnpjForESocial(cnpj: string | null | undefined): string {
  if (!cnpj) return "";
  return cnpj.replace(/\D/g, "").padStart(14, "0");
}

/**
 * Formata data para o padrão eSocial (YYYY-MM-DD)
 */
export function formatDateForESocial(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]!;
}

/**
 * Calcula o prazo de envio de um evento
 */
export function calculateDeadline(eventType: ESocialEventType, referenceDate: Date): Date {
  const def = EVENT_MAP.get(eventType);
  if (!def || def.deadlineDays === 0) return referenceDate;

  const deadline = new Date(referenceDate);
  let daysAdded = 0;
  while (daysAdded < def.deadlineDays) {
    deadline.setDate(deadline.getDate() + 1);
    const dow = deadline.getDay();
    if (dow !== 0 && dow !== 6) daysAdded++;
  }
  return deadline;
}

/**
 * Valida dados mínimos de um empregado para S-2200
 */
export function validateEmployeeForAdmission(employee: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!employee.cpf) errors.push({ field: "cpf", message: "CPF é obrigatório", code: "REQUIRED" });
  if (!employee.name) errors.push({ field: "name", message: "Nome é obrigatório", code: "REQUIRED" });
  if (!employee.birthDate) errors.push({ field: "birthDate", message: "Data de nascimento é obrigatória", code: "REQUIRED" });
  if (!employee.hireDate) errors.push({ field: "hireDate", message: "Data de admissão é obrigatória", code: "REQUIRED" });
  if (!employee.contractType) errors.push({ field: "contractType", message: "Tipo de contrato é obrigatório", code: "REQUIRED" });

  const cpf = String(employee.cpf ?? "").replace(/\D/g, "");
  if (cpf && cpf.length !== 11) errors.push({ field: "cpf", message: "CPF deve ter 11 dígitos", code: "INVALID_FORMAT" });

  return errors;
}

/**
 * Valida dados mínimos para S-2299 (desligamento)
 */
export function validateTermination(termination: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!termination.terminationDate) errors.push({ field: "terminationDate", message: "Data de desligamento é obrigatória", code: "REQUIRED" });
  if (!termination.type) errors.push({ field: "type", message: "Tipo de desligamento é obrigatório", code: "REQUIRED" });
  if (!termination.employeeId) errors.push({ field: "employeeId", message: "Funcionário é obrigatório", code: "REQUIRED" });

  return errors;
}

/**
 * Valida dados mínimos para S-2230 (afastamento)
 */
export function validateLeaveRecord(leave: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!leave.startDate) errors.push({ field: "startDate", message: "Data de início é obrigatória", code: "REQUIRED" });
  if (!leave.type) errors.push({ field: "type", message: "Tipo de afastamento é obrigatório", code: "REQUIRED" });
  if (!leave.employeeId) errors.push({ field: "employeeId", message: "Funcionário é obrigatório", code: "REQUIRED" });

  return errors;
}

/**
 * Valida dados mínimos para S-1200 (remuneração)
 */
export function validatePayrollForRemuneration(payroll: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!payroll.referenceMonth) errors.push({ field: "referenceMonth", message: "Mês de referência é obrigatório", code: "REQUIRED" });
  if (!payroll.referenceYear) errors.push({ field: "referenceYear", message: "Ano de referência é obrigatório", code: "REQUIRED" });

  return errors;
}

/**
 * Classifica o grupo de um evento
 */
export function getEventGroup(eventType: ESocialEventType): GroupType {
  return EVENT_MAP.get(eventType)?.group ?? "NON_PERIODIC";
}

/**
 * Retorna o nome legível de um tipo de evento
 */
export function getEventTypeName(eventType: ESocialEventType): string {
  return EVENT_MAP.get(eventType)?.name ?? eventType;
}

// ============================================================================
// XML BUILDER
// ============================================================================

/**
 * Constrói XML do evento S-2200 (Admissão)
 */
export function buildXmlS2200(
  company: { cnpj: string; name: string },
  employee: Record<string, unknown>,
  eventId: string,
): string {
  const cpf = formatCpfForESocial(employee.cpf as string);
  const cnpj = formatCnpjForESocial(company.cnpj);
  const hireDate = formatDateForESocial(employee.hireDate as string);
  const birthDate = formatDateForESocial(employee.birthDate as string);
  const contractCode = CONTRACT_TYPE_MAP[employee.contractType as string] ?? "1";

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_02_00">
  <evtAdmissao Id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj}</nrInsc>
    </ideEmpregador>
    <trabalhador>
      <cpfTrab>${cpf}</cpfTrab>
      <nmTrab>${escapeXml(String(employee.name ?? ""))}</nmTrab>
      <sexo>${employee.gender === "F" ? "F" : "M"}</sexo>
      <racaCor>6</racaCor>
      <estCiv>${employee.maritalStatus === "MARRIED" ? "2" : "1"}</estCiv>
      <grauInstr>09</grauInstr>
      <nmSoc/>
      <nascimento>
        <dtNascto>${birthDate}</dtNascto>
      </nascimento>
      <endereco>
        <brasil>
          <tpLograd>R</tpLograd>
          <dscLograd>${escapeXml(String(employee.address ?? ""))}</dscLograd>
          <nrLograd>${escapeXml(String(employee.addressNumber ?? "S/N"))}</nrLograd>
          <bairro>${escapeXml(String(employee.addressNeighborhood ?? ""))}</bairro>
          <cep>${String(employee.addressZipCode ?? "").replace(/\D/g, "")}</cep>
          <codMunic>0000000</codMunic>
          <uf>${String(employee.addressState ?? "SP")}</uf>
        </brasil>
      </endereco>
    </trabalhador>
    <vinculo>
      <matricula>${String(employee.code ?? "")}</matricula>
      <tpRegTrab>1</tpRegTrab>
      <tpRegPrev>1</tpRegPrev>
      <cadIni>N</cadIni>
      <infoRegimeTrab>
        <infoCeletista>
          <dtAdm>${hireDate}</dtAdm>
          <tpAdmissao>1</tpAdmissao>
          <indAdmissao>1</indAdmissao>
          <tpRegJor>1</tpRegJor>
          <natAtividade>1</natAtividade>
          <dtBase>1</dtBase>
          <cnpjSindCategProf>00000000000000</cnpjSindCategProf>
        </infoCeletista>
      </infoRegimeTrab>
      <infoContrato>
        <codCargo>${String(employee.code ?? "001")}</codCargo>
        <codCateg>${contractCode}01</codCateg>
        <remuneracao>
          <vrSalFx>${Number(employee.salary ?? 0).toFixed(2)}</vrSalFx>
          <undSalFixo>5</undSalFixo>
          <dscSalVar/>
        </remuneracao>
        <duracao>
          <tpContr>1</tpContr>
        </duracao>
      </infoContrato>
    </vinculo>
  </evtAdmissao>
</eSocial>`;
}

/**
 * Constrói XML do evento S-2299 (Desligamento)
 */
export function buildXmlS2299(
  company: { cnpj: string },
  employee: Record<string, unknown>,
  termination: Record<string, unknown>,
  eventId: string,
): string {
  const cpf = formatCpfForESocial(employee.cpf as string);
  const cnpj = formatCnpjForESocial(company.cnpj);
  const terminationDate = formatDateForESocial(termination.terminationDate as string);
  const reasonCode = TERMINATION_REASON_MAP[termination.type as string] ?? "99";

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtDeslig/v_S_01_02_00">
  <evtDeslig Id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf}</cpfTrab>
      <matricula>${String(employee.code ?? "")}</matricula>
    </ideVinculo>
    <infoDeslig>
      <mtvDeslig>${reasonCode}</mtvDeslig>
      <dtDeslig>${terminationDate}</dtDeslig>
      <indPagtoAPI>S</indPagtoAPI>
      <dtProjFimAPI/>
      <pensAlim>0</pensAlim>
      <verbasResc>
        <dmDev>
          <ideDmDev>1</ideDmDev>
          <infoPerApur>
            <ideEstabLot>
              <tpInsc>1</tpInsc>
              <nrInsc>${cnpj}</nrInsc>
              <codLotacao>001</codLotacao>
              <detVerbas>
                <codRubr>001</codRubr>
                <ideTabRubr>FRM</ideTabRubr>
                <vrRubr>${Number(termination.totalNet ?? 0).toFixed(2)}</vrRubr>
              </detVerbas>
            </ideEstabLot>
          </infoPerApur>
        </dmDev>
      </verbasResc>
    </infoDeslig>
  </evtDeslig>
</eSocial>`;
}

/**
 * Constrói XML do evento S-2230 (Afastamento)
 */
export function buildXmlS2230(
  company: { cnpj: string },
  employee: Record<string, unknown>,
  leave: Record<string, unknown>,
  eventId: string,
): string {
  const cpf = formatCpfForESocial(employee.cpf as string);
  const cnpj = formatCnpjForESocial(company.cnpj);
  const startDate = formatDateForESocial(leave.startDate as string);
  const endDate = leave.endDate ? formatDateForESocial(leave.endDate as string) : "";
  const leaveCode = LEAVE_TYPE_MAP[leave.type as string] ?? "99";

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAfastTemp/v_S_01_02_00">
  <evtAfastTemp Id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf}</cpfTrab>
      <matricula>${String(employee.code ?? "")}</matricula>
    </ideVinculo>
    <infoAfastamento>
      <iniAfastamento>
        <dtIniAfast>${startDate}</dtIniAfast>
        <codMotAfast>${leaveCode}</codMotAfast>
      </iniAfastamento>${endDate ? `
      <fimAfastamento>
        <dtTermAfast>${endDate}</dtTermAfast>
      </fimAfastamento>` : ""}
    </infoAfastamento>
  </evtAfastTemp>
</eSocial>`;
}

/**
 * Constrói XML do evento S-1200 (Remuneração)
 */
export function buildXmlS1200(
  company: { cnpj: string },
  employee: Record<string, unknown>,
  payrollItem: Record<string, unknown>,
  year: number,
  month: number,
  eventId: string,
): string {
  const cpf = formatCpfForESocial(employee.cpf as string);
  const cnpj = formatCnpjForESocial(company.cnpj);
  const perApur = `${year}-${String(month).padStart(2, "0")}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">
  <evtRemun Id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj}</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${cpf}</cpfTrab>
    </ideTrabalhador>
    <dmDev>
      <ideDmDev>1</ideDmDev>
      <codCateg>101</codCateg>
      <infoPerApur>
        <ideEstabLot>
          <tpInsc>1</tpInsc>
          <nrInsc>${cnpj}</nrInsc>
          <codLotacao>001</codLotacao>
          <remunPerApur>
            <matricula>${String(employee.code ?? "")}</matricula>
            <itensRemun>
              <codRubr>001</codRubr>
              <ideTabRubr>FRM</ideTabRubr>
              <vrRubr>${Number(payrollItem.grossSalary ?? 0).toFixed(2)}</vrRubr>
            </itensRemun>
            <infoSaudeColet/>
          </remunPerApur>
        </ideEstabLot>
      </infoPerApur>
    </dmDev>
  </evtRemun>
</eSocial>`;
}

/**
 * Constrói XML do evento S-1210 (Pagamentos)
 */
export function buildXmlS1210(
  company: { cnpj: string },
  employee: Record<string, unknown>,
  payrollItem: Record<string, unknown>,
  year: number,
  month: number,
  eventId: string,
): string {
  const cpf = formatCpfForESocial(employee.cpf as string);
  const cnpj = formatCnpjForESocial(company.cnpj);
  const perApur = `${year}-${String(month).padStart(2, "0")}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_02_00">
  <evtPgtos Id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj}</nrInsc>
    </ideEmpregador>
    <ideBenef>
      <cpfBenef>${cpf}</cpfBenef>
      <deps>
        <vrDedDep>0.00</vrDedDep>
      </deps>
      <infoPgto>
        <dtPgto>${formatDateForESocial(new Date())}</dtPgto>
        <tpPgto>1</tpPgto>
        <perRef>${perApur}</perRef>
        <ideDmDev>1</ideDmDev>
        <vrLiq>${Number(payrollItem.netSalary ?? 0).toFixed(2)}</vrLiq>
      </infoPgto>
    </ideBenef>
  </evtPgtos>
</eSocial>`;
}

/**
 * Constrói XML do evento S-1299 (Fechamento Periódicos)
 */
export function buildXmlS1299(
  company: { cnpj: string },
  year: number,
  month: number,
  eventId: string,
): string {
  const cnpj = formatCnpjForESocial(company.cnpj);
  const perApur = `${year}-${String(month).padStart(2, "0")}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_02_00">
  <evtFechaEvPer Id="${eventId}">
    <ideEvento>
      <indRetif>1</indRetif>
      <indApuracao>1</indApuracao>
      <perApur>${perApur}</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj}</nrInsc>
    </ideEmpregador>
    <ideRespInf>
      <nmResp>Sistema FRM ERP</nmResp>
      <cpfResp>00000000000</cpfResp>
      <telefone>0000000000</telefone>
      <email>sistema@frm.erp</email>
    </ideRespInf>
    <infoFech>
      <evtRemun>S</evtRemun>
      <evtPgtos>S</evtPgtos>
      <evtAqProd>N</evtAqProd>
      <evtComProd>N</evtComProd>
      <evtContratAvNP>N</evtContratAvNP>
      <evtInfoComplPer>N</evtInfoComplPer>
    </infoFech>
  </evtFechaEvPer>
</eSocial>`;
}

/** Escapa caracteres especiais para XML */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================================================
// ESOCIAL SERVICE (CLASS)
// ============================================================================

export class ESocialService {
  constructor(private readonly prisma: PrismaClient) {}

  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO
  // --------------------------------------------------------------------------

  async getConfig(companyId: string) {
    return this.prisma.eSocialConfig.findUnique({ where: { companyId } });
  }

  async upsertConfig(companyId: string, data: {
    environment?: "PRODUCTION" | "RESTRICTED";
    employerType?: number;
    softwareId?: string;
    softwareName?: string;
    certificatePath?: string;
    certificateExpiry?: Date;
    autoGenerate?: boolean;
    autoSend?: boolean;
    isActive?: boolean;
  }) {
    return this.prisma.eSocialConfig.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });
  }

  // --------------------------------------------------------------------------
  // RUBRICAS
  // --------------------------------------------------------------------------

  async listRubrics(companyId: string, filters?: { type?: string; isActive?: boolean }) {
    const where: Record<string, unknown> = { companyId };
    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    return this.prisma.eSocialRubric.findMany({ where, orderBy: { code: "asc" } });
  }

  async createRubric(companyId: string, data: {
    code: string;
    name: string;
    type: "EARNING" | "DEDUCTION" | "INFORMATIVE";
    incidenceINSS?: "NORMAL" | "EXEMPT" | "SUSPENDED" | "NOT_APPLICABLE";
    incidenceIRRF?: "NORMAL" | "EXEMPT" | "SUSPENDED" | "NOT_APPLICABLE";
    incidenceFGTS?: "NORMAL" | "EXEMPT" | "SUSPENDED" | "NOT_APPLICABLE";
    incidenceSindical?: "NORMAL" | "EXEMPT" | "SUSPENDED" | "NOT_APPLICABLE";
    natureCode?: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
  }) {
    return this.prisma.eSocialRubric.create({
      data: { companyId, ...data },
    });
  }

  async updateRubric(id: string, companyId: string, data: Record<string, unknown>) {
    return this.prisma.eSocialRubric.updateMany({
      where: { id, companyId },
      data,
    });
  }

  // --------------------------------------------------------------------------
  // EVENTOS
  // --------------------------------------------------------------------------

  async listEvents(companyId: string, filters?: {
    status?: string;
    eventType?: string;
    year?: number;
    month?: number;
    employeeId?: string;
    batchId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = { companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.year) where.referenceYear = filters.year;
    if (filters?.month) where.referenceMonth = filters.month;
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.batchId) where.batchId = filters.batchId;

    const [events, total] = await Promise.all([
      this.prisma.eSocialEvent.findMany({
        where,
        include: { employee: { select: { id: true, name: true, cpf: true, code: true } } },
        orderBy: { createdAt: "desc" },
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
      this.prisma.eSocialEvent.count({ where }),
    ]);

    return { events, total };
  }

  async getEvent(id: string, companyId: string) {
    return this.prisma.eSocialEvent.findFirst({
      where: { id, companyId },
      include: {
        employee: { select: { id: true, name: true, cpf: true, code: true } },
        batch: { select: { id: true, batchNumber: true, status: true } },
      },
    });
  }

  /**
   * Gera eventos eSocial a partir dos dados HR existentes
   */
  async generateEvents(input: GenerateEventsInput): Promise<GenerateEventsResult> {
    const { companyId, year, month, eventTypes, employeeIds } = input;
    const result: GenerateEventsResult = { generated: 0, skipped: 0, errors: [] };

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { cnpj: true, name: true },
    });
    if (!company) {
      result.errors.push({ eventType: "ALL", error: "Empresa não encontrada" });
      return result;
    }

    const typesToGenerate = eventTypes ?? ["S_1200", "S_1210", "S_2200", "S_2299", "S_2230"] as ESocialEventType[];

    // Buscar sequência atual
    const lastEvent = await this.prisma.eSocialEvent.findFirst({
      where: { companyId },
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });
    let seq = (lastEvent?.sequenceNumber ?? 0) + 1;

    for (const eventType of typesToGenerate) {
      try {
        switch (eventType) {
          case "S_2200":
            seq = await this.generateAdmissionEvents(companyId, company, year, month, employeeIds, seq, result);
            break;
          case "S_2299":
            seq = await this.generateTerminationEvents(companyId, company, year, month, employeeIds, seq, result);
            break;
          case "S_2230":
            seq = await this.generateLeaveEvents(companyId, company, year, month, employeeIds, seq, result);
            break;
          case "S_1200":
            seq = await this.generateRemunerationEvents(companyId, company, year, month, employeeIds, seq, result);
            break;
          case "S_1210":
            seq = await this.generatePaymentEvents(companyId, company, year, month, employeeIds, seq, result);
            break;
          default:
            result.skipped++;
        }
      } catch (err) {
        result.errors.push({ eventType, error: String(err) });
      }
    }

    return result;
  }

  private async generateAdmissionEvents(
    companyId: string,
    company: { cnpj: string | null; name: string },
    year: number,
    month: number,
    employeeIds: string[] | undefined,
    seq: number,
    result: GenerateEventsResult,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: Record<string, unknown> = {
      companyId,
      hireDate: { gte: startDate, lte: endDate },
      status: "ACTIVE",
    };
    if (employeeIds?.length) where.id = { in: employeeIds };

    const employees = await this.prisma.employee.findMany({ where: where as never });

    for (const emp of employees) {
      const existing = await this.prisma.eSocialEvent.findFirst({
        where: { companyId, eventType: "S_2200", sourceEntityType: "Employee", sourceEntityId: emp.id },
      });
      if (existing) { result.skipped++; continue; }

      const errors = validateEmployeeForAdmission(emp as unknown as Record<string, unknown>);
      if (errors.length > 0) {
        result.errors.push({ employeeId: emp.id, eventType: "S_2200", error: errors.map(e => e.message).join("; ") });
        continue;
      }

      const eventId = generateEventId(company.cnpj ?? "", seq);
      const xml = buildXmlS2200(
        { cnpj: company.cnpj ?? "", name: company.name },
        emp as unknown as Record<string, unknown>,
        eventId,
      );

      await this.prisma.eSocialEvent.create({
        data: {
          companyId,
          eventType: "S_2200",
          status: "DRAFT",
          sequenceNumber: seq,
          referenceYear: year,
          referenceMonth: month,
          employeeId: emp.id,
          sourceEntityType: "Employee",
          sourceEntityId: emp.id,
          eventId,
          xmlContent: xml,
        },
      });

      seq++;
      result.generated++;
    }

    return seq;
  }

  private async generateTerminationEvents(
    companyId: string,
    company: { cnpj: string | null; name: string },
    year: number,
    month: number,
    employeeIds: string[] | undefined,
    seq: number,
    result: GenerateEventsResult,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: Record<string, unknown> = {
      companyId,
      terminationDate: { gte: startDate, lte: endDate },
    };
    if (employeeIds?.length) where.employeeId = { in: employeeIds };

    const terminations = await this.prisma.termination.findMany({
      where: where as never,
      include: { employee: true },
    });

    for (const term of terminations) {
      const existing = await this.prisma.eSocialEvent.findFirst({
        where: { companyId, eventType: "S_2299", sourceEntityType: "Termination", sourceEntityId: term.id },
      });
      if (existing) { result.skipped++; continue; }

      const errors = validateTermination(term as unknown as Record<string, unknown>);
      if (errors.length > 0) {
        result.errors.push({ employeeId: term.employeeId, eventType: "S_2299", error: errors.map(e => e.message).join("; ") });
        continue;
      }

      const eventId = generateEventId(company.cnpj ?? "", seq);
      const xml = buildXmlS2299(
        { cnpj: company.cnpj ?? "" },
        term.employee as unknown as Record<string, unknown>,
        term as unknown as Record<string, unknown>,
        eventId,
      );

      await this.prisma.eSocialEvent.create({
        data: {
          companyId,
          eventType: "S_2299",
          status: "DRAFT",
          sequenceNumber: seq,
          referenceYear: year,
          referenceMonth: month,
          employeeId: term.employeeId,
          sourceEntityType: "Termination",
          sourceEntityId: term.id,
          eventId,
          xmlContent: xml,
        },
      });

      seq++;
      result.generated++;
    }

    return seq;
  }

  private async generateLeaveEvents(
    companyId: string,
    company: { cnpj: string | null; name: string },
    year: number,
    month: number,
    employeeIds: string[] | undefined,
    seq: number,
    result: GenerateEventsResult,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: Record<string, unknown> = {
      companyId,
      startDate: { gte: startDate, lte: endDate },
    };
    if (employeeIds?.length) where.employeeId = { in: employeeIds };

    const leaves = await this.prisma.leaveRecord.findMany({
      where: where as never,
      include: { employee: true },
    });

    for (const leave of leaves) {
      const existing = await this.prisma.eSocialEvent.findFirst({
        where: { companyId, eventType: "S_2230", sourceEntityType: "LeaveRecord", sourceEntityId: leave.id },
      });
      if (existing) { result.skipped++; continue; }

      const errors = validateLeaveRecord(leave as unknown as Record<string, unknown>);
      if (errors.length > 0) {
        result.errors.push({ employeeId: leave.employeeId, eventType: "S_2230", error: errors.map(e => e.message).join("; ") });
        continue;
      }

      const eventId = generateEventId(company.cnpj ?? "", seq);
      const xml = buildXmlS2230(
        { cnpj: company.cnpj ?? "" },
        leave.employee as unknown as Record<string, unknown>,
        leave as unknown as Record<string, unknown>,
        eventId,
      );

      await this.prisma.eSocialEvent.create({
        data: {
          companyId,
          eventType: "S_2230",
          status: "DRAFT",
          sequenceNumber: seq,
          referenceYear: year,
          referenceMonth: month,
          employeeId: leave.employeeId,
          sourceEntityType: "LeaveRecord",
          sourceEntityId: leave.id,
          eventId,
          xmlContent: xml,
        },
      });

      seq++;
      result.generated++;
    }

    return seq;
  }

  private async generateRemunerationEvents(
    companyId: string,
    company: { cnpj: string | null; name: string },
    year: number,
    month: number,
    employeeIds: string[] | undefined,
    seq: number,
    result: GenerateEventsResult,
  ): Promise<number> {
    const payroll = await this.prisma.payroll.findFirst({
      where: { companyId, referenceYear: year, referenceMonth: month },
      include: {
        items: { include: { employee: true } },
      },
    });

    if (!payroll) {
      result.errors.push({ eventType: "S_1200", error: `Folha de pagamento não encontrada para ${month}/${year}` });
      return seq;
    }

    const items = employeeIds?.length
      ? payroll.items.filter(i => employeeIds.includes(i.employeeId))
      : payroll.items;

    for (const item of items) {
      const existing = await this.prisma.eSocialEvent.findFirst({
        where: { companyId, eventType: "S_1200", sourceEntityType: "PayrollItem", sourceEntityId: item.id },
      });
      if (existing) { result.skipped++; continue; }

      const eventId = generateEventId(company.cnpj ?? "", seq);
      const xml = buildXmlS1200(
        { cnpj: company.cnpj ?? "" },
        item.employee as unknown as Record<string, unknown>,
        item as unknown as Record<string, unknown>,
        year,
        month,
        eventId,
      );

      await this.prisma.eSocialEvent.create({
        data: {
          companyId,
          eventType: "S_1200",
          status: "DRAFT",
          sequenceNumber: seq,
          referenceYear: year,
          referenceMonth: month,
          employeeId: item.employeeId,
          payrollId: payroll.id,
          sourceEntityType: "PayrollItem",
          sourceEntityId: item.id,
          eventId,
          xmlContent: xml,
        },
      });

      seq++;
      result.generated++;
    }

    return seq;
  }

  private async generatePaymentEvents(
    companyId: string,
    company: { cnpj: string | null; name: string },
    year: number,
    month: number,
    employeeIds: string[] | undefined,
    seq: number,
    result: GenerateEventsResult,
  ): Promise<number> {
    const payroll = await this.prisma.payroll.findFirst({
      where: { companyId, referenceYear: year, referenceMonth: month },
      include: {
        items: { include: { employee: true } },
      },
    });

    if (!payroll) {
      result.errors.push({ eventType: "S_1210", error: `Folha de pagamento não encontrada para ${month}/${year}` });
      return seq;
    }

    const items = employeeIds?.length
      ? payroll.items.filter(i => employeeIds.includes(i.employeeId))
      : payroll.items;

    for (const item of items) {
      const existing = await this.prisma.eSocialEvent.findFirst({
        where: { companyId, eventType: "S_1210", sourceEntityType: "PayrollItem", sourceEntityId: item.id },
      });
      if (existing) { result.skipped++; continue; }

      const eventId = generateEventId(company.cnpj ?? "", seq);
      const xml = buildXmlS1210(
        { cnpj: company.cnpj ?? "" },
        item.employee as unknown as Record<string, unknown>,
        item as unknown as Record<string, unknown>,
        year,
        month,
        eventId,
      );

      await this.prisma.eSocialEvent.create({
        data: {
          companyId,
          eventType: "S_1210",
          status: "DRAFT",
          sequenceNumber: seq,
          referenceYear: year,
          referenceMonth: month,
          employeeId: item.employeeId,
          payrollId: payroll.id,
          sourceEntityType: "PayrollItem",
          sourceEntityId: item.id,
          eventId,
          xmlContent: xml,
        },
      });

      seq++;
      result.generated++;
    }

    return seq;
  }

  // --------------------------------------------------------------------------
  // VALIDAÇÃO
  // --------------------------------------------------------------------------

  async validateEvent(id: string, companyId: string): Promise<{ valid: boolean; errors: ValidationError[] }> {
    const event = await this.prisma.eSocialEvent.findFirst({
      where: { id, companyId },
    });

    if (!event) return { valid: false, errors: [{ field: "id", message: "Evento não encontrado", code: "NOT_FOUND" }] };
    if (!event.xmlContent) return { valid: false, errors: [{ field: "xmlContent", message: "XML não gerado", code: "MISSING_XML" }] };

    const errors: ValidationError[] = [];

    // Validação básica de estrutura XML
    if (!event.xmlContent.includes("<?xml")) {
      errors.push({ field: "xmlContent", message: "XML inválido — cabeçalho ausente", code: "INVALID_XML" });
    }
    if (!event.xmlContent.includes("<eSocial")) {
      errors.push({ field: "xmlContent", message: "XML inválido — tag raiz eSocial ausente", code: "INVALID_XML" });
    }

    const valid = errors.length === 0;

    await this.prisma.eSocialEvent.update({
      where: { id },
      data: {
        status: valid ? "VALIDATED" : "DRAFT",
        validationErrors: errors.length > 0 ? JSON.parse(JSON.stringify(errors)) : undefined,
      },
    });

    return { valid, errors };
  }

  async validateBatch(batchId: string, companyId: string): Promise<{ valid: boolean; totalErrors: number }> {
    const events = await this.prisma.eSocialEvent.findMany({
      where: { batchId, companyId, status: "DRAFT" },
    });

    let totalErrors = 0;
    for (const event of events) {
      const { errors } = await this.validateEvent(event.id, companyId);
      totalErrors += errors.length;
    }

    return { valid: totalErrors === 0, totalErrors };
  }

  // --------------------------------------------------------------------------
  // LOTES
  // --------------------------------------------------------------------------

  async createBatch(companyId: string, groupType: GroupType): Promise<{ id: string; batchNumber: number }> {
    const lastBatch = await this.prisma.eSocialBatch.findFirst({
      where: { companyId },
      orderBy: { batchNumber: "desc" },
      select: { batchNumber: true },
    });

    const batchNumber = (lastBatch?.batchNumber ?? 0) + 1;

    const batch = await this.prisma.eSocialBatch.create({
      data: {
        companyId,
        batchNumber,
        groupType,
        status: "OPEN",
      },
    });

    return { id: batch.id, batchNumber };
  }

  async addEventsToBatch(batchId: string, companyId: string, eventIds: string[]): Promise<number> {
    const batch = await this.prisma.eSocialBatch.findFirst({
      where: { id: batchId, companyId, status: "OPEN" },
    });
    if (!batch) throw new Error("Lote não encontrado ou já fechado");

    const updated = await this.prisma.eSocialEvent.updateMany({
      where: {
        id: { in: eventIds },
        companyId,
        status: { in: ["DRAFT", "VALIDATED"] },
        batchId: null,
      },
      data: { batchId, status: "QUEUED" },
    });

    await this.prisma.eSocialBatch.update({
      where: { id: batchId },
      data: { eventsCount: { increment: updated.count } },
    });

    return updated.count;
  }

  async closeBatch(batchId: string, companyId: string) {
    const batch = await this.prisma.eSocialBatch.findFirst({
      where: { id: batchId, companyId, status: "OPEN" },
    });
    if (!batch) throw new Error("Lote não encontrado ou já fechado");

    return this.prisma.eSocialBatch.update({
      where: { id: batchId },
      data: { status: "CLOSED" },
    });
  }

  async listBatches(companyId: string, filters?: { status?: string; groupType?: string }) {
    const where: Record<string, unknown> = { companyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.groupType) where.groupType = filters.groupType;

    return this.prisma.eSocialBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { events: true } },
      },
    });
  }

  /**
   * Simula envio de lote (em produção real, faria chamada SOAP ao webservice do governo)
   */
  async sendBatch(batchId: string, companyId: string, userId?: string): Promise<BatchSendResult> {
    const batch = await this.prisma.eSocialBatch.findFirst({
      where: { id: batchId, companyId, status: "CLOSED" },
      include: { events: { where: { status: "QUEUED" } } },
    });

    if (!batch) throw new Error("Lote não encontrado ou não está fechado");
    if (batch.events.length === 0) throw new Error("Lote sem eventos para enviar");

    // Simular protocolo de envio
    const protocolNumber = `PROT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.eSocialBatch.update({
        where: { id: batchId },
        data: {
          status: "SENT",
          protocolNumber,
          sentAt: now,
          sentBy: userId,
        },
      }),
      this.prisma.eSocialEvent.updateMany({
        where: { batchId, companyId, status: "QUEUED" },
        data: { status: "SENT", sentAt: now },
      }),
    ]);

    return {
      batchId,
      protocolNumber,
      sentCount: batch.events.length,
      errors: [],
    };
  }

  /**
   * Simula consulta de retorno do lote
   */
  async checkBatchResult(batchId: string, companyId: string) {
    const batch = await this.prisma.eSocialBatch.findFirst({
      where: { id: batchId, companyId, status: "SENT" },
      include: { events: { where: { status: "SENT" } } },
    });

    if (!batch) throw new Error("Lote não encontrado ou não foi enviado");

    // Simular resposta do governo — aceitar todos os eventos
    const now = new Date();
    let accepted = 0;

    for (const event of batch.events) {
      const receiptNumber = `REC${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      await this.prisma.eSocialEvent.update({
        where: { id: event.id },
        data: {
          status: "ACCEPTED",
          receiptNumber,
          receiptProtocol: batch.protocolNumber,
          processedAt: now,
        },
      });
      accepted++;
    }

    await this.prisma.eSocialBatch.update({
      where: { id: batchId },
      data: {
        status: "PROCESSED",
        processedAt: now,
        acceptedCount: accepted,
        rejectedCount: 0,
      },
    });

    return { accepted, rejected: 0, total: batch.events.length };
  }

  // --------------------------------------------------------------------------
  // EXCLUSÃO DE EVENTOS (S-3000)
  // --------------------------------------------------------------------------

  async excludeEvent(eventId: string, companyId: string): Promise<{ exclusionEventId: string }> {
    const event = await this.prisma.eSocialEvent.findFirst({
      where: { id: eventId, companyId, status: "ACCEPTED" },
    });
    if (!event) throw new Error("Evento não encontrado ou não está aceito");

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { cnpj: true },
    });

    const lastEvent = await this.prisma.eSocialEvent.findFirst({
      where: { companyId },
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });
    const seq = (lastEvent?.sequenceNumber ?? 0) + 1;

    const newEventId = generateEventId(company?.cnpj ?? "", seq);

    const exclusionEvent = await this.prisma.eSocialEvent.create({
      data: {
        companyId,
        eventType: "S_3000",
        status: "DRAFT",
        sequenceNumber: seq,
        referenceYear: event.referenceYear,
        referenceMonth: event.referenceMonth,
        employeeId: event.employeeId,
        sourceEntityType: "ESocialEvent",
        sourceEntityId: event.id,
        eventId: newEventId,
        xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtExclusao/v_S_01_02_00">
  <evtExclusao Id="${newEventId}">
    <ideEvento>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FRM_ERP_1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${formatCnpjForESocial(company?.cnpj)}</nrInsc>
    </ideEmpregador>
    <infoExclusao>
      <tpEvento>${event.eventType.replace("S_", "S-")}</tpEvento>
      <nrRecEvt>${event.receiptNumber ?? ""}</nrRecEvt>
    </infoExclusao>
  </evtExclusao>
</eSocial>`,
      },
    });

    await this.prisma.eSocialEvent.update({
      where: { id: eventId },
      data: { status: "EXCLUDED", excludedByEventId: exclusionEvent.id },
    });

    return { exclusionEventId: exclusionEvent.id };
  }

  // --------------------------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------------------------

  async getDashboard(companyId: string): Promise<ESocialDashboard> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const events = await this.prisma.eSocialEvent.findMany({
      where: { companyId },
      select: { status: true, eventType: true, sentAt: true },
    });

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let lastSentAt: Date | null = null;

    for (const e of events) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
      byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
      if (e.sentAt && (!lastSentAt || e.sentAt > lastSentAt)) {
        lastSentAt = e.sentAt;
      }
    }

    const openBatches = await this.prisma.eSocialBatch.count({
      where: { companyId, status: { in: ["OPEN", "CLOSED"] } },
    });

    return {
      totalEvents: events.length,
      byStatus,
      byType,
      pendingCount: (byStatus["DRAFT"] ?? 0) + (byStatus["VALIDATED"] ?? 0) + (byStatus["QUEUED"] ?? 0),
      sentCount: byStatus["SENT"] ?? 0,
      acceptedCount: byStatus["ACCEPTED"] ?? 0,
      rejectedCount: byStatus["REJECTED"] ?? 0,
      openBatches,
      lastSentAt,
      currentPeriod: { year: currentYear, month: currentMonth },
    };
  }
}
