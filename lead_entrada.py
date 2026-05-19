import json

# Simulação de um lead chegando de uma campanha de marketing
lead_entrada_json = """
{
    "nome": "Carlos Silva",
    "telefone": "+5511999999999",
    "interesse": "Construção de galpão comercial",
    "orcamento_estimado": 500000,
    "origem": "Campanha_Ads_Google"
}
"""

# Convertendo o JSON para um dicionário em Python
dados_lead = json.loads(lead_entrada_json)

# Função simulada para processar e classificar o lead
def analisar_lead(lead):
    prioridade = "Alta" if lead["orcamento_estimado"] > 300000 else "Média"
    
    # Montando a resposta com a análise e convertendo de volta para JSON
    resultado = {
        "lead_id": 101,
        "nome": lead["nome"],
        "classificacao_ia": prioridade,
        "status": "Aguardando Contato"
    }
    return json.dumps(resultado, indent=4, ensure_ascii=False)

# Executando a análise
lead_processado = analisar_lead(dados_lead)

print("Dados Processados para Integração:")
print(lead_processado)