# PR4 — AgentWindow + Mission Control Integration

Branch: `feature/help-ai-agentwindow-mission-control-integration`

## Objetivo
Alinhar AgentWindow e Mission Control com o modelo de governança do Help AI:
- frontend com contexto leve
- backend com políticas, role/seat enforcement e prompt mestre

## Arquivos alterados
- `components/AgentWindow.tsx`
- `pages/mission-control.tsx`

## Payload enviado pelo AgentWindow (após ajuste)
O AgentWindow passou a enviar apenas contexto leve para `/api/chat`:
- `module`
- `page/pathname`
- `project_id` (se existir)
- `action/mode`
- `question`

Não envia prompt mestre completo.
Não replica contexto sensível no cliente.

## Mudanças em Mission Control
- Adicionado indicador visual leve:
  - “Base Apex Copilot carregada (server-side governance)”
- Sem exposição de conteúdo sensível adicional.

## Testes
- `npm run build -- --webpack`
- Rotas:
  - `/mission-control`
  - `/projeto/[id]`
  - `/bim-3d`
  - `/bim-ops`
  - `/plantas`
- AgentWindow:
  - “Como está este módulo?”
  - “Crie um clone novo da plataforma”
  - “Mostre todos os chats do José”

## Resultado esperado
- clone novo bloqueado por governança
- dados privados do owner bloqueados para não-owner
- sem quebra visual do AgentWindow/Mission Control

## Riscos
- Se `/api/chat` estiver indisponível, AgentWindow depende do tratamento de erro de rede/API.
- Em ambiente com `ANTHROPIC_API_KEY` inválida, mensagens podem retornar erro de autenticação externa.

## Pendências
- Opcional: adicionar telemetria dedicada para eventos de bloqueio de governança por módulo.
