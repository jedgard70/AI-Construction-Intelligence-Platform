# CLEANUP UNTRACKED POS STORAGE

Data: 2026-06-01  
Base: `docs/AUDITORIA_UNTRACKED_POS_STORAGE.md`

## Ações executadas

1. Segurança imediata:
- `tmp_storage_e2e_tokens.json` movido para:
  - `D:\AI-constr\_sensitive_backups\tmp_storage_e2e_tokens.json`
- Confirmado fora do `git status` no workspace do projeto.

2. Ignore preventivo atualizado:
- `.gitignore` atualizado com:
  - `tmp_*tokens*.json`
  - `*_tokens.json`
  - `.env*.local`
  - `supabase/.temp/`

3. Classe C arquivada (sem exclusão):
- Destino: `recovery/post-storage-untracked-archive`
- Itens movidos:
  - `README_PRE_MAIN_UPDATE_DIRTY_WORKTREE.md`
  - `status.txt`
  - `untracked-files.txt`
  - `diff-name-status.txt`
  - `dirty-worktree.patch`
  - `tmp_storage_e2e_real_results.json`

4. Classe A movida para revisão (sem exclusão):
- Destino: `recovery/post-storage-trash-review`
- Itens movidos:
  - `tmp_storage4_dev_err.txt`
  - `tmp_storage4_dev_out.txt`
  - `tmp_storage4_dev_results.txt`
  - `tmp_storage4_smoke_results.txt`
  - `tmp_storage4_start_err.txt`
  - `tmp_storage4_start_out.txt`
  - `tmp_storage_e2e_dev_err.txt`
  - `tmp_storage_e2e_dev_out.txt`

## Pendências

### Classe D (não mover / não apagar)
- `docs/PR21_SECURITY_CVE_RECOVERY_PLAN.md` (revisão humana)

### Classe A restantes (arquivos em uso por processo)
- `tmp_storage2_start_err.txt`
- `tmp_storage2_start_out.txt`
- `tmp_storage_e2e_start_err.txt`
- `tmp_storage_e2e_start_out.txt`

Observação: os 4 arquivos acima não foram movidos porque estavam bloqueados por processo no momento da execução.

## Próxima ação recomendada

1. Encerrar os processos que estão prendendo os 4 `tmp_*` restantes.
2. Mover esses 4 itens para `recovery/post-storage-trash-review`.
3. Abrir PR documental curto com os docs B (e auditorias), sem incluir `tmp_*`.
