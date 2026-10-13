# Agentes do Text2Braille3d

Responda em português. Leia README.md, docs/README.md quando relevantes.
Preserve alterações preexistentes e limite as edições à tarefa solicitada.

## Arquitetura e limites

Aplicação estática HTML/CSS/JavaScript com jQuery 4.0.0 completo, Bootstrap
5.3.8 somente CSS e OpenJsCad legado. As dependências são locais e versionadas.
O backend é o núcleo de conversão Braille e geometria JSCAD no navegador/Worker;
não existe servidor de aplicação. Não migrar bibliotecas ou introduzir framework
sem solicitação. Manter caminhos AJAX/Worker e ordem de scripts.

## Responsabilidades

- `orchestrator`: agente principal por padrão; define escopo, delega, integra e valida.
- `designer`: interpreta referências e design system; entrega especificação ao front.
- `front`: index.html, css/ e integração DOM/jQuery em js/main.js.
- `backend`: jscad/braille.jscad e integração do motor em js/openjscad.js.
- `documentation`: documentação Markdown e TODO.txt, baseada no código e evidências.

Os perfis nativos ficam em .codex/agents/*.toml; configuração em .codex/config.toml.
Bibliotecas js/csg.js, js/lightgl.js, js/jquery-4.0.0.min.js e
css/bootstrap-5.3.8.min.css são dependências
vendorizadas: evitar edições diretas sem necessidade demonstrada.
Não carregar jQuery antigo junto do atual, jQuery slim (não contém AJAX),
Bootstrap JS ou jQuery Migrate em produção. Bootstrap CSS precede os estilos
locais; preservar a ordem dos scripts e buscar JSCAD explicitamente como texto.
Front localiza controles pelos nomes em paramDefinitions/paramControls, sem
seletores posicionais :eq. Backend preserva o contrato desses nomes e Workers.
Novas atualizações exigem comparação de geração/exportação por HTTP e registro
das versões, fontes, licenças e limitações em docs/DEPENDENCIES.md.

## Delegação

Delegue trabalhos independentes quando a tarefa justificar. Informe objetivo,
arquivos autorizados, dependências e critérios de aceite. Um único responsável
edita cada arquivo por vez. js/main.js é compartilhado: coordenar front/backend.
O designer entrega tokens, componentes, estados, responsividade e acessibilidade;
o orchestrator encaminha ao front após resolver dependências. Não delegar de novo
uma tarefa já em execução. Especialistas reportam ao responsável antes de ampliar escopo.
Se subagentes não estiverem disponíveis, execute os papéis em sequência e informe.

## Skills e recuperação de conhecimento

Skills específicas estão em .agents/skills/. Leia apenas a skill da tarefa.
Use `powershell -NoProfile -ExecutionPolicy Bypass -File tools/search-agent-knowledge.ps1 -Query "jscad"`
para recuperar trechos locais com arquivo e linha. É busca lexical, sem embeddings.
Se houver RAG/MCP disponível, consulte-o e registre fonte e limitações; nunca
afirme consulta a um serviço indisponível. Veja docs/CODEX_AGENTS.md para catálogo.

## Validação

Sirva a raiz por HTTP para verificar AJAX e Workers. Para UI, verificar teclado,
foco, rótulos, layout estreito, console e geração/exportação do modelo.
Para geometria, comparar parâmetros, células Braille e dimensões antes/depois;
não afirmar conformidade normativa ou tátil sem fonte e validação apropriadas.
Não confundir análise estática com teste de navegador ou impressão física.
Finalize com arquivos alterados, verificações executadas e limitações reais.
