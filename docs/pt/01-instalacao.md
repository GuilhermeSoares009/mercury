# Instalação

## Pré-requisitos

- **Bun** (>= 1.2) — o instalador precisa de Bun. [Instalar](https://bun.sh)
- **LinkedIn MCP Server** — necessário para skills de busca e perfil
- **Chrome/Chromium** — necessário para portal-filler e algumas skills

## Instalação Rápida

```bash
# Bash / zsh (Linux, macOS):
curl -fsSL https://raw.githubusercontent.com/joaovjo/mercury/main/app/scripts/bootstrap.ts | bun run -

# PowerShell 7+ (Windows):
irm https://raw.githubusercontent.com/joaovjo/mercury/main/app/scripts/bootstrap.ts | bun run -
```

Isso baixa o binário pré-compilado para seu SO/arquitetura e instala as skills nos agentes detectados.

## Instalação Manual (Build local)

```bash
git clone https://github.com/joaovjo/mercury.git
cd mercury/app
bun install
bun run build              # compila binário + assets
bun run build:targets      # cross-compila para todas as plataformas
```

O binário estará em `app/dist/mercury`.

## Configuração Inicial

```bash
mercury init                # cria ~/.mercury/ com config padrão
mercury setup --all         # copia skills para agentes detectados
```

## Atualização

Execute o mesmo comando de instalação novamente. O bootstrap detecta a versão atual e atualiza se necessário.

```bash
curl -fsSL https://raw.githubusercontent.com/joaovjo/mercury/main/app/scripts/bootstrap.ts | bun run -
```

Ou manualmente:
```bash
mercury update
```

## Plataformas Suportadas

| Plataforma | Binário |
|-----------|---------|
| Linux x64 | `mercury-linux-x64` |
| Linux ARM64 | `mercury-linux-arm64` |
| macOS x64 | `mercury-darwin-x64` |
| macOS ARM64 (M1/M2/M3) | `mercury-darwin-arm64` |
| Windows x64 | `mercury-windows-x64.exe` |
