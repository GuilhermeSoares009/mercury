# FAQ — Perguntas Frequentes

## Geral

### Mercury é gratuito?
Sim. Código aberto sob licença The Unlicense (domínio público).

### Mercury funciona no Windows?
Sim. Binário pré-compilado para Windows x64. Também funciona via WSL.

### Preciso de um agente específico?
Funciona com qualquer agente que suporte SKILL.md: opencode, Claude Code, Cursor, Cline.

## Instalação

### "bun não encontrado"
Instale o Bun primeiro: `powershell -c "irm bun.sh/install.ps1 | iex"` (Windows) ou `curl -fsSL https://bun.sh/install | bash` (Linux/macOS).

### O bootstrap falhou
Queda de rede ou GitHub API rate-limited. Tente: esperar 1 minuto e rodar de novo, ou build manual com `git clone && cd mercury/app && bun install && bun run build`.

## Skills

### Mercury envia mensagens automáticas no LinkedIn?
**Não.** Nada é enviado automaticamente. Toda skill que envia algo (convite, mensagem, candidatura) pára antes do submit e pede aprovação humana.

### Posso rodar várias skills ao mesmo tempo?
Não é recomendado. O LinkedIn MCP usa um navegador headless compartilhado. Execução paralela causa colisão e falha.

### Quantos convites posso enviar por dia?
O próprio skill limita a 10-15 por sessão. O LinkedIn tem um limite semanal de ~100 convites.

### O que acontece se um recrutador ignorar meu convite?
Após 7 dias sem aceitar, o convite é retirado automaticamente (pelo outreach-tracker). A pessoa fica em blacklist para aquela empresa por 9 meses.

## Dados

### Onde meus dados ficam armazenados?
Tudo em `~/.mercury/mercury.db` (SQLite local). Nenhum dado sai da sua máquina.

### Mercury coleta meus dados?
Não. Não há telemetria, analytics ou tracking. O único contato externo é a verificação de atualização (consulta GitHub Releases).

### Posso usar Mercury com várias contas do LinkedIn?
Não é suportado nativamente. Uma conta por instalação.

## Técnico

### Mercury precisa do Node.js?
Não. Usa Bun como runtime. O binário compilado não precisa nem de Bun instalado.

### Preciso instalar um MCP server do LinkedIn?
Sim. O [LinkedIn MCP Server](https://github.com/stickerdaniel/linkedin-mcp-server) precisa estar configurado no seu agente.

### Preciso do Chrome instalado?
Sim, para skills que usam Chrome MCP (portal-filler, algumas funções do job-scout).

### O dashboard é acessível de outro dispositivo?
Não propositalmente. O servidor bind em `127.0.0.1` com token aleatório. Só sua máquina local acessa.
