# Skill: Analisar Módulo para Evolução

## Descrição
Analisa um módulo do sistema Delphi original com olhar crítico para propor evoluções, não apenas reescrita.

## Princípio
> O Delphi é referência conceitual, não template para cópia.

## Processo de Análise

### Passo 1: Entender o Original
```bash
# Listar arquivos do módulo
find ~/Downloads/"FRM SUITE"/"NOME_MODULO" -name "*.pas" -exec basename {} \;

# Analisar código principal
cat ~/Downloads/"FRM SUITE"/"NOME_MODULO"/Delphi/UntMain*.pas | head -300
```

### Passo 2: Mapear Funcionalidades
Documentar:
- Ações disponíveis (menus, botões)
- Campos obrigatórios vs opcionais
- Regras de validação
- Fluxo do usuário

### Passo 3: Aplicar 5 Perguntas Obrigatórias

#### 1. Por que existe?
- Qual problema de negócio resolve?
- Quem usa e com que frequência?

#### 2. Ainda faz sentido?
- O contexto do negócio mudou?
- Existe alternativa melhor hoje?

#### 3. Pode ser simplificado?
- Quantos passos o usuário precisa fazer?
- Quais campos são realmente necessários?

#### 4. Pode ser automatizado?
- O que era manual pode ser automático?
- Quais decisões podem ser inferidas?

#### 5. Pode ser integrado?
- Sistemas externos fazem isso melhor?
- Existe API que resolve o problema?

### Passo 4: Propor Evolução
Criar tabela comparativa:

| Delphi (Original) | Evolução Proposta | Benefício |
|-------------------|-------------------|-----------|
| Ação manual X | Automação Y | Economia de tempo |

### Passo 5: Documentar Decisões
Registrar no Linear:
- O que será mantido e por quê
- O que será eliminado e por quê
- O que será automatizado
- Integrações necessárias

## Template de Análise

```markdown
# Análise de Evolução: [MÓDULO]

## 1. Visão Geral
- **Código**: CPxx
- **Nome**: 
- **Objetivo**: 

## 2. Funcionalidades Originais
- [ ] Funcionalidade 1
- [ ] Funcionalidade 2

## 3. Perguntas Respondidas
### Por que existe?
> Resposta

### Ainda faz sentido?
> Resposta

### Pode ser simplificado?
> Resposta

### Pode ser automatizado?
> Resposta

### Pode ser integrado?
> Resposta

## 4. Proposta de Evolução
| Original | Evolução | Benefício |
|----------|----------|-----------|
| | | |

## 5. Decisões
### Manter
- Item (justificativa)

### Eliminar
- Item (justificativa)

### Automatizar
- Item (como)

### Integrar
- Item (com qual sistema)
```

## Anti-Padrões a Evitar

❌ **Não fazer:**
- Copiar tela do Delphi
- Manter campo "porque sempre teve"
- Replicar processo manual
- Ignorar feedback de usuários

✅ **Fazer:**
- Questionar cada campo
- Simplificar fluxos
- Automatizar repetições
- Medir impacto
