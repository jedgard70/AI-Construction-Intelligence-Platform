@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   AI Construction Intelligence Platform — Setup Local   ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Verifica Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Node.js nao encontrado.
    echo  Instale em: https://nodejs.org/  ^(versao 20 ou superior^)
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% encontrado

:: Instala dependencias
echo.
echo  Instalando dependencias...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo  [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)
echo  [OK] Dependencias instaladas

:: Cria .env.local se nao existir
if not exist ".env.local" (
    echo.
    echo  Criando .env.local a partir do .env.example...
    copy .env.example .env.local >nul
    echo  [OK] .env.local criado
    echo.
    echo  ─────────────────────────────────────────────────────────
    echo   IMPORTANTE: Edite o arquivo .env.local e adicione sua
    echo   ANTHROPIC_API_KEY para ativar os agentes de IA.
    echo  ─────────────────────────────────────────────────────────
) else (
    echo  [OK] .env.local ja existe
)

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   Setup concluido! Para iniciar a plataforma execute:   ║
echo  ║                                                          ║
echo  ║              start.bat   ou   npm run dev               ║
echo  ║                                                          ║
echo  ║   Acesse: http://localhost:3000                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
