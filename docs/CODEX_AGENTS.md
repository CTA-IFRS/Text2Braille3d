# Equipe Codex

Configuração local em `.codex/config.toml` e cinco perfis nativos em
`.codex/agents/`: `front`, `backend`, `documentation`, `orchestrator` e `designer`.
O nome correto do arquivo é `config.toml`. Modelo e permissões são herdados
do usuário/ambiente. Há até três subagentes simultâneos, além do principal.
Os limites de arquivos são instruções de coordenação, não isolamento de segurança.

## Uso

Abra uma nova sessão Codex na raiz após configurar. A configuração de projeto
depende da confiança atribuída ao repositório pelo cliente; se não for carregada,
verifique a configuração de confiança existente sem substituir configurações globais.

Exemplo: `Atue como orchestrator. Peça ao designer para interpretar o design
system fornecido, encaminhe a especificação ao front, alinhe os parâmetros com
backend e peça a documentation para registrar o resultado validado.`

Uma tarefa simples pode ser executada diretamente pelo responsável. Cada
atribuição deve definir objetivo, arquivos autorizados e evidência esperada.
Designer especifica; front implementa; backend mantém conversão/geometria;
documentation registra; orchestrator integra e resolve dependências.

## Skills e busca de conhecimento

Cinco skills específicas são descobertas em `.agents/skills/`; podem ser invocadas
por nome, por exemplo `$text2braille-jscad`. A instalação é local ao repositório.

Busca executável de trechos da base local:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/search-agent-knowledge.ps1 -Query "jscad" -Limit 10
```

O resultado inclui arquivo, linha e trecho para leitura contextual. Esta é uma
recuperação lexical de conhecimento para fundamentar respostas, sem índice vetorial,
embeddings ou serviço RAG. Nenhum endpoint RAG foi encontrado nas ferramentas da
sessão de configuração. Caso seja disponibilizado, consultar antes de acrescentar
skills e registrar proveniência, versão e limitações.

## Catálogo consultado em 2026-10-09

Consulta ao [catálogo público OpenAI Skills](https://github.com/openai/skills/tree/main/skills/.curated)
pela API GitHub. O helper Python não executou porque Python não está instalado;
a listagem foi recuperada por PowerShell. Não houve instalação global.

| Necessidade | Skill encontrada | Aplicação |
| --- | --- | --- |
| UI no navegador | playwright, playwright-interactive, screenshot | Opcionais para validar UI quando suas ferramentas estiverem disponíveis |
| Design system Figma | figma-create-design-system-rules, figma-implement-design, figma | Condicionais a referência Figma e conexão disponível |
| Configuração Codex | openai-docs | Documentação oficial e esquema de configuração |
| HTML/jQuery e JSCAD legado | Nenhuma específica na listagem consultada | Skills locais text2braille-front e text2braille-jscad |
| Documentação local e delegação | Nenhuma específica para este projeto | Skills locais text2braille-documentation e text2braille-orchestrate |

As skills Figma, computer-use e documentos disponíveis no cliente são condicionais
ao tipo de tarefa. Documentos Markdown comuns não exigem skills Word/PDF.
Catálogo disponível não equivale a skill instalada nem ferramenta operacional.

## Fontes de configuração

- [Agentes personalizados](https://learn.chatgpt.com/docs/agent-configuration/subagents): arquivos TOML com name, description e developer_instructions.
- [Configuração](https://learn.chatgpt.com/docs/config-file/config-reference): agents.enabled e max_concurrent_threads_per_session.
- [Skills locais](https://learn.chatgpt.com/docs/build-skills): descoberta em .agents/skills.

Não é necessária API, banco vetorial ou servidor novo para usar esses perfis.
Testes do aplicativo devem continuar distinguindo análise estática, navegador e
impressão física. Nenhuma alteração de UI ou geração 3D faz parte desta configuração.
