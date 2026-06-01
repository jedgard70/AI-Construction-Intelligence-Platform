# MCP Builder Playbook (Finalizado de TXT)

Fontes:
- `D:\AI Jedgard\skill\mcpbuilder.txt`
- `D:\AI Jedgard\skill\evaluation.txt`

## Objetivo
Guiar criacao de servidores MCP robustos para integrar APIs e servicos externos com ferramentas claras para LLM.

## Processo
1. Pesquisa de protocolo MCP + SDK
2. Planejamento dos endpoints/ferramentas
3. Implementacao com schema de entrada/saida
4. Teste e hardening
5. Avaliacao com perguntas reais e verificaveis

## Regras de design de tools
- Nome claro, orientado a acao
- Erros acionaveis (dizer como corrigir)
- Paginacao e filtros para reduzir contexto
- Anotacoes de risco (`readOnlyHint`, `destructiveHint`, etc.)

## Avaliacao minima
- 10 perguntas realistas
- respostas estaveis e verificaveis
- operacoes somente leitura para benchmark base
- arquivo de avaliacao padronizado

## Criterio de qualidade
- cobertura funcional + usabilidade para agente
- seguranca (sem exposicao de segredos)
- consistencia entre contrato da tool e comportamento real

