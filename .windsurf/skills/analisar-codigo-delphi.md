# Skill: Analisar Código Delphi FRM

## Descrição
Analisa código fonte Delphi do sistema FRM original para entender funcionalidades e auxiliar na migração.

## Localização do Código Fonte
```
/Users/pdv/Downloads/FRM SUITE/
```

## Estrutura de Módulos

### Nomenclatura de Pastas
- `CP*` - Compras (CP10-Materiais, CP11-Fornecedores, CP12-Cotações, CP13-OC, CP14-NFe, CP15-Saídas)
- `EST*` - Estoque
- `OP*` - Produção
- `PV*` - Vendas
- `FN*` - Financeiro
- `DP*` - RH/Pessoal
- `A00*` - Sistema/Integrações

### Arquivos Importantes por Módulo
- `UntMain*.pas` - Formulário principal do módulo
- `UntDtM.pas` - DataModule com queries e conexões
- `Unt*Add*.pas` - Formulários de cadastro
- `Unt*Edt*.pas` - Formulários de edição
- `*.dfm` - Definição visual dos formulários

## Como Analisar um Módulo

### 1. Identificar Arquivos
```bash
find ~/Downloads/"FRM SUITE"/"NOME_MODULO" -name "*.pas" -exec basename {} \;
```

### 2. Analisar DataModule (UntDtM.pas)
- Queries SQL (TZQuery)
- Campos das tabelas
- Relacionamentos

### 3. Analisar Formulário Principal
- Funcionalidades disponíveis
- Menus e ações
- Validações de negócio

### 4. Mapear para Next.js
| Delphi | Next.js |
|--------|---------|
| TForm | Page component |
| TZQuery | Prisma query |
| TDataSource | tRPC router |
| TDBGrid | Table component |
| TButton.OnClick | Button onClick / mutation |

## Campos Comuns MySQL → PostgreSQL

### Tipos de Dados
| MySQL (Delphi) | PostgreSQL (Prisma) |
|----------------|---------------------|
| TZIntegerField | Int |
| TZDoubleField | Float |
| TZUnicodeStringField | String |
| TZDateTimeField | DateTime |
| TZShortIntField | Int (0/1 para Boolean) |

### Convenções de Nomes
| Delphi (PT) | Prisma (EN) |
|-------------|-------------|
| codMaterial | id / code |
| material | description |
| dtCriacao | createdAt |
| dtAlteracao | updatedAt |
| codEmpresa | companyId |
| codUsuario | userId |

## Tecnologias do Sistema Original
- **Linguagem**: Delphi (Object Pascal)
- **Banco**: MySQL via Zeos (ZConnection)
- **UI**: TMS AdvGrid, JVCL
- **NFe/CTe**: ACBr
- **REST**: RESTRequest4D
- **Email**: Indy (IdSMTP)

## Exemplo de Análise

### Analisar CP14 (Entrada NFe)
```bash
# Listar arquivos
find ~/Downloads/"FRM SUITE"/"CP14-ENTRADA MATERIAIS" -name "*.pas"

# Ver estrutura de validação NFe
cat ~/Downloads/"FRM SUITE"/"CP14-ENTRADA MATERIAIS"/Delphi/UntCP14ValidarNFe.pas | head -200
```

### Campos NFe Identificados
- `chaveNFe` - Chave 44 dígitos
- `numNF` - Número da nota
- `dtEmissao` - Data emissão
- `vlrNfe` - Valor total
- `p_cProd`, `p_xProd` - Código/descrição produto
- `p_qCom`, `p_uCom` - Quantidade/unidade
- `icms_*`, `ipi_*` - Impostos
