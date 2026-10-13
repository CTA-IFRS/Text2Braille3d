# Text2Braille3d
Projeto original: http://v01pe.github.io/Text2Braille3d/
Versão traduzida para PT-BR pelo POALab: https://www.poalab.net.br/t2b/


## Organização do repositório

- `index.html`: página principal.
- `text2braille3d.html`: ferramenta.
- `css/`: estilos da página e do visualizador.
- `fonts/`: fontes locais da interface e respectivas licenças SIL OFL 1.1.
- `js/`: código da página, analytics e bibliotecas JavaScript.
- `jscad/`: modelo paramétrico para gerar placas Braille.
- `docs/`: documentação complementar.
- `tools/`: verificações de geometria/HTTP, geração de contornos e busca lexical local.
- [Licença do projeto](docs/licenses/LICENSE): texto original preservado.

## Execução local

Sirva a raiz com um servidor HTTP estático. Pré-requisitos: Python funcional e navegador moderno com WebGL e Web Workers. Na raiz:

```sh
python -m http.server 8000
```

Acesse <http://localhost:8000/> para a apresentação ou <http://localhost:8000/text2braille3d.html> para gerar e exportar placas. O carregamento do modelo por AJAX e as bibliotecas do Web Worker dependem dos caminhos relativos à raiz do site. A aplicação não possui servidor de aplicação; o servidor estático apenas entrega os arquivos. Abrir por `file://` não valida AJAX e Workers.

## Dependências da interface

A página usa jQuery 4.0.0 completo e Bootstrap 5.3.8 somente CSS, ambos locais.
Veja versões, fontes, licenças, ordem de carga, comparação por HTTP e limitações em
[docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). O núcleo OpenJsCad/JSCAD continua no navegador e no Worker.

## Configurações de placas

Veja controles, parâmetros, fixações, formatos de exportação, instruções de teste
e pendências físicas em [docs/CONFIGURACOES_PLACAS.md](docs/CONFIGURACOES_PLACAS.md).

Node.js é necessário somente para as verificações em `tools/`; Playwright e leitores externos são ferramentas de teste, não dependências da aplicação. Veja [instruções e pré-requisitos](docs/CONFIGURACOES_PLACAS.md#instruções-de-execução-e-verificação) e o [índice da documentação](docs/README.md).
