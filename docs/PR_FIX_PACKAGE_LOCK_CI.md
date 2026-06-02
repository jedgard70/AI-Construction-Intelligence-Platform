# PR Fix Package Lock CI

Branch: `feature/fix-package-lock-ci`

## Objetivo
Sincronizar `package-lock.json` com o `package.json` atual para destravar `npm ci` no GitHub CI.

## Causa
O `package-lock.json` estava fora de sincronia com o manifesto atual e refletia uma arvore de dependencias diferente da declarada em `package.json`.

## Divergencias principais auditadas
- `@anthropic-ai/sdk`
  - `package.json`: `^0.37.0`
  - lock antigo: `^0.96.0`
- `@supabase/ssr`
  - `package.json`: `^0.5.2`
  - lock antigo: `^0.10.3`
- `@vercel/speed-insights`
  - `package.json`: `^1.1.0`
  - lock antigo: `^2.0.0`
- `react`
  - `package.json`: `^19.0.0`
  - lock antigo: `^18.3.1`
- `react-dom`
  - `package.json`: `^19.0.0`
  - lock antigo: `^18.3.1`
- `lucide-react`
  - `package.json`: `^0.511.0`
  - lock antigo: `^1.16.0`
- `recharts`
  - `package.json`: `^2.15.3`
  - lock antigo: `^3.8.1`
- `three`
  - `package.json`: `^0.170.0`
  - lock antigo: `^0.184.0`
- O erro de `npm ci` tambem listava dezenas de dependencias faltantes no lock para a arvore atual.

## Arquivos alterados
- `package-lock.json`
- `docs/PR_FIX_PACKAGE_LOCK_CI.md`

## Comandos executados
1. `npm ci`
   - reproduziu a falha de sincronia entre manifesto e lockfile.
2. `npm install --package-lock-only`
   - regenerou inicialmente o lockfile a partir do `package.json` atual.
3. `npx npm@10 install --package-lock-only`
   - regenerou novamente o lockfile usando a mesma linha principal de npm do CI com Node 20.
4. `npx npm@10 ci`
   - validou a instalacao limpa com o lockfile compatibilizado para o ambiente do GitHub.
5. `NEXT_DISABLE_BUILD_WORKER=1 npm run build -- --webpack`
   - validou o build local apos a correcao.

## Resultado
- `package.json` nao precisou ser alterado.
- `package-lock.json` passou a refletir a arvore declarada no manifesto atual.
- `npm ci` do trilho compativel com o CI passou com sucesso.
- O build em webpack passou com sucesso.

## Riscos
- O lockfile novo pode introduzir diferencas amplas no diff por refletir a arvore inteira correta, mesmo sem mudar codigo funcional.
- Permanecem avisos nao bloqueantes:
  - vulnerabilidades moderadas reportadas pelo npm audit
  - aviso deprecado de `recharts@2.x`
  - aviso deprecado de `middleware` do Next

## Impacto no PR #68 Owner Command Chat
- O PR `#68` nao precisa de alteracao funcional.
- A expectativa e que, apos esta correcao entrar em `main`, os checks de `Build & Type Check` do PR `#68` deixem de falhar por lockfile fora de sincronia.
