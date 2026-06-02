# Auditoria Owner Auth + Apex AI + Layout pos-72

Base auditada: `origin/main` em `856ca3b fix: enforce owner authentication for Owner Command Chat (#72)`

## Resultado executivo
- O merge `#72` resolveu corretamente a protecao de `/owner-command` sem sessao.
- O merge `#72` tambem resolveu corretamente `401` na API `/api/owner-command/chat` sem token.
- O problema do Apex AI global responder como `guest` continua confirmado no codigo e muito provavelmente em runtime.
- O problema de menus/sidebars duplicados continua confirmado no codigo e muito provavelmente em runtime.
- Drag do botao flutuante do Apex AI nao existe hoje.
- Fullscreen do Apex AI nao existe hoje.
- O drag da janela do Apex AI existe parcialmente, com persistencia de posicao da janela, mas nao cobre o botao nem fullscreen.

## Validacoes executadas
- `GET /owner-command` sem sessao local:
  - resultado: `307`
  - destino: `/login?redirect=%2Fowner-command&reason=owner-auth-required`
- `GET /api/owner-command/chat` sem token:
  - resultado: `401`
  - payload: `authentication_required`
- Auditoria de codigo:
  - `components/ApexCopilot.tsx`
  - `pages/api/chat.js`
  - `lib/owner-auth.ts`
  - `pages/owner-command.tsx`
  - `middleware.js`
  - `pages/_app.tsx`
  - `components/DashboardByRole.tsx`

## Bugs confirmados

### 1. Apex AI global nao envia sessao para `/api/chat`
Status: confirmado

Arquivos provaveis:
- `components/ApexCopilot.tsx`
- `pages/api/chat.js`

Evidencia:
- `components/ApexCopilot.tsx` chama `fetch('/api/chat', ...)` sem header `Authorization`.
- `pages/api/chat.js` resolve `guestContext` quando nao ha bearer token.

Impacto:
- Mesmo com usuario autenticado no frontend, o Apex AI global tende a responder como `guest`.
- Dr. Edgard pode entrar autenticado na plataforma e ainda assim o Apex AI global nao reconhece Owner.

Correcao proposta:
- Fazer `ApexCopilot` obter `session.access_token` via Supabase e enviar `Authorization: Bearer <token>` para `/api/chat`.
- Opcionalmente centralizar a resolucao de contexto usando `resolveOwnerContext` de `lib/owner-auth.ts` para eliminar duplicacao em `pages/api/chat.js`.

### 2. Reconhecimento de Owner esta correto em `/owner-command`, mas nao foi aplicado ao Apex AI global
Status: confirmado por codigo

Arquivos provaveis:
- `pages/owner-command.tsx`
- `pages/api/owner-command/chat.ts`
- `components/ApexCopilot.tsx`
- `pages/api/chat.js`

Evidencia:
- `pages/owner-command.tsx` envia bearer token nas chamadas do chat Owner.
- `pages/api/owner-command/chat.ts` exige token e resolve `isOwner`.
- `components/ApexCopilot.tsx` nao envia token.
- `pages/api/chat.js` usa logica semelhante, mas depende do bearer token que nunca chega do copilot global.

Impacto:
- O fluxo Owner funciona no Owner Command Chat quando ha sessao.
- O fluxo Owner nao se propaga para o Apex AI global.

Correcao proposta:
- Unificar o envio de sessao no frontend do Apex AI.
- Unificar a resolucao de Owner entre `/api/chat` e `lib/owner-auth.ts`.

### 3. Botao flutuante do Apex AI nao e arrastavel
Status: confirmado

Arquivo provavel:
- `components/ApexCopilot.tsx`

Evidencia:
- O botao `Apex AI` tem `position: fixed`, `right: 18`, `bottom: 18` e apenas `onClick`.
- Nao existe handler de drag no botao fechado.

Impacto:
- O usuario nao consegue reposicionar o launcher.
- A exigencia de botao realmente arrastavel nao esta atendida.

Correcao proposta:
- Adicionar drag proprio ao launcher fechado.
- Persistir a posicao do launcher no `localStorage`.
- Evitar abrir ao soltar depois de um gesto de drag.

### 4. Janela do Apex AI e arrastavel apenas parcialmente
Status: parcialmente implementado, parcialmente bug

Arquivo provavel:
- `components/ApexCopilot.tsx`

Evidencia:
- Existe `onMouseDown={startDrag}` no header da janela.
- Existe persistencia de `position` em `localStorage`.
- Existe `clampPosition` para viewport.
- Nao existe drag no botao fechado.
- Nao existe suporte claro para touch drag/mobile.

Impacto:
- Drag da janela aberta funciona no desktop por mouse.
- A experiencia ainda falha no botao flutuante e provavelmente em mobile touch.

Correcao proposta:
- Separar claramente drag do header e clique de controles.
- Adicionar pointer/touch drag.
- Persistir lancador e painel separadamente, ou normalizar uma unica ancora de posicao.

### 5. Fullscreen do Apex AI nao existe
Status: confirmado

Arquivo provavel:
- `components/ApexCopilot.tsx`

Evidencia:
- Controles atuais: minimizar e fechar.
- Nao existe estado `fullscreen`.
- Nao existe botao expandir.
- Painel usa dimensoes fixas:
  - desktop: `430x610`
  - mobile: viewport com margem

Impacto:
- Nao atende o requisito de quase tela inteira.
- Em desktop, o painel continua pequeno mesmo para fluxos longos.

Correcao proposta:
- Adicionar estado `fullscreen`.
- Botao expandir/contrair.
- Em fullscreen desktop, ocupar quase toda a viewport.
- Em mobile, usar painel praticamente total.

### 6. Menus duplicados continuam na estrutura do dashboard
Status: confirmado

Arquivos provaveis:
- `pages/_app.tsx`
- `components/layout/ApexShell.tsx`
- `components/DashboardByRole.tsx`

Evidencia:
- `pages/_app.tsx` envolve `/dashboard` com `ApexShell`.
- `ApexShell` renderiza um `aside` lateral proprio.
- `DashboardByRole.tsx` tambem renderiza outro `aside` lateral completo com nav e user box.

Impacto:
- O dashboard fica com dois sidebars/menus.
- Polui o layout e duplica navegacao.

Correcao proposta:
- Manter `ApexShell` como container oficial.
- Remover ou esconder o sidebar interno de `DashboardByRole` quando a pagina ja estiver dentro do shell.
- Preservar apenas o conteudo central, topbar e cards do dashboard.

## Itens que passaram na auditoria

### 1. `/owner-command` sem sessao redireciona para `/login`
Status: aprovado

Arquivos:
- `middleware.js`
- `pages/owner-command.tsx`

### 2. `login` respeita `redirect`
Status: aprovado por codigo

Arquivo:
- `components/LoginClient.tsx`

Evidencia:
- `redirectTarget` e lido de `router.query.redirect`
- o login finaliza com `window.location.href = redirectTarget`

### 3. API `/api/owner-command/chat` sem token retorna `401`
Status: aprovado

Arquivo:
- `pages/api/owner-command/chat.ts`

## Itens nao validados integralmente

### 1. Login real com `jedgard70@gmail.com` retornando para `/owner-command`
Status: nao validado em runtime nesta auditoria

Motivo:
- Nao foi usada credencial real durante a auditoria.

Observacao:
- O fluxo de redirect esta implementado no codigo e consistente.

### 2. `/owner-command` exibindo Owner para Dr. Edgard apos login real
Status: nao validado em runtime nesta auditoria

Motivo:
- Depende de sessao real Supabase.

Observacao:
- O caminho de codigo parece correto para `jedgard70@gmail.com`.

### 3. `/api/chat` respondendo como Owner com sessao valida
Status: nao validado em runtime, mas ha bug estrutural antes disso

Motivo:
- O Apex AI global nao envia token hoje, entao o fluxo Owner nao chega ao backend nessa rota.

## PR necessario
- Sim.
- Nome sugerido: `feature/fix-owner-auth-apex-ai-layout`

## Escopo minimo recomendado para o PR
- `components/ApexCopilot.tsx`
- `pages/api/chat.js`
- `lib/owner-auth.ts`
- `pages/_app.tsx` ou `components/DashboardByRole.tsx`
- `docs/PR_FIX_OWNER_AUTH_APEX_AI_LAYOUT.md`

## Ordem recomendada de correcao
1. Corrigir envio de sessao do Apex AI global para `/api/chat`.
2. Confirmar Owner/guest em runtime no Apex AI.
3. Remover duplicacao estrutural de sidebar no dashboard.
4. Implementar drag real do launcher e do painel.
5. Implementar fullscreen.
