# PACOTE STORAGE 1 — HANDOFF EXECUCAO LOCAL

Objetivo: orientar execução local (Codex/VS Code) do STORAGE-1 sem retrabalho e sem desvio de escopo.

Base recomendada:
- Repositório oficial: `D:\AI-constr\AI-Construction-Intelligence-Platform`
- Branch de trabalho local dedicada para implementação Storage.
- Referência funcional: `docs/PACOTE_STORAGE_1_FOUNDATION_SPEC.md`

## 1. Arquivos esperados na execução local

1. Migration SQL idempotente Storage Foundation (novo arquivo em `supabase/migrations/`).
2. Ajustes mínimos em APIs Storage (somente se necessário para aderir ao modelo aprovado).
3. Atualização documental de implementação (novo relatório de execução).

## 2. Migration esperada (resumo técnico)

A migration deve:
1. Garantir bucket `project-files` privado.
2. Criar/ajustar policies em `storage.objects` com foco em acesso por projeto.
3. Reconciliar regras de `documents` para vínculo com `project_members`.
4. Ser idempotente:
   - `CREATE ... IF NOT EXISTS`
   - `ALTER ... ADD COLUMN IF NOT EXISTS`
   - `CREATE INDEX IF NOT EXISTS`
   - políticas com `DROP POLICY IF EXISTS` + `CREATE POLICY`
   - constraints defensivas com `DO $$` + `pg_constraint`.

## 3. Comandos locais recomendados

### 3.1 Build
```powershell
npm run build -- --webpack
```

### 3.2 Supabase
```powershell
npx supabase status
npx supabase db push
```

Observação: executar `db push` apenas após revisão de diff SQL.

## 4. Testes obrigatórios (local)

1. **Auth/Role**
- sem token: APIs privadas devem negar acesso.
- owner/admin/member: validar permissões por projeto.

2. **Storage privado**
- upload em `project-files` com usuário autorizado.
- acesso via signed URL com TTL curto.
- negação para usuário sem vínculo no projeto.

3. **Consistência metadata**
- `documents` deve refletir objeto físico criado.
- remoção/atualização deve manter consistência lógica.

4. **Fluxo funcional**
- `/nova-analise` -> upload -> persistência `documents` -> consumo em `/projeto/[id]`.

## 5. Critérios de aceite de execução local

- Build passa após implementação.
- Migration aplica sem erro em ambiente parcial.
- Bucket privado validado.
- Signed URLs funcionam somente para perfis autorizados.
- Fluxo ponta a ponta validado com evidência técnica.

## 6. Rollback / backup

Antes de aplicar migration:
1. snapshot/backup do banco.
2. exportar policies atuais relacionadas a Storage.
3. registrar hash de commit base.

Se falhar:
1. reverter branch (sem `reset --hard` destrutivo em trabalho alheio).
2. restaurar backup de banco.
3. registrar incidente e causa raiz no relatório.

## 7. O que NAO fazer

- Não usar chave sensível no frontend.
- Não tornar bucket público para "facilitar teste".
- Não misturar escopo com CRM/Revenue.
- Não aplicar migrations temporárias (`tmp_*.sql`) em produção.
- Não executar em clone/paralelo fora do workspace oficial.

## 8. Entregáveis mínimos pós-execução local

1. PR técnico Storage-1 (migration + ajustes mínimos necessários).
2. Relatório de validação com testes e evidências.
3. Atualização de status global/roadmap/index dos pacotes.
