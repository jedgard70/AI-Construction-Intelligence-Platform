# PR21 SECURITY/CVE RECOVERY PLAN

PR legado auditado: #21  
Status atual: manter aberto até validação técnica da vulnerabilidade e plano de correção mínima.

## 1) Confirmar CVE real

Objetivo:
- validar se a CVE mencionada no PR #21 ainda se aplica ao estado atual de `main`.

Passos:
1. rodar auditoria de dependências (`npm audit` / scanner SCA equivalente);
2. mapear pacote, versão vulnerável, severidade e vetor de ataque;
3. verificar se há exploitabilidade real no contexto da Apex (runtime/build-only/dev-only).

Saída esperada:
- tabela CVE -> pacote -> versão atual -> versão corrigida -> severidade -> impacto real.

## 2) Identificar dependências afetadas

- listar apenas dependências diretamente relacionadas à CVE;
- separar:
  - dependências de runtime;
  - dependências de build/dev;
- evitar upgrades colaterais sem justificativa.

## 3) Escopo mínimo obrigatório

Escopo permitido no PR de segurança:
- `package.json`
- `package-lock.json`
- documentação de validação de segurança

Escopo proibido:
- alterações funcionais de páginas/APIs;
- mudanças de UI/UX;
- refactor estrutural não relacionado à CVE.

## 4) Branch nova recomendada

- `feature/security-cve-minimal-recovery`

Racional:
- isola correção de segurança;
- facilita auditoria e rollback;
- impede contaminação com mudanças legadas do PR #21.

## 5) Validações obrigatórias

1. `npm run build -- --webpack`
2. smoke básico de rotas críticas
3. rerun de scanner (`npm audit` ou ferramenta equivalente)
4. comparar antes/depois do risco CVE

## 6) Regras de qualidade

- sem alteração funcional;
- sem quebra de build;
- sem alteração em banco/migrations;
- sem alteração em CRM/Revenue/Storage;
- PR com relatório técnico curto e objetivo.

## 7) Critério de decisão

- Se CVE for confirmada e correção mínima viável:
  - abrir PR novo mínimo de segurança e encerrar PR #21 como substituído.

- Se CVE não se aplicar mais ao `main` atual:
  - documentar evidência e fechar PR #21 como obsoleto/sem impacto atual.

## 8) Entregável esperado

Documento de execução (futuro PR de segurança):
- CVE confirmada? (sim/não)
- dependências alteradas
- impacto funcional (esperado: nenhum)
- resultado de build/audit
- decisão final sobre merge
