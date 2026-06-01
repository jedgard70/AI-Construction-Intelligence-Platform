# Skill Creator (Finalizado de TXT)

Fonte: `D:\AI Jedgard\skill\skillcreate.txt`

## Objetivo
Criar, testar, melhorar e empacotar skills com ciclo iterativo:
1. Definir intenção
2. Escrever rascunho da skill
3. Criar casos de teste
4. Executar avaliação qualitativa e quantitativa
5. Revisar com feedback humano
6. Iterar até estabilidade

## Fluxo recomendado
1. **Capture intent**: quando a skill deve disparar, saída esperada, limites.
2. **Draft SKILL.md**: frontmatter forte (`name`, `description`) + instruções.
3. **Testes**: prompts reais (2-3 no mínimo), com cenários positivos e near-miss.
4. **Avaliação**: comparar qualidade, custo (tokens), tempo e robustez.
5. **Refino**: remover excesso, explicar “por quê”, evitar overfitting.
6. **Otimização de descrição**: calibrar trigger com queries realistas.

## Padrões de qualidade
- Descrição “pushy” o suficiente para evitar under-trigger.
- SKILL.md objetivo; referências grandes vão em `references/`.
- Sempre preferir instruções explicativas a regras rígidas sem contexto.
- Não introduzir comportamento surpresa ou inseguro.

## Entregáveis esperados
- `SKILL.md` pronto
- `references/` de suporte
- conjunto de testes/evals
- versão empacotada (quando aplicável)

