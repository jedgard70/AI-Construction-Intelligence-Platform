# Mission Control — Owner Executor + UX Melhorada

**Data**: 2026-06-03  
**Versão**: 1.0  
**Status**: ✅ Pronto para Produção  
**Escopo**: Expansão de pages/owner-command.tsx + API segura

---

## Visão Geral

Expansão do Owner Command interface para incluir:
1. **Owner Executor** — Executor controlado de comandos operacionais
2. **Textarea Multi-linha** — Campo de comando confortável (4+ linhas)
3. **Web Speech API** — Ditado via microfone (com fallback)
4. **Log de Execução** — Histórico local da sessão
5. **Security Guard** — Apenas Owner pode executar comandos

---

## 1. Owner Executor

### 1.1 Funcionalidade

**Seção visível apenas para Owner** com:
- Dropdown de categorias de comando permitidas
- Botão "Executar" que chama API backend segura
- Log de execução com histórico completo

**Categorias permitidas (allowlist)**:
```
- health_check: Verificar saúde do sistema
- status_report: Gerar relatório de status
- generate_handoff: Gerar documento de handoff
- validate_module: Validar módulo específico
- create_report: Criar relatório operacional
```

### 1.2 Segurança

**Guard obrigatório**:
```
✓ Validação Bearer token no endpoint
✓ Verificação isOwner (de lib/owner-auth.ts)
✓ Apenas Owner pode acessar seção
✓ Admin/User/Guest veem mensagem bloqueada
✓ Retorna 401 sem token
✓ Retorna 403 se não Owner
✓ Allowlist de comandos (sem execução shell livre)
✓ Sem suporte a comandos destrutivos (rm/delete/drop/reset/migration)
```

### 1.3 API Endpoint

**POST /api/owner-command/execute**

Request:
```json
{
  "command": "health_check",
  "params": {
    "module": "crm"
  }
}
```

Response (200):
```json
{
  "success": true,
  "result": {
    "command": "health_check",
    "status": "success",
    "result": "{\"status\":\"healthy\",...}",
    "timestamp": "2026-06-03T20:45:00Z",
    "duration_ms": 245
  }
}
```

Response (401 sem token):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bearer token required"
  }
}
```

Response (403 não Owner):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only Owner can execute commands"
  }
}
```

---

## 2. Textarea Multi-linha Expandida

### 2.1 Melhorias UX

**Especificações**:
- Mínimo 120px de altura (4 linhas visíveis)
- Scroll interno automático quando texto cresce
- Resize vertical permitido
- Placeholder com instruções (Ctrl+Enter / Enter)

### 2.2 Keyboard Handling

**Comportamento**:
| Tecla | Ação |
|-------|------|
| Enter | Quebra de linha (nova linha no campo) |
| Ctrl+Enter | Envia mensagem / Executa ação |
| Shift+Enter | Quebra de linha (alternativa) |

**Implementação**:
```typescript
function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    submitMessage()
  }
  // Sem preventDefault para Enter normal → permite quebra linha
}
```

### 2.3 Placeholder e Instruções

```
"Continue um fluxo operacional com enforcement backend... 
(Ctrl+Enter para enviar, Enter para quebra de linha)"
```

---

## 3. Web Speech API — Microfone/Ditado

### 3.1 Funcionalidade

**Botão de Microfone** (🎤) no canto inferior direito da textarea:
- Clique para ativar gravação
- Estado visual durante gravação ("Ouvindo...")
- Texto ditado entra automaticamente no textarea
- **NÃO envia automaticamente** — Owner revisa antes de Ctrl+Enter

### 3.2 Suporte de Browser

**Browsers suportados**:
- Chrome/Edge: Suporte nativo
- Firefox: Suporte (com flag)
- Safari: Suporte (webkit prefix)
- Opera: Suporte

**Fallback**:
- Se navegador não suporta: Botão não aparece
- Aviso amigável exibido se erro ocorre
- Usuário pode continuar digitando normalmente

### 3.3 Configuração

```typescript
// Detecta suporte ao carregar página
useEffect(() => {
  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    setMicSupported(false) // Esconde botão
  }
}, [])

// Configuração
recognition.continuous = false // Uma frase por clique
recognition.interimResults = false // Apenas resultado final
recognition.lang = 'pt-BR' // Português Brasil
```

### 3.4 Comportamento

**Estados**:
1. **Parado**: Botão "🎤" (clicável)
2. **Gravando**: Botão "🎤 Ouvindo..." (desativado)
3. **Processando**: Reconhecimento em andamento
4. **Completo**: Texto adicionado ao textarea

**Não envia automaticamente**:
- Owner recebe texto no textarea
- Owner revisa antes de Ctrl+Enter
- Maior controle e segurança

---

## 4. Log de Execução Local

### 4.1 Estrutura

**Cada execução registra**:
```
[2026-06-03T20:45:12.345Z] health_check (success) - 245ms
{
  "status": "healthy",
  "timestamp": "2026-06-03T20:45:00Z",
  "uptime": 3641.293
}
```

### 4.2 Dados Capturados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | `exec_[timestamp]` |
| command | string | Nome do comando |
| status | string | success / error / timeout |
| result | string | Resposta formatada (sem secrets) |
| timestamp | ISO 8601 | Quando executou |
| duration_ms | number | Tempo de execução |

### 4.3 Funcionalidades do Log

**Visualização**:
- Histórico mostrado em card abaixo de executor
- Máximo 400px altura com scroll interno
- Último execução no topo (LIFO order)

**Ações**:
- 📋 **Copiar**: Copia log completo em formato texto
- 🖨️ **Imprimir**: Abre dialog print (CSS print otimizado)
- 🗑️ **Limpar**: Remove histórico local da sessão

**Estilos de Status**:
- 🟢 Success: Verde (#4caf50)
- 🔴 Error: Vermelho (#f44336)
- 🟠 Timeout: Laranja (#ff9800)

---

## 5. Security & Governança

### 5.1 Regras Absolutas

```
✓ Apenas Owner (isOwner === true) vê seção executor
✓ Admin, User, Guest veem mensagem "🔒 Bloqueado"
✓ Segundo assento (outro Owner login) não executa
✓ Sem token = 401 Unauthorized
✓ Não Owner = 403 Forbidden
✓ Comando não na allowlist = 400 Bad Request
✓ Timeout > 15s = 504 Gateway Timeout
```

### 5.2 Allowlist Enforcement

```typescript
const ALLOWED_COMMANDS = {
  health_check: { name: 'Health Check', timeout: 5000 },
  status_report: { name: 'Status Report', timeout: 10000 },
  generate_handoff: { name: 'Generate Handoff', timeout: 15000 },
  validate_module: { name: 'Validate Module', timeout: 10000 },
  create_report: { name: 'Create Report', timeout: 15000 },
}
```

**Proibido**:
- ❌ Execução shell livre
- ❌ rm, delete, drop, reset
- ❌ Migrations sem aprovação futura
- ❌ Expor secrets em logs
- ❌ Comandos destrutivos

### 5.3 Safety Gate

Para comandos sensíveis (futuros):
- Implementar approval workflow
- Requer confirmação dupla do Owner
- Log de auditoria obrigatório
- Timeout reduzido antes de rollback

---

## 6. Arquivos Modificados

### 6.1 Frontend
```
pages/owner-command.tsx
- Expansão de 505 → ~800 linhas
- Novos tipos: ExecutionLog
- Novos hooks: useEffect (mic detection), useState (executor states)
- Novas funções: startMicrophoneInput, handleTextareaKeyDown, executeOwnerCommand, copyLogToClipboard, clearExecutionLogs, printLogs
- Nova seção JSX: Owner Executor
- Novos estilos: textareaContainer, micButton, executorSection, logContainer, etc.
```

### 6.2 Backend
```
pages/api/owner-command/execute.ts (novo arquivo)
- Validação Bearer token via getBearerToken()
- Verificação Owner via resolveOwnerContext()
- Allowlist de 5 comandos iniciais
- Timeout handling com Promise.race()
- Resposta segura (sem secrets)
- Logging de resultado (sem PII)
```

---

## 7. Validação & Testes

### 7.1 Testes Funcionais

**Owner com token válido**:
```
✓ Seção Owner Executor visível
✓ Dropdown de comandos funcional
✓ Botão Executar funciona
✓ API retorna 200 com resultado
✓ Log aparece abaixo
✓ Botões de copiar/limpar/print funcionam
✓ Microfone captura ditado (se suportado)
✓ Ctrl+Enter envia no chat
```

**User/Admin sem token**:
```
✓ Seção bloqueada com mensagem 🔒
✓ Executor não executável
✓ Sem acesso a log
```

**Guest session**:
```
✓ Executor completamente oculto
✓ Mensagem de bloqueio exibida
```

**Erro scenarios**:
```
✓ Sem token → 401
✓ Não Owner → 403
✓ Comando inválido → 400
✓ Timeout > 15s → timeout status
✓ Network error → erro local capturado
```

### 7.2 Build & CI/CD

```
✓ `npm run build` passa sem erro
✓ TypeScript strict: 0 errors
✓ Linting: 0 warnings
✓ No secrets exposed
✓ Vercel deployment: Green
✓ API endpoints: Responding 200
```

---

## 8. Próximas Evoluções (Futuro)

- [ ] Persistência de log (guardar em localStorage ou DB)
- [ ] Safety Gate approval workflow para comandos sensíveis
- [ ] Scheduler para executar comandos em horários específicos
- [ ] Webhooks para notificar resultado
- [ ] Custom command builder (criar novos comandos sem código)
- [ ] Rate limiting por Owner
- [ ] Audit trail persistente com timestamps

---

## 9. Checklist de Implementação

- ✅ API endpoint /api/owner-command/execute.ts criado
- ✅ Validação Bearer token
- ✅ Verificação Owner (isOwner)
- ✅ Allowlist de 5 comandos
- ✅ Timeout handling
- ✅ Resposta segura
- ✅ Frontend pages/owner-command.tsx expandido
- ✅ Textarea multi-linha (120px+)
- ✅ Keyboard handling (Ctrl+Enter)
- ✅ Web Speech API (com fallback)
- ✅ Owner Executor section
- ✅ Execution log local
- ✅ Copy/print/clear buttons
- ✅ Security guard (Owner-only)
- ✅ Estilos CSS
- ✅ Build passa
- ✅ CI/CD checks verdes

---

**Status**: ✅ PRONTO PARA PRODUÇÃO  
**Próximo Passo**: Merge para main, deploy em produção

