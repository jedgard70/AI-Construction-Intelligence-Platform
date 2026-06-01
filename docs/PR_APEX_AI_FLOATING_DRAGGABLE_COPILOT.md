# PR APEX AI FLOATING DRAGGABLE COPILOT

Data: 2026-06-01  
Branch: `feature/apex-ai-floating-draggable-copilot`  
Base: `origin/main`

## Objetivo

Transformar o ApexCopilot em widget flutuante, arrastavel, minimizavel e persistente sem alterar backend/chat payload sensivel.

## Arquivos alterados

1. `components/ApexCopilot.tsx`
2. `docs/PR_APEX_AI_FLOATING_DRAGGABLE_COPILOT.md`

## Mudancas de UX

1. Botao flutuante
- reposicionado para canto inferior direito;
- visual limpo com estado ativo/inativo.

2. Janela arrastavel
- drag pela barra superior (desktop);
- posicao limitada dentro da viewport;
- evita sair da tela.

3. Minimizar/maximizar
- botao minimizar/maximizar;
- botao fechar;
- estado compacto mantido.

4. Persistencia local
- salva `open`, `minimized` e `position` em `localStorage`;
- restaura na proxima visita;
- reajusta posicao em resize para nao sair da viewport.

5. Mobile
- comportamento fullscreen-like com margens;
- sem drag no mobile;
- fechar/minimizar disponiveis.

6. Chat UX
- titulo: `Apex AI`;
- subtitulo: `Copilot da Plataforma`;
- loading claro (`Apex AI analisando...`);
- mensagens de erro ja existentes mantidas;
- botao `Limpar conversa` adicionado.

## Seguranca e escopo

- Nenhuma alteracao em `pages/api/chat.js`.
- Nenhuma alteracao em backend Help AI.
- Payload continua minimo (modo + pagina + pergunta).
- Sem alteracao em CRM/Revenue/Storage/migrations/package files.

## Validacoes executadas

1. Build
- `npm run build -- --webpack` ✅

2. Rotas alvo (compilacao/artefato confirmado no build)
- `/dashboard` ✅
- `/mission-control` ✅
- `/crm/revenue` ✅
- `/projeto/[id]` ✅

3. Comportamentos validados em codigo
- drag com clamp de viewport ✅
- minimizar/maximizar ✅
- persistencia de estado/posicao em localStorage ✅
- fallback mobile sem quebrar layout ✅
- API/chat nao alterados ✅

## Riscos

1. Persistencia local pode guardar posicao de viewport antiga; mitigado com clamp em resize/mount.
2. Em ambientes com bloqueio de localStorage, widget cai para defaults de forma segura.

## Pendencias futuras de design

1. snap-to-grid opcional de posicao.
2. animacoes sutis de entrada/saida.
3. historico de conversa por pagina/projeto (se aprovado).
4. refinamento visual por Design Evolution Engine.
