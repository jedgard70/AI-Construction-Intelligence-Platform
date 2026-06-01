# AUDITORIA UNTRACKED POS STORAGE

Base: `main` em `9ac38f7`  
Workspace: `D:\AI-constr\AI-Construction-Intelligence-Platform`

## Tabela

CAMINHO | TIPO | PROVAVEL ORIGEM | RISCO | RECOMENDACAO | ACAO FUTURA
--- | --- | --- | --- | --- | ---
`docs/AUDITORIA_FILA_GITHUB_RESTANTE.md` | doc | auditoria GitHub anterior | baixo | B. Manter | versionar em PR docs ou arquivar
`docs/AUDITORIA_PRS_ANTIGOS_GITHUB.md` | doc | auditoria GitHub anterior | baixo | B. Manter | versionar em PR docs ou arquivar
`docs/MAIN_UPDATE_AFTER_STORAGE_REPORT.md` | doc | relatorio tecnico recente | baixo | B. Manter | versionar em PR docs
`docs/PR21_SECURITY_CVE_RECOVERY_PLAN.md` | doc | plano de recovery CVE/PR21 | medio | D. Precisa revisao humana | decidir se ainda faz parte do roadmap ativo
`recovery/pre-main-update-dirty-worktree/README_PRE_MAIN_UPDATE_DIRTY_WORKTREE.md` | recovery | preservacao de estado local | baixo | C. Arquivar | manter ate limpeza final aprovada
`recovery/pre-main-update-dirty-worktree/status.txt` | recovery | snapshot do git status | baixo | C. Arquivar | manter ate limpeza final aprovada
`recovery/pre-main-update-dirty-worktree/untracked-files.txt` | recovery | snapshot untracked | baixo | C. Arquivar | manter ate limpeza final aprovada
`recovery/pre-main-update-dirty-worktree/diff-name-status.txt` | recovery | snapshot diff-name-status | baixo | C. Arquivar | manter ate limpeza final aprovada
`recovery/pre-main-update-dirty-worktree/dirty-worktree.patch` | recovery | snapshot patch | baixo | C. Arquivar | manter ate limpeza final aprovada
`tmp_storage2_start_err.txt` | tmp log | execucao STORAGE-2 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage2_start_out.txt` | tmp log | execucao STORAGE-2 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage4_dev_err.txt` | tmp log | execucao STORAGE-4 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage4_dev_out.txt` | tmp log | execucao STORAGE-4 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage4_dev_results.txt` | tmp resultado | smoke STORAGE-4 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage4_smoke_results.txt` | tmp resultado | smoke STORAGE-4 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage4_start_err.txt` | tmp log | start local STORAGE-4 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage4_start_out.txt` | tmp log | start local STORAGE-4 | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage_e2e_dev_err.txt` | tmp log | E2E real dev runtime | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage_e2e_dev_out.txt` | tmp log | E2E real dev runtime | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage_e2e_start_err.txt` | tmp log | E2E real start runtime | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage_e2e_start_out.txt` | tmp log | E2E real start runtime | baixo | A. Pode excluir depois | excluir em lote com aprovacao
`tmp_storage_e2e_real_results.json` | tmp evidencia | resultado E2E real | medio | C. Arquivar | mover para pasta de evidencia/arquivo_historico
`tmp_storage_e2e_tokens.json` | tmp sensivel | tokens JWT de teste E2E | alto | D. Precisa revisao humana | remover com prioridade apos registrar evidencias (nao versionar)
`supabase/.temp/*` | temp infra | cache local supabase CLI | baixo | E. Ignorar no Git | adicionar/confirmar ignore; limpar so com aprovacao

## Classificacao (totais)

- A. Pode excluir depois: **12**
- B. Manter: **3**
- C. Arquivar: **6**
- D. Precisa revisao humana: **2**
- E. Ignorar no Git: **1** (condicional: apenas se existir)

## Itens criticos

1. `tmp_storage_e2e_tokens.json` (risco alto por conter JWT de teste).  
2. `docs/PR21_SECURITY_CVE_RECOVERY_PLAN.md` (pode estar desatualizado e conflitar com direcao atual).

## Proximos passos

1. Fazer PR documental curto com os docs de auditoria/relatorio que devem ficar.  
2. Arquivar a pasta `recovery/pre-main-update-dirty-worktree` em lote de historico (sem excluir).  
3. Executar limpeza dos `tmp_*` somente com aprovacao explicita do Jose.  
4. Tratar `tmp_storage_e2e_tokens.json` com prioridade (nao versionar; remover com aprovacao).
