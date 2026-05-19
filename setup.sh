#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   AI Construction Intelligence Platform — Setup Local   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verifica Node.js
if ! command -v node &>/dev/null; then
  echo "❌ Node.js não encontrado."
  echo "   Instale em: https://nodejs.org/ (versão 20 ou superior)"
  exit 1
fi

NODE_VER=$(node --version)
echo "✅ Node.js $NODE_VER encontrado"

# Instala dependencias
echo ""
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps
echo "✅ Dependências instaladas"

# Cria .env.local se nao existir
if [ ! -f ".env.local" ]; then
  echo ""
  echo "📄 Criando .env.local a partir do .env.example..."
  cp .env.example .env.local
  echo "✅ .env.local criado"
  echo ""
  echo "─────────────────────────────────────────────────────────"
  echo " IMPORTANTE: Edite o arquivo .env.local e adicione sua"
  echo " ANTHROPIC_API_KEY para ativar os agentes de IA."
  echo "─────────────────────────────────────────────────────────"
else
  echo "✅ .env.local já existe"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Setup concluído! Para iniciar a plataforma execute:   ║"
echo "║                                                          ║"
echo "║              npm run dev                                 ║"
echo "║                                                          ║"
echo "║   Acesse: http://localhost:3000                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
