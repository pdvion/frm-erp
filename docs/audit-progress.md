# Auditoria FRM ERP - 03/02/2026

## Status: Em Progresso

## Problemas Encontrados

### 🟡 Médio - Warnings

| Módulo | Problema | Arquivo | Status |
|--------|----------|---------|--------|
| Dashboard | Chart width/height -1 warnings | Recharts | Pendente |
| Workflow Visual | Node type "task" not found | WorkflowEditor | Pendente |
| BI | Failed to load resource (API error) | bi router | Pendente |

### ✅ Páginas Testadas OK

| Módulo | Página | Status |
|--------|--------|--------|
| Dashboard | /dashboard | ✅ OK |
| ImpEx | /impex/dashboard | ✅ OK |
| ImpEx | /impex/processes | ✅ OK |
| Workflow | /workflow/definitions | ✅ OK |
| Workflow | /workflow/definitions/[id]/visual | ⚠️ Warning |
| Settings | /settings/ai | ✅ OK |

## Próximas Páginas a Testar

- [ ] /materials
- [ ] /suppliers
- [ ] /inventory
- [ ] /payables
- [ ] /receivables
- [ ] /hr/employees
- [ ] /production/orders
- [ ] /documents
- [ ] /settings/companies
- [ ] /settings/users
