# Pré-requisitos — Mercury

Antes de usar o Mercury, é importante entender o que é necessário e quais decisões tomar.

## Conta do LinkedIn

### Conta oficial vs conta secundária

| Tipo | Risco | Recomendação |
|------|-------|-------------|
| **Sua conta principal** | Baixo se usado com moderação (dry-run + aprovação humana) | Uso diário normal, Mercury só acelera ações que você faria manualmente |
| **Conta secundária/alternativa** | Médio — LinkedIn pode suspeitar se o perfil é novo ou vazio | Só se for testar automação agressiva |

**Regra prática:** se você é um profissional com perfil legítimo e está buscando emprego de verdade, use sua conta principal. O Mercury com dry-run + human-in-the-loop não faz nada que um humano não faria — só mais rápido.

### Riscos reais

O Mercury não quebra os ToS do LinkedIn de forma diferente de qualquer automação de navegador. O risco existe, mas é mitigado por:

- **Nada é enviado automaticamente** — você aprova cada ação
- **Safety Gate** — quotas e delays no código (não no LLM)
- **Dry-run como padrão** — `--live` explícito pra ação real
- **Blacklist de 9 meses** — não re-pestereia recrutadores

Se o LinkedIn detectar atividade incomum, o pior cenário é um CAPTCHA ou restrição temporária. Banimento permanente é raro para automação leve com navegador real.

## LinkedIn MCP Server

O Mercury depende do [LinkedIn MCP Server](https://github.com/stickerdaniel/linkedin-mcp-server) para buscar perfis, vagas e enviar conexões.

### Autenticação

Há dois caminhos:

**A) Login manual via navegador (recomendado)**
```bash
uvx mcp-server-linkedin@latest --login
```
- Abre Chromium, você loga manualmente (inclui 2FA)
- Sessão salva em `~/.linkedin-mcp/profile/` (válida por meses)
- Não expõe senha a terceiros

**B) Importar sessão do seu navegador**
```bash
uvx mcp-server-linkedin@latest --import-from-browser chrome
```
- Puxa cookies do LinkedIn do seu Chrome logado
- Mais prático, mas pode falhar no Windows (cookies criptografados)

### Configuração no Mercury

```json
{
  "linkedinMcpCommand": ["uvx", "mcp-server-linkedin@latest"]
}
```

O Mercury usa o LinkedIn MCP para chamar ferramentas como `search_jobs`, `get_person_profile`, `connect_with_person`, `send_message`, `search_people`.

> ⚠️ Não fixe versão (`@latest`) — o LinkedIn muda a estrutura das páginas com frequência e versões fixas "apodrecem".

## Chrome / Chromium

Necessário para skills que usam Chrome MCP:

- **portal-filler** — preenche formulários ATS
- **job-scout** — busca com URL colada do LinkedIn
- **profile-optimizer** — edita perfil do LinkedIn

### Instalação

| Sistema | Comando |
|---------|---------|
| Windows | Baixar de google.com/chrome |
| macOS | `brew install --cask google-chrome` |
| Linux | `sudo apt install google-chrome-stable` |

### Chrome MCP

O Mercury usa o Chrome MCP para interagir com páginas web. Configure no seu agente (opencode, Claude Code):

```json
{
  "mcpServers": {
    "chrome": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

## Bun

O Mercury é compilado em binário único, mas para desenvolvimento ou instalação via bootstrap você precisa do Bun:

```bash
# Windows (PowerShell):
powershell -c "irm bun.sh/install.ps1 | iex"

# Linux/macOS:
curl -fsSL https://bun.sh/install | bash
```

### Verificar instalação
```bash
bun --version  # >= 1.2
```

## Agente de IA

O Mercury funciona com qualquer agente que suporte SKILL.md:

| Agente | Comando de setup |
|--------|-----------------|
| **opencode** | `mercury setup --agent opencode` |
| **Claude Code** | `mercury setup --agent claude` |
| **Cursor** | `mercury setup --agent cursor` |
| **Cline** | `mercury setup` (detecta automaticamente) |

## Proxy (opcional)

Necessário apenas se você rodar o Mercury em um servidor com IP de datacenter (AWS, DigitalOcean, etc.). O LinkedIn bloqueia IPs de datacenter com mais frequência.

Se você usa Mercury **no seu laptop/desktop com sua internet residencial**, **não precisa de proxy**.

### Como configurar (se necessário)

```json
{
  "proxy": {
    "enabled": true,
    "url": "socks5://localhost:1080"
  }
}
```

Opções de proxy:
- **SOCKS5 via SSH:** `ssh -D 1080 user@seu-servidor`
- **Cloudflared:** túnel gratuito para Cloudflare
- **Residential:** BrightData, Oxylabs, IPRoyal (pagos)

## Sistema Operacional

| SO | Binário | Observações |
|----|---------|-------------|
| Windows x64 | `mercury-windows-x64.exe` | Suporte completo, mas cookies criptografados do Chrome podem falhar no `--import-from-browser` |
| macOS Intel | `mercury-darwin-x64` | Testado, funciona bem |
| macOS ARM (M1/M2/M3) | `mercury-darwin-arm64` | Testado, funciona bem |
| Linux x64 | `mercury-linux-x64` | Melhor plataforma para servidores |
| Linux ARM64 | `mercury-linux-arm64` | Raspberry Pi, ARM servers |

## Resumo — Setup Mínimo

```bash
# 1. Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# 2. Instalar Mercury
irm https://raw.githubusercontent.com/joaovjo/mercury/main/app/scripts/bootstrap.ts | bun run -

# 3. Inicializar
mercury init

# 4. Instalar skills
mercury setup --all

# 5. Configurar LinkedIn MCP (uma vez)
uvx mcp-server-linkedin@latest --login

# 6. Pronto!
mercury dashboard
```
