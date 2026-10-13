# Dependências e atualização

Os resultados datados abaixo são históricos e pertencem às versões descritas em cada seção. A revisão mais recente está na seção final; instruções de reprodução não significam execução realizada.

Decisão de 09/10/2026: usar **jQuery 4.0.0 completo** e **Bootstrap 5.3.8 somente CSS**, com arquivos locais versionados. A aplicação continua estática; o núcleo OpenJsCad/JSCAD executa no navegador e em Web Worker, sem servidor de aplicação.

## Versões, fontes e licenças

| Dependência | Arquivo local | Fonte da distribuição | Licença preservada |
| --- | --- | --- | --- |
| jQuery 4.0.0 completo, minificado | `js/jquery-4.0.0.min.js` | [code.jquery.com](https://code.jquery.com/jquery-4.0.0.min.js) | MIT, [texto local](licenses/jquery-4.0.0-MIT.txt), [fonte oficial](https://github.com/jquery/jquery/blob/4.0.0/LICENSE.txt) |
| Bootstrap 5.3.8, CSS minificado | `css/bootstrap-5.3.8.min.css` | [distribuição indicada pelo Bootstrap](https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css) | MIT, [texto local](licenses/bootstrap-5.3.8-MIT.txt), [fonte oficial](https://github.com/twbs/bootstrap/blob/v5.3.8/LICENSE) |

SHA-256 dos arquivos locais verificados:

```text
jQuery:    39A546EA9AD97F8BFAF5D3E0E8F8556ADB415E470E59007ADA9759DCE472ADAA
Bootstrap: D85327D99C7A3EE1F9B5D0500D1370ACEA3AD2DB39C163C2F51F232BAEDBDEDE
```

O [guia oficial do jQuery 4](https://jquery.com/upgrade-guide/4.0/) descreve mudanças incompatíveis e recomenda migração acompanhada de testes. A decisão deste projeto se apoia na auditoria das APIs utilizadas e na comparação por HTTP descrita abaixo. A variante slim não serve ao carregamento AJAX do JSCAD. Não carregar jQuery Migrate em produção nem duas versões de jQuery simultaneamente. O jQuery 1.10.1 não está no checkout atual; sua presença e comparação nas execuções anteriores são históricas.

Bootstrap CSS pode ser usado sem seus componentes JavaScript, conforme a [introdução oficial](https://getbootstrap.com/docs/5.3/getting-started/introduction/). Esta integração usa estilos de formulários e botões; não carrega Bootstrap JS. O suporte publicado pelo [jQuery](https://jquery.com/support/) e pelo [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/browsers-devices/) não substitui testes deste aplicativo em cada navegador desejado. A integração tem como alvo navegadores modernos; Bootstrap 5 não oferece suporte a Internet Explorer.

## Ordem de carga e contratos

A ordem atual das duas páginas está registrada na seção “Página inicial, fontes locais e tutorial” abaixo; esta comparação anterior é histórica. Os estilos locais podem ajustar o Bootstrap.

Scripts da aplicação: `lightgl.js` → `csg.js` → `openjscad.js` → `jscad/braille.jscad` → `jquery-4.0.0.min.js` → `main.js`. O analytics mantém sua carga própria. Preservar caminhos relativos e ordem; as dependências atualizadas não dependem de CDN em execução.

`js/main.js` busca `jscad/braille.jscad` explicitamente como texto (`jQuery.get(..., 'text')`), entrega o conteúdo a `setJsCad` e mantém `setOpenJsCadPath('js/')` para o Worker. O motor e o Worker não dependem de jQuery. Os controles são associados por nomes em `paramDefinitions`/`paramControls`; seletores posicionais `:eq` foram removidos. Isso também corrige o ajuste de resolução que antes atingia o controle `stands`. O contrato de nomes e a geometria JSCAD permanecem preservados.

## Instruções para executar e comparar

Pré-requisitos: Python e navegador com WebGL e Web Workers. Na raiz:

```sh
python -m http.server 8000
```

Abra <http://localhost:8000/text2braille3d.html>; a raiz abre a apresentação `index.html`. O resultado esperado é o carregamento dos parâmetros e do visualizador, geração do modelo e possibilidade de exportar STL. HTTP é necessário para verificar AJAX e caminhos do Worker; abrir apenas `file://` não valida esses contratos.

Antes de novas atualizações, compare a versão anterior e a candidata por HTTP com os mesmos textos e parâmetros. Registre parâmetros, limites geométricos, polígonos, STL, execução do Worker, console e interação/layout; documente versões, fontes, licenças e limitações. Para conferir as distribuições locais no PowerShell:

```powershell
Get-FileHash js/jquery-4.0.0.min.js, css/bootstrap-5.3.8.min.css -Algorithm SHA256
```

## Evidência executada em 09/10/2026

Comparação automatizada por HTTP em Microsoft Edge headless, com Playwright 1.51.1 e WebGL SwiftShader, entre a versão anterior e a integrada, usando `Olá Mundo` e os mesmos parâmetros. O servidor Node temporário serviu a aplicação em `http://127.0.0.1:8765/`. Playwright e o harness ficaram no diretório temporário, sem adicionar dependência à aplicação.

Comandos executados no PowerShell pelo responsável pela integração, com servidor e snapshots anteriores preparados:

```powershell
node "$env:TEMP/text2braille-compat-tools/check.cjs" --baseline
node "$env:TEMP/text2braille-compat-tools/check.cjs"
node --check js/main.js
```

O harness e os snapshots não são ferramentas permanentes deste repositório; os comandos acima registram a execução desta sessão, não uma suíte disponível em um checkout novo.

| Medida | Anterior | Integrada |
| --- | --- | --- |
| Polígonos | 3754 | 3754 |
| Limites XYZ mínimos | `[-49.3125, -4, ~0]` | `[-49.3125, -4, ~0]` |
| Limites XYZ máximos | `[49.3125, 6, 22.2]` | `[49.3125, 6, 22.2]` |
| STL gerado | 362584 bytes | 362584 bytes |
| SHA-256 do STL baixado | `ec6c618756d0aa08586f3257c4d0d72f890d01304a9811e69c02917efd03a8ea` | `ec6c618756d0aa08586f3257c4d0d72f890d01304a9811e69c02917efd03a8ea` |
| Workers observados | 2 | 2 |
| Erros não tratados (`pageerror`) | 0 | 0 |

Na versão integrada, os 14 controles de parâmetros têm rótulos associados. As larguras de viewport 320, 576 e 1100 px foram verificadas sem rolagem horizontal; antes, o conteúdo ocupava 828 px nas duas larguras estreitas. Os hashes das duas distribuições locais também foram conferidos.

Tab/Shift+Tab e geração acionada por Enter foram verificados; o botão focado apresentou contorno sólido de 3 px. Resolução 31 foi limitada a 30, preservando `stands = true`. Em viewport de 320 px, arrastar o visualizador com mouse alterou `angleX` de -60 para -10. A checagem de sintaxe de `js/main.js` e `git diff --check` passaram.

## Limitações e pendências

A evidência cobre o caso e o navegador descritos; não garante ausência de regressões em todos os textos e combinações de parâmetros. Exportação X3D apresentou `bb is not defined` nas duas versões, falha preexistente no motor legado, que não foi alterado nesta integração. O analytics foi bloqueado pelo harness e não foi auditado. Outros navegadores, GPU física, toque em dispositivo físico e impressão física permanecem pendentes. Não foi validada conformidade normativa ou tátil Braille.

## Configurações de placas — atualização posterior em 09/10/2026

O registro acima pertence à atualização de jQuery/Bootstrap e permanece como histórico. A execução de configurações foi autorizada posteriormente pelo usuário. jQuery **4.0.0 completo** e Bootstrap **5.3.8 somente CSS** permanecem locais, com a mesma ordem de carga CSS/scripts descrita acima. Nenhum Bootstrap JS, jQuery slim/Migrate ou nova biblioteca de runtime foi integrado. AJAX explícito como texto e `setOpenJsCadPath('js/')` permanecem.

| Recurso | Versão e arquivo | Fonte oficial e licença |
| --- | --- | --- |
| Contornos DejaVu Sans | 2.37, dados embutidos em `jscad/braille.jscad` | [Projeto oficial](https://dejavu-fonts.github.io/), [distribuições 2.37](https://github.com/dejavu-fonts/dejavu-fonts/releases/tag/version_2_37); licença Bitstream Vera, alterações DejaVu em domínio público e avisos Arev preservados em [DejaVu-LICENSE.txt](licenses/DejaVu-LICENSE.txt) |
| fontTools, somente desenvolvimento | 4.60.2, usado por `tools/build-letter-contours.py`; não distribuído/carregado no navegador | [Projeto oficial](https://github.com/fonttools/fonttools/tree/4.60.2), [licença MIT oficial](https://github.com/fonttools/fonttools/blob/4.60.2/LICENSE) |
| Exportador 3MF local | 1.0, `OpenJsCad.exportPlate3MF` em `js/openjscad.js` | Implementação local; ZIP STORE com CRC32, sem empacotador externo. Referência: [3MF Core Specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md). Licença do projeto preservada em [licenses/LICENSE](licenses/LICENSE); a especificação é referência, não biblioteca incorporada |

Os contornos são carregados junto do JSCAD nos caminhos existentes da página e do Worker. O navegador não lê TTF nem executa fontTools. Para reproduzir o desenvolvimento dos contornos, obtenha `DejaVuSans.ttf` da distribuição oficial 2.37, tenha Python e fontTools 4.60.2 instalados em ambiente de desenvolvimento e execute na raiz:

```powershell
py tools/build-letter-contours.py C:/caminho/DejaVuSans.ttf
```

Resultado esperado: atualização da seção de contornos embutidos em `jscad/braille.jscad`. Este comando altera código gerado e deve ser executado apenas numa tarefa que autorize reconstrução da fonte; não é necessário para usar a aplicação.

O 3MF contém `[Content_Types].xml`, `_rels/.rels` e `3D/3dmodel.model`; materiais básicos e montagem usam milímetros e partes coordenadas. Cores de base/texto/pontos não são atribuição automática de filamentos. X3D usa `OpenJsCad.exportPlateX3D`, escritor XML local X3D 3.3, declarando milímetros com fator 0,001 e cores da visualização. Corrige `bb` indefinido e evita o DOCTYPE inválido do escritor CSG sem editar a biblioteca vendorizada; a falha do registro anterior foi reproduzida no baseline desta execução. Downloads usam Blob URL em vez da API FileSystem descontinuada; o método legado permanece no motor, sem uso no fluxo atual.

### Comparação HTTP desta execução

`node tools/check-plates-http.cjs` passou com código 0 usando Playwright 1.51.1 externo, Edge 155.0.4283.45 headless/SwiftShader e servidor local em porta dinâmica. Baseline e candidata, `Olá Mundo` com parâmetros iniciais: 3754 polígonos, mínimos `[-49.3125, -4, 0]`, máximos `[49.3125, 6, 22.2]`, STL 362584 bytes em ambos. A candidata baixou também 3MF 977956 bytes e X3D 939053 bytes. Texto visual `O B 8\nOlá`, sem apoios e centralizado: 4054 polígonos, STL 436284, 3MF 1161592 e X3D 1083627 bytes.

Foram observados sete Workers, nenhum erro não tratado, controles rotulados, teclado/foco e larguras 320/576/1100 px sem rolagem horizontal; downloads antigos foram bloqueados após alterações/erros. Three.js 0.180.0 (`ThreeMFLoader`, [fonte oficial](https://github.com/mrdoob/three.js/tree/r180), MIT) reabriu três partes com cores e limites dentro de `1e-4`; X_ITE 16.4.3 ([fonte oficial](https://github.com/create3000/x_ite), [licença MIT](https://github.com/create3000/x_ite/blob/main/LICENSE.md)) reabriu X3D com três Shapes, cores e geometria. Leitores ficaram fora da aplicação, servidos exclusivamente pelo harness. Não alteram a ordem de carga de produção. Relatório temporário: `C:/Users/Jason Piloti/AppData/Local/Temp/text2braille-plates-validation/http-results.json`; detalhes e instruções em [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md).

Os SHA-256 jQuery/Bootstrap acima foram reconferidos e permanecem iguais. SHA-256 da licença DejaVu preservada: `7A083B136E64D064794C3419751E5C7DD10D2F64C108FE5BA161EAE5E5958A93`.

Execução complementar `node tools/check-plates-http.cjs --ui-only` passou com texto ampliado por CSS a 200%, largura/rolagem 320/320 px e nenhum erro. Leitura independente de dimensões X3D no X_ITE confirmou conversão mm→metros dentro de `1e-6`. Comparação `node tools/test-plate-geometry.js --baseline-only`, com `T2B_BASELINE_JSCAD` apontando ao snapshot temporário anterior, passou em seis casos de acentos/múltiplas linhas/`upper` ligado e desligado, mantendo volumes, limites, polígonos e tabela Braille. Detalhes e limites de reprodução estão no documento de configurações.

Separadamente, `node tools/test-plate-geometry.js` passou na candidata. PrusaSlicer 2.9.0 reabriu STL/3MF de baseline e texto visual usando `--info`, informou malhas manifold e zero reparos no round-trip do baseline; a CLI preservou coordenadas usando `--dont-arrange --no-ensure-on-bed`. Partes foram importadas como objetos separados, com possível agrupamento manual; cores se perderam na reexportação realizada. Essa evidência não comprova impressão com filamentos ou comportamento de todos os fatiadores.

G7 permanece aberto para protótipos físicos e atribuição prática de filamentos. Não foi validada conformidade tátil/normativa Braille, resistência, encaixe real de parafusos ou impressão multicolorida.

## Ferramentas — atualização de 13/10/2026

A atualização automática, divisórias, sliders, catálogo M2–M6 e chanfros da orelha usam código local existente. Não foi adicionada dependência de runtime. Permanecem **jQuery 4.0.0 completo** e **Bootstrap 5.3.8 somente CSS**, com fontes oficiais, licenças e ordem CSS/scripts registradas acima. Os hashes SHA-256 das duas distribuições foram reconferidos nesta atualização e coincidem com os valores registrados. AJAX do JSCAD como texto e caminhos do Worker permanecem no contrato. Créditos e licenças existentes foram preservados.

**Evidência executada — computacional:** suíte de geometria, seis comparações de baseline, quatro lados com chanfros/reforços e quinze combinações de parafuso/alojamento aprovadas pelo responsável pelo backend; detalhes em [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md).

**Evidência executada — HTTP/interface:** `node tools/check-plates-http.cjs --ui-only` passou com código 0 em Edge 155.0.4283.45 headless/SwiftShader: larguras 320/576/1100 px, texto ampliado por CSS a 200%, rótulos, teclado, foco e erro direcionado ao campo; nenhum erro não tratado. Detalhes no documento de configurações.

**Evidência executada — comparação HTTP completa antes do ajuste para fim da interação:** `node tools/check-plates-http.cjs` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader, servidor em porta dinâmica de `127.0.0.1`, 29 Workers e nenhum erro não tratado. Baseline: 3754 polígonos, limites `[-49.3125,-4,~0]` / `[49.3125,6,22.2]`, STL 362584 bytes, equivalentes ao histórico; 3MF 977956 e X3D 939053 bytes. Sliders, sete grupos, retirada da geração manual, atualização automática, bloqueio e progresso foram verificados em interação. Defaults 0,5 da posição e 0,8 mm do relevo foram preservados. Chanfros exportaram STL/3MF de 363284/982642 bytes; M2, M5 e M6 exportaram STL de 368384 bytes cada. Leitores 3MF/X3D passaram novamente. Não foi comparado hash STL nesta execução. Detalhes, relatório temporário e limites estão em [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md). Impressão física, encaixe dos novos diâmetros e resistência dos reforços permanecem pendentes.

### Ajuste posterior: geração no fim da interação

A interface agora mantém a edição livre durante `input` e invalida a exportação anterior; gera em `change` (fim do arraste/confirmação do slider ou saída do campo de texto modificado). Cores também geram somente em `change`. O ajuste usa os mesmos arquivos e dependências locais, fontes, licenças e ordem de carga; não altera geometria ou formatos de exportação. O registro HTTP completo acima precede este ajuste.

**Executado — HTTP/interface após o ajuste:** `node tools/check-plates-http.cjs --ui-only` passou com código 0: digitação de 600 ms sem gerar/bloquear, saída do campo inicia geração/progresso, arraste real de 600 ms sem Worker intermediário e geração ao soltar. Baseline restaurado equivalente; layouts, ampliação CSS, rótulos, teclado/foco, erro direcionado e console sem erros passaram.

**Executado — HTTP completo após o ajuste:** `node tools/check-plates-http.cjs` passou com código 0 em Edge 155.0.4283.45 headless/SwiftShader, 31 Workers e nenhum erro não tratado. Interações de texto/slider, bloqueio/progresso, baseline de 3754 polígonos e STL 362584 bytes, demais formatos, exportações de chanfros e M2/M5/M6 e leitores independentes 3MF/X3D passaram. Tamanhos dos arquivos permaneceram iguais aos registrados antes deste ajuste; detalhes e relatório temporário em [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md). Nenhuma dependência, fonte, licença ou ordem de carga foi alterada. Pendências físicas permanecem.

### Cubo de orientação e seletor de vistas

A navegação da câmera usa CSS 3D e JavaScript locais em `css/custom.css`/`js/main.js`, sincronizados com `viewer.onDraw` da instância. Não adiciona biblioteca, não edita dependências vendorizadas, não regenera geometria e não muda a ordem CSS/scripts. jQuery **4.0.0 completo** e Bootstrap **5.3.8 somente CSS**, fontes oficiais e licenças permanecem conforme registro acima. Vistas, acessibilidade e remoção da mensagem visual de sucesso estão descritas em [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md). **Executado — HTTP/interface:** `node tools/check-plates-http.cjs --ui-only` passou com código 0 em Edge 155.0.4283.45 headless/SwiftShader: sete presets/seis faces, teclado, sincronização no arraste do canvas, zoom/deslocamento preservados e nenhuma regeneração ao mudar a vista. Layouts, ampliação CSS a 200%, rótulos/foco e console sem erros passaram. **Executado — HTTP completo após integrar a navegação:** `node tools/check-plates-http.cjs` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader, 31 Workers e nenhum erro não tratado. Testes do cubo/seletor, baseline de 3754 polígonos e STL 362584 bytes, demais exportações e leitores independentes 3MF/X3D passaram. Detalhes e relatório temporário no documento de configurações. GPU física, outros navegadores, toque físico e impressão não foram validados nesta atualização.

### Viewport, janelas e slider de zoom

O layout atual usa canvas na viewport inteira, barra superior, janelas Ferramentas/Sobre e slider de zoom logarítmico implementados em HTML/CSS/JavaScript locais. Canvas acompanha tamanho CSS e DPR limitado a 2; projeção usa o aspecto CSS. Zoom e cubo alteram somente câmera, sem regenerar geometria. Créditos, licença, links e tutorial foram preservados em Sobre. Nenhuma biblioteca ou alteração vendorizada foi introduzida: jQuery **4.0.0 completo**, Bootstrap **5.3.8 somente CSS**, fontes oficiais, licenças, AJAX/Worker e ordem de carga permanecem os registrados acima. **Executado — HTTP/interface após este layout:** `node tools/check-plates-http.cjs --ui-only` passou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. Canvas ocupou as viewports 320×900/576×900/1100×900/800×450, com backing store e razão da projeção verificados. Zoom por teclado/roda, janelas por teclado, quatro links preservados e ausência de geração por câmera passaram. Ampliação CSS a 200%, rótulos/foco e console sem erros passaram. **Executado — HTTP completo após este layout:** `node tools/check-plates-http.cjs` passou com código 0 em Edge 155.0.4283.45 headless/SwiftShader, 31 Workers e nenhum erro não tratado. Viewport/zoom/janelas, cubo, baseline de 3754 polígonos e STL 362584 bytes, todos os formatos e novos casos de fixação e leitores independentes 3MF/X3D passaram. Tamanhos dos arquivos iguais aos registros anteriores; detalhes e relatório temporário em [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md). Outros navegadores, GPU/toque físicos e impressão permanecem sem validação nesta atualização.
## Página inicial, fontes locais e tutorial — 13/10/2026

`index.html` agora apresenta a ferramenta com textos explicativos. A geração fica em `text2braille3d.html`, cujo título liga à página inicial. Esta seção atualiza os caminhos das páginas; os registros anteriores permanecem como evidência histórica.

A página inicial reutiliza **jQuery 4.0.0 completo** e **Bootstrap 5.3.8 somente CSS**, locais, com fontes e licenças oficiais registradas neste documento. Bootstrap JS, jQuery slim/Migrate e js-cookie não são carregados. Menu, contraste e cookies usam JavaScript local e APIs nativas; símbolos e SVG inline dispensam uma biblioteca de ícones.

| Fonte de interface | Distribuição obtida e pesos | Arquivos locais e licença |
| --- | --- | --- |
| Atkinson Hyperlegible | Google Fonts, caminho `v12`, 400/700 | `fonts/atkinson-hyperlegible-{400,700}.ttf`; [SIL OFL 1.1 local](../fonts/atkinsonhyperlegible-OFL.txt), [origem oficial](https://github.com/google/fonts/blob/main/ofl/atkinsonhyperlegible/OFL.txt) |
| Montserrat | Google Fonts, caminho `v31`, 400 | `fonts/montserrat-400.ttf`; [SIL OFL 1.1 local](../fonts/montserrat-OFL.txt), [origem oficial](https://github.com/google/fonts/blob/main/ofl/montserrat/OFL.txt) |
| Nunito | Google Fonts, caminho `v32`, 300/400/500/700 | `fonts/nunito-{300,400,500,700}.ttf`; [SIL OFL 1.1 local](../fonts/nunito-OFL.txt), [origem oficial](https://github.com/google/fonts/blob/main/ofl/nunito/OFL.txt) |

Os TTF foram obtidos por [Google Fonts CSS2 API](https://developers.google.com/fonts/docs/css2), com arquivos servidos por `fonts.gstatic.com`. `v12`/`v31`/`v32` identificam os caminhos da distribuição Google Fonts, não uma versão semântica das famílias. As licenças vieram de `raw.githubusercontent.com/google/fonts/main/ofl/{família}/OFL.txt`; foram reconferidas por HTTP 200 e comparadas aos textos locais em 13/10/2026. Como `main` é mutável, os arquivos locais e seus avisos preservados são a referência desta integração. `css/fonts-website.css` define `@font-face` e `font-display: swap`; o navegador não consulta Google Fonts para carregar essas fontes.

**Ordem atual:** em `index.html`, CSS `bootstrap-5.3.8.min.css` → `fonts-website.css` → `main-website.css` → `high-contrast-website.css`; scripts `jquery-4.0.0.min.js` → `main-website.js` → `high-contrast-website.js`. Em `text2braille3d.html`, CSS `bootstrap-5.3.8.min.css` → `main.css` → `openjscad.css` → `custom.css` → `fonts-website.css` → `theme-tool.css` → `high-contrast-tool.css`; scripts `lightgl.js` → `csg.js` → `openjscad.js` → `jscad/braille.jscad` → `jquery-4.0.0.min.js` → `main.js`. Analytics conserva carga própria externa na ferramenta. AJAX explícito como texto e caminhos do Worker permanecem.

O toast de tutorial da ferramenta é implementado em HTML, `css/custom.css`/`css/theme-tool.css` e `js/main.js`, sem Bootstrap JS. Mostra “Tutorial para impressão 3D de placas de sinalização em Braille” com o [link fornecido pelo usuário](https://drive.google.com/file/d/1IWFulWs4U3aXDutet2T7sLcc1oiayMGT/view?usp=sharing), permanece até ser fechado e devolve o foco ao título da ferramenta. O destino do link é externo; seu conteúdo não foi auditado.

**Instruções de execução:** com Python e navegador com WebGL/Workers, execute `python -m http.server 8000` na raiz e abra `http://localhost:8000/index.html`; entre na ferramenta pelo link da página. Espera-se carregar CSS/fontes/scripts locais e gerar/exportar a placa por HTTP.

**Evidência executada pelo responsável pela integração:** `node "$env:TEMP/t2b-review-tools/landing.cjs"` e `node "$env:TEMP/t2b-review-tools/check.cjs"` passaram por HTTP em Edge headless/SwiftShader, com Playwright 1.51.1 externo ao repositório. Na página inicial, foram verificados jQuery 4, fontes carregadas, ausência de solicitações externas/404/`pageerror`, remoção de Lorem ipsum, menus por Enter/`aria-expanded`, contraste persistente após recarga e ausência de rolagem horizontal em 320/576/1100 px. Na ferramenta, o baseline manteve 3754 polígonos e houve geração e exportação STL via Blob; toast coube nessas três larguras, fechamento por Enter devolveu foco ao título e não houve `pageerror`. Não foram comparados hash ou bytes do STL nesta execução. Os harnesses são temporários, não uma suíte versionada disponível em um checkout novo.

**Pendências e limites:** outros navegadores, GPU/toque físicos, impressão e conformidade tátil/normativa não foram validados nesta tarefa. A ausência de solicitações externas verificada na página inicial não se estende ao analytics da ferramenta nem ao acesso ao tutorial.


## Fontes transferidas para a raiz — 13/10/2026

A pasta de fontes da interface passou de `assets/fonts/` para `fonts/` na raiz. As sete URLs em `css/fonts-website.css` usam `../fonts/`. Não houve atualização de versões: fontes oficiais, licenças SIL OFL 1.1 e ordem de carga permanecem as registradas acima, assim como jQuery **4.0.0 completo** e Bootstrap **5.3.8 somente CSS**.

**Evidência executada:** os hashes SHA-256 dos dez arquivos transferidos (sete TTF e três textos OFL) permaneceram iguais; as sete URLs CSS resolvem para arquivos existentes. O responsável pela integração executou `node "$env:TEMP/t2b-review-tools/landing.cjs"` por HTTP em Edge headless: fontes locais carregadas, nenhuma solicitação externa, 404 ou `pageerror`, menus e contraste por teclado e layouts de 320/576/1100 px aprovados. O harness é temporário, sem dependência nova na aplicação.

**Limites:** esta transferência não incluiu nova comparação de geometria/exportação nem impressão física; as evidências anteriores permanecem históricas. Outros navegadores e dispositivos físicos continuam pendentes.

## Tema, contraste e erros da ferramenta — 13/10/2026

`text2braille3d.html` reutiliza as fontes locais documentadas acima e aplica a paleta roxa da página inicial, sombras e superfícies em `css/theme-tool.css`. Nunito compõe o corpo; Atkinson Hyperlegible, títulos e controles de seção. `css/high-contrast-tool.css` aplica o tema escuro de alto contraste mediante a classe `tool-high-contrast`. Configurações aparece após Sobre e oferece alternância por botão com `aria-pressed`. A preferência usa `localStorage`, chave `text2braille-tool-contrast`, independente do cookie de contraste da página inicial; sem armazenamento, funciona durante a visita. O tema altera interface e fundo do visualizador, preservando cores do modelo/exportação.

Erros aparecem em toasts persistentes até fechamento ou atualização do estado, com botão acessível, anúncio `role="alert"` e conteúdo inserido por `textContent`. Fechar devolve foco ao campo inválido visível ou a Ferramentas. A implementação usa HTML/CSS/JavaScript locais, sem biblioteca adicional ou atualização das dependências. Permanecem **jQuery 4.0.0 completo** e **Bootstrap 5.3.8 somente CSS**, com fontes oficiais e licenças já registradas; ordem de carga atualizada acima, AJAX como texto e caminhos do Worker preservados.

**Instruções:** com Python e navegador com WebGL/Workers, execute `python -m http.server 8000` na raiz e abra `http://localhost:8000/text2braille3d.html`. Em Configurações, alterne contraste e recarregue; provoque erro com texto vazio e feche o aviso pelo teclado. Espera-se persistência do tema, indicação do campo inválido e aviso acessível, mantendo geração/exportação por HTTP.

**Evidência executada pelo responsável pela integração:** `node "$env:TEMP/t2b-theme-run.cjs"` passou por HTTP com Playwright externo e Edge headless/SwiftShader, três Workers e nenhum `pageerror`, diálogo ou 404. Foram verificados Enter/Escape e foco das janelas, persistência após recarga, texto vazio com `aria-invalid` e toast, fechamento do aviso por Enter com retorno de foco, mensagem contendo HTML tratada como texto, falhas simuladas de carregamento AJAX/exportação/erro global e download STL por Blob e larguras 320/375/576/1100 px sem rolagem horizontal. Comparação antes/depois manteve parâmetros, 3754 polígonos, mínimos `[-49.3125,-4,0]`, máximos `[49.3125,6,22.2]` e SHA-256 do STL `d878ebc905ce2673e3177cf5aa962d944e0a1b1137fe1644f5e7b3f6a54475ff`. O harness é temporário, não versionado, e não constitui suíte disponível em checkout novo.

**Pendências e limites:** outros navegadores, leitor de tela, GPU/toque físicos e impressão física não foram verificados nesta atualização. Os testes não certificam acessibilidade nem conformidade tátil/normativa Braille; a comparação geométrica cobre o caso descrito.

## Revisão e padronização — 13/10/2026

Permanecem **jQuery 4.0.0 completo** e **Bootstrap 5.3.8 somente CSS**, locais, com fontes oficiais, licenças e ordem de carga acima. Os SHA-256 foram reconferidos nesta revisão e coincidem com os valores registrados. Não houve atualização de biblioteca. A revisão removeu atributos AOS sem biblioteca carregada e três ícones sem referência, adotou a classe Bootstrap `fw-medium` onde havia a variante sem definição e alinhou fechamento por Escape e contraste da página inicial. No JSCAD, `points` de `ring()` tornou-se local; a atribuição duplicada de `w` no STL foi removida, preservando geometria e exportação.

**Executado — arquivos/documentação:** leitura do código atual, conferência da ordem de carga e hashes, existência de destinos dos links Markdown locais e `git diff --check -- README.md docs` passaram. A licença original permanece em `docs/licenses/LICENSE`; o jQuery antigo e `TODO.txt` estão ausentes no checkout atual.

**Executado — computacional, reportado pelo responsável:** suíte completa `node tools/test-plate-geometry.js` passou. Seis comparações antes/depois mantiveram parâmetros, limites, volumes e polígonos; a remoção do `w` duplicado manteve STL idêntico.

**Executado — HTTP, reportado pelo responsável:** `node tools/check-plates-http.cjs` passou em Edge 155.0.4283.45 headless/SwiftShader, com `errors: []`, 33 Workers, 14 downloads e baseline de 3754 polígonos, limites `[-49.3125,-4,~0]` / `[49.3125,6,22.2]`, geração/exportação STL/3MF/X3D e reabertura independente por ThreeMFLoader/X_ITE. Relatório temporário: `%TEMP%/text2braille-review-validation-final/http-results.json`. A execução final com essas checagens incorporadas também terminou com código 0. Checagens da página inicial passaram por HTTP: assets, largura de 320 px, Escape do menu com retorno de foco ao botão e alternância de contraste. O harness versionado abre a ferramenta em `text2braille3d.html`; resultados temporários não acompanham um checkout novo.

**Limites:** estas verificações não certificam acessibilidade ampla, impressão, conformidade tátil/normativa, GPU/toque físicos ou outros navegadores. Fontes e licenças existentes foram preservadas; as [pendências](PENDENCIAS.md) continuam abertas.

## Exportação 3MF para Bambu Studio — 13/10/2026

Exportador local **1.1**, `OpenJsCad.exportPlate3MF` em `js/openjscad.js`: materiais básicos Core, montagem única e metadados Bambu de partes/slots. Continua ZIP STORE/CRC32 local, sem biblioteca de runtime adicional. A licença do projeto permanece em [licenses/LICENSE](licenses/LICENSE). Fontes primárias: [3MF Core Specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md) e [importador/exportador oficial do Bambu Studio](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp), consultado como referência para `Metadata/model_settings.config`, nomes de partes e `extruder`; nenhum código da biblioteca foi incorporado.

Permanecem **jQuery 4.0.0 completo** e **Bootstrap 5.3.8 somente CSS**, com fontes oficiais/licenças e ordem de carga registradas acima. AJAX continua buscando JSCAD como texto e Workers continuam em `js/`. Não há alteração da ordem CSS/scripts nesta correção.

**Executado — computacional:** `node tools/test-3mf-colors.cjs` passou com código 0; verifica paleta normalizada, slots compartilhados por cores iguais, IDs/nomes e montagem, incluindo uma/duas/três partes e erros. `node tools/test-plate-geometry.js` passou conforme resultado do responsável pela integração.

**Executado — fatiador CLI:** Bambu Studio **02.05.00.66**, importação/reexportação comparada pelo responsável. Antes, três volumes com nomes genéricos e apenas slot 1 no objeto; depois, nomes `base`/`dots`/`text` e slots 1/2/3 por parte preservados. A paleta RGB externa continuou não adotada na CLI: ambos os arquivos reexportados registraram `#00AE42`. Isso distingue cor visual Core, slot de filamento e perfil de material real; não comprova cores automáticas na GUI. Artefatos temporários: `%TEMP%/text2braille-bambu-validation`, não distribuídos no checkout.

Arquivos antigos precisam ser gerados/exportados novamente. Configuração ou criação manual dos filamentos e de suas cores no Bambu Studio pode ser necessária. GUI, AMS, fatiamento/impressão multicoloridos e demais pendências físicas não foram validados. Instruções e detalhes: [CONFIGURACOES_PLACAS.md](CONFIGURACOES_PLACAS.md).

**Executado — HTTP direcionado:** o harness temporário `export-http.cjs`, derivado de `tools/check-plates-http.cjs` com o bloco de interface/câmera removido para isolar geração/exportação, terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. Foram observados 27 Workers e `errors: []`. Com os defaults, permaneceram 3754 polígonos, limites `[-49.3125,-4,~0]` / `[49.3125,6,22.2]` e STL 362584 bytes; 3MF passou de 977956 bytes no histórico anterior para 978757 bytes com os metadados. Texto visual: STL 436284, 3MF 1162519 e X3D 1083627 bytes. Geração/exportação STL/3MF/X3D e leitores ThreeMFLoader/X_ITE passaram, incluindo dimensões e cores. Relatório: `%TEMP%/text2braille-bambu-validation/http/http-results.json`; harness e resultados são temporários, não uma suíte distribuída no checkout.

**Limite da validação HTTP:** a suíte completa versionada `node tools/check-plates-http.cjs` foi tentada duas vezes e interrompeu por timeout na checagem de redimensionamento do canvas, linha 105, antes de testar exportações. Portanto não passou nesta rodada. O teste direcionado comprova geração/exportação, sem revalidar o bloco de interface/câmera removido. Não houve ajuste da interface para contornar essa falha nesta tarefa.
