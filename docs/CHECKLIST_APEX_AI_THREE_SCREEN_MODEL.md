# Checklist — Apex AI Three-Screen Model

**Date:** 03/06/2026  
**Feature:** Redesign Apex AI from 5-tab model to 3-screen model (Manual, Supervisor, Status)  
**Status:** ✅ Implemented & Validated

---

## Objetivo

Simplificar a Apex AI em 3 telas independentes, cada uma com seu próprio histórico de chat:

1. **Manual** — para todos os usuários autenticados
2. **Supervisor** — somente para Owner
3. **Status** — somente para Owner

Remover modelo anterior de abas (Chat, Master 001) e criar contextos separados para cada tela.

---

## Problemas Resolvidos

### 1. Chat Tab Genérico ❌ → ✅ Removido
**Antes:** Aba "Chat" genérica sem contexto de modo  
**Depois:** Removida completamente; cada tela tem seu próprio chat

### 2. Master 001 Tab ❌ → ✅ Removido como Aba
**Antes:** Aba "Master 001" com conteúdo fixo  
**Depois:** Removida; Master 001 é assunto de conversa, não aba separada

### 3. Históricos Misturados ❌ → ✅ Separados
**Antes:** Todas as mensagens em um único array  
**Depois:** 3 arrays separados: manualMessages, supervisorMessages, statusMessages

### 4. Botões Owner Soltos ❌ → ✅ Contextualizados
**Antes:** Botões de Mission Control/Owner Command espalhados  
**Depois:** Botões aparecem apenas em Supervisor para Owner

---

## Mudanças Implementadas

### components/ApexCopilot.tsx

**Tipos:**
```typescript
type Screen = 'manual' | 'supervisor' | 'status'
// Removido: type Panel = 'chat' | 'manual' | 'supervisor' | 'status' | 'master001'
```

**Estados:**
```typescript
const [activeScreen, setActiveScreen] = useState<Screen>('manual')
// Removido: activePanel

const [manualMessages, setManualMessages] = useState<Msg[]>([INITIAL_ASSISTANT_MESSAGE])
const [supervisorMessages, setSupervisorMessages] = useState<Msg[]>([INITIAL_SUPERVISOR_MESSAGE])
const [statusMessages, setStatusMessages] = useState<Msg[]>([INITIAL_STATUS_MESSAGE])
// Removido: messages (agora 3 arrays separados)
```

**Mensagens Iniciais:**
```typescript
const INITIAL_ASSISTANT_MESSAGE = 'Olá! Estou aqui para ajudar. Como posso assistir?'
const INITIAL_SUPERVISOR_MESSAGE = 'Supervisor ativo. Pronto para supervisionar operações...'
const INITIAL_STATUS_MESSAGE = 'Status da plataforma. Qual aspecto da operação você quer aprofundar?'
```

**Telas (Screens):**
- Manual: sempre visível para usuários autenticados
- Supervisor: visível apenas para Owner
- Status: visível apenas para Owner
- Chat, Master 001: completamente removidas

**Função getScreenButtons():**
```typescript
Manual:
- "Como usar" → envia pergunta sobre usar a plataforma
- "Limpar tela" → limpa histórico de Manual

Supervisor (Owner only):
- "Mission Control" → navega para /mission-control
- "Owner Command" → navega para /owner-command
- "Owner Executor" → navega para /owner-command
- "Limpar tela" → limpa histórico de Supervisor

Status (Owner only):
- "Foundation / Master 001" → pergunta sobre status
- "Mission Control" → pergunta sobre operacional
- "Storage" → pergunta sobre Storage
- "Limpar tela" → limpa histórico de Status
```

**Função clearConversation():**
```typescript
if (activeScreen === 'manual') setManualMessages([INITIAL_ASSISTANT_MESSAGE])
else if (activeScreen === 'supervisor') setSupervisorMessages([INITIAL_SUPERVISOR_MESSAGE])
else if (activeScreen === 'status') setStatusMessages([INITIAL_STATUS_MESSAGE])
```

**Função send():**
- Adiciona user message ao array correto da screen ativa
- Envia tela para API via: `Tela: ${SCREEN_LABEL[activeScreen]}`
- Recebe resposta e adiciona ao array correto
- Cada screen mantém seu próprio contexto

**Rendering:**
- Tabs: mostra apenas Manual (sempre), Supervisor (se owner), Status (se owner)
- Chat: mostra mensagens da screen ativa (manualMessages, supervisorMessages, ou statusMessages)
- Buttons: mostra botões contextuais via getScreenButtons()
- Composer: sempre visível para enviar mensagens na screen ativa

**Remove completamente:**
- Aba "Chat"
- Aba "Master 001"
- Rendering de panel-specific content (supervisor panel card, status panel card, etc.)
- Referências a activePanel
- Array único de messages

---

## Validação Checklist

### Screen Visibility

- [x] Manual visível para todos os usuários autenticados
- [x] Supervisor visível apenas para Owner
- [x] Status visível apenas para Owner
- [x] Chat tab removido completamente
- [x] Master 001 tab removido completamente
- [x] Non-owner vê apenas Manual

### Manual Screen

- [x] Tab "Manual" sempre aparece
- [x] Botão "Como usar" envia pergunta sobre plataforma
- [x] Botão "Limpar tela" limpa histórico (não toca outras screens)
- [x] Histórico de Manual não polui Supervisor/Status
- [x] Web Speech API funciona em Manual
- [x] Anexos funcionam em Manual
- [x] Ctrl+Enter envia em Manual

### Supervisor Screen (Owner Only)

- [x] Tab "Supervisor" aparece apenas para Owner
- [x] Botão "Mission Control" navega para /mission-control
- [x] Botão "Owner Command" navega para /owner-command
- [x] Botão "Owner Executor" navega para /owner-command
- [x] Botão "Limpar tela" limpa histórico de Supervisor
- [x] Histórico de Supervisor não polui Manual/Status
- [x] Web Speech API funciona em Supervisor
- [x] Anexos funcionam em Supervisor
- [x] Ctrl+Enter envia em Supervisor

### Status Screen (Owner Only)

- [x] Tab "Status" aparece apenas para Owner
- [x] Botão "Foundation / Master 001" envia pergunta
- [x] Botão "Mission Control" envia pergunta
- [x] Botão "Storage" envia pergunta
- [x] Botão "Limpar tela" limpa histórico de Status
- [x] Histórico de Status não polui Manual/Supervisor
- [x] Web Speech API funciona em Status
- [x] Anexos funcionam em Status
- [x] Ctrl+Enter envia em Status
- [x] Master 001 como assunto de conversa (não aba)

### Chat Context Separation

- [x] Manual tem own message array (manualMessages)
- [x] Supervisor tem own message array (supervisorMessages)
- [x] Status tem own message array (statusMessages)
- [x] Trocar de screen não perde histórico
- [x] send() atualiza screen correto
- [x] Limpar tela limpa apenas screen ativa

### API Integration

- [x] send() envia "Tela: Manual" / "Supervisor" / "Status" para /api/chat
- [x] Backend recebe tela context
- [x] Resposta é adicionada ao array correto
- [x] Errors também adicionados ao array correto

### Owner Restrictions

- [x] Non-owner não consegue clicar em Supervisor/Status tabs
- [x] Non-owner só vê Manual
- [x] Owner vê todas 3 screens
- [x] Owner buttons só aparecem em Supervisor
- [x] Non-owner não vê Owner buttons

### Build & Type Check

- [x] `npm run build` passa sem erro
- [x] TypeScript compila (pre-existing errors não relacionados)
- [x] Nenhum novo console warning
- [x] ApexCopilot.tsx compila
- [x] Tipos corretos para Screen, Msg, etc.

### Visual & UX

- [x] Tab layout mantido (flexbox, espaçamento)
- [x] Message bubbles igual (user: direita/azul, assistant: esquerda/branco)
- [x] Buttons styling mantido (pill buttons, action buttons)
- [x] Fullscreen comportamento preservado
- [x] Mobile responsiveness mantida
- [x] Character counter continua funcionando
- [x] Attachments preview mantido

### Attachments & Composer

- [x] Textarea funciona em todas 3 screens
- [x] File attachment button funciona
- [x] Microfone button funciona (pt-BR)
- [x] Enviar button funciona
- [x] Limpar input button funciona
- [x] Attachments listados corretamente
- [x] Remove attachment (✕) funciona

### Backward Compatibility

- [x] Launcher button ainda funciona
- [x] Fullscreen button ainda funciona
- [x] Minimize button ainda funciona
- [x] Close button ainda funciona
- [x] Drag & drop positioning mantido
- [x] LocalStorage state preserved

### Manual Content

Manual screen é chat, não static content. Contém:
- [x] Initial message: "Olá! Estou aqui para ajudar..."
- [x] User pode fazer perguntas
- [x] Apex AI responde
- [x] Histórico mantido ao trocar telas
- [x] "Como usar" button envia pergunta pré-formatada

### Supervisor Content

Supervisor screen é chat + buttons. Contém:
- [x] Initial message: "Supervisor ativo. Pronto para..."
- [x] User pode fazer perguntas operacionais
- [x] Apex AI responde
- [x] Buttons para navegar/executar ações
- [x] Histórico mantido ao trocar telas
- [x] Separate context de Manual/Status

### Status Content

Status screen é chat + context. Contém:
- [x] Initial message: "Status da plataforma..."
- [x] User pode perguntar sobre aspectos específicos
- [x] Buttons para quick questions: Foundation, Mission Control, Storage
- [x] Apex AI responde com status info
- [x] Histórico mantido ao trocar telas
- [x] Master 001 é assunto de conversa, não aba

---

## Scope Validation

- ✅ Apenas components/ApexCopilot.tsx modificado
- ✅ Nenhuma rota deletada
- ✅ Nenhuma migration
- ✅ Nenhuma dependency nova
- ✅ Nenhuma alteração de permissões globais
- ✅ Sem secrets expostos
- ✅ ApexShell/sidebar não alterado
- ✅ Topbar não alterado
- ✅ Dashboard não alterado

---

## Commit Message

```
fix: simplify Apex AI into Manual Supervisor Status screens

Redesign from 5-tab model (Chat, Manual, Supervisor, Status, Master 001)
to 3-screen model with separate chat contexts:

Manual screen:
- Available to all authenticated users
- "Como usar" button for help questions
- "Limpar tela" to clear chat history
- Dedicated message array (manualMessages)

Supervisor screen:
- Owner only
- Buttons: Mission Control, Owner Command, Owner Executor, Limpar tela
- Dedicated message array (supervisorMessages)
- Operational/command focused

Status screen:
- Owner only
- Quick buttons: Foundation/Master 001, Mission Control, Storage
- Dedicated message array (statusMessages)
- Platform state focused
- Master 001 as conversation topic, not separate tab

Implementation:
- Replace activePanel with activeScreen (manual|supervisor|status)
- Remove Chat and Master 001 tabs
- Separate message arrays per screen (no context pollution)
- send() updates correct screen's message array
- clearConversation() clears active screen only
- getScreenButtons() returns screen-specific actions
- Each screen has its own chat history

Maintains:
- All chat functionality (send, attachments, Web Speech API)
- Ctrl+Enter send, character counter
- Fullscreen layout and drag & drop
- Mobile responsiveness
- Owner access controls (Supervisor/Status Owner-only)

Removes:
- Generic Chat tab
- Master 001 tab (as separate entity)
- Panel-specific card content (now pure chat)
```

---

## Sign-Off

**Component:** ApexCopilot.tsx  
**Feature:** Three-Screen Model (Manual, Supervisor, Status)  
**Date:** 03/06/2026  
**Status:** ✅ READY FOR PRODUCTION

**Validation Priority:**
1. Owner sees 3 screens, Non-owner sees only Manual ✅
2. Screens have separate chat histories ✅
3. Buttons work and navigate correctly ✅
4. Web Speech API works in all screens ✅
5. Build passes all checks ✅

---

**READY FOR MERGE:** ✅
