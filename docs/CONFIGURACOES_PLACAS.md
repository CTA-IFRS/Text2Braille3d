# Configurações de placas

As evidências datadas pertencem às versões descritas em cada seção. A revisão atual está em [DEPENDENCIES.md](DEPENDENCIES.md#revisão-e-padronização--13102026), com verificações computacionais e HTTP separadas; pendências consolidadas em [PENDENCIAS.md](PENDENCIAS.md).

Execução autorizada pelo usuário em 09/10/2026. Este documento registra os contratos implementados de CFG-01 a CFG-11 e substitui o plano de execução após a revisão da entrega. A aplicação continua estática: conversão e geometria no navegador/Worker, sem servidor de aplicação. Créditos do projeto original e da tradução POALab permanecem no README e na página.

## Interface e geração

O canvas ocupa toda a viewport (`100dvh`, com fallback `100vh`), atrás da barra superior e das janelas sobrepostas. Ferramentas contém quatro controles rápidos fixos acima dos painéis recolhíveis: **Caixa de texto**, **Mostrar texto visual acima do Braille**, **Furos para parafusos** e **Chaveiro**. As configurações ficam organizadas em seis painéis, na ordem **Braille**, **Texto**, **Placa**, **Furos**, **Chaveiro** e **Cor e exportação**; o último reúne formato e cores. Dicas contextuais aparecem em caixas discretas com semântica de nota. Sobre preserva créditos, links de licença/projeto/POALab e tutorial. As janelas são não modais, recolhíveis por seus botões, com `aria-expanded`/`aria-controls`; abrir uma fecha a outra. Escape recolhe a janela aberta e devolve foco ao botão. Ferramentas começa aberta em desktop e fechada até 575,98 px; em telas estreitas a janela tem rolagem própria e altura máxima de 55dvh. Não há mais composição por colunas ou canvas fixo 4:3. Os cabeçalhos dos painéis são botões com `aria-expanded`/`aria-controls`; painéis recolhidos usam `hidden`. Abrir ou fechar painéis preserva parâmetros e não regenera o modelo. Campos numéricos com mínimo e máximo definidos usam sliders com leitura textual do valor; posição normalizada não usa unidade, dimensões usam mm. Campos internos ocultos permanecem fora da interface pública.

Alterar parâmetros remove o download anterior e marca o modelo como desatualizado. Durante eventos `input` de digitação ou arraste, os campos permanecem editáveis, a exportação fica indisponível e a geometria ainda não é regenerada. A atualização automática começa ao concluir a interação, pelo evento `change`: ao soltar o slider ou confirmar a alteração pelo teclado; em texto, textarea e campos numéricos editáveis, ao sair do campo após modificá-lo. Seletores e caixas de seleção também geram em `change`. Cores atualizam sua leitura, valor e visualização imediatamente em `input`/`change`, sem regenerar geometria nem iniciar Worker; o download anterior é removido. O formato agenda imediatamente. Não há mais geração por pausa de 350 ms. Durante o agendamento e a geração, os controles de edição e exportação ficam bloqueados e a barra de progresso indeterminada aparece; ela não indica porcentagem calculada. Ao concluir ou apresentar erro, as edições são liberadas. O botão **Gerar modelo 3D** foi retirado: **Exportar modelo para impressão**, com ícone de download, ocupa a área de ação e fica disponível somente com modelo válido e atual. Campos de letras, orelha e parafusos aparecem conforme sua opção; valores das letras são preservados quando desativadas. Erros abrem o painel correspondente antes de direcionar o foco. A interface usa JavaScript local, jQuery 4.0.0 completo e Bootstrap 5.3.8 somente CSS.

A rolagem de Ferramentas usa barra fina com trilho transparente e indicador arredondado. Em desktop, a largura consumida pela barra, medida somente quando há conteúdo excedente, é somada aos 360 px da janela para preservar a largura útil; barras sobrepostas podem consumir 0 px. Em telas estreitas, a largura continua limitada à viewport. O aviso **Atualizando modelo...** e a barra indeterminada ficam centralizados na parte inferior da visualização; até 575,98 px, sobem acima da janela de Ferramentas quando aberta.

O botão **Redefinir**, antes de **Exportar modelo para impressão**, restaura os valores iniciais de todos os parâmetros, as três cores iniciais e o formato inicial da página (STL), limpa erros e downloads anteriores e agenda uma única geração. Fica desabilitado durante agendamento/processamento; os controles condicionais e leituras dos sliders são sincronizados após a restauração. Não redefine a câmera.
## Orientação da visualização

O tamanho interno do canvas acompanha o retângulo CSS, multiplicado pelo DPR limitado a 2. A projeção usa a razão largura/altura CSS, atualizada ao redimensionar; isso evita esticar o modelo no espaço disponível. O slider `model-zoom` varia de 0 a 100, passo 0,1, com escala logarítmica da distância da câmera entre 10000 e 10: aumentar o valor aproxima. O percentual exibido é posição normalizada do controle, não magnificação física. Roda do mouse e slider sincronizam o valor; zoom altera somente a câmera, sem regeneração.

O visualizador inclui um cubo CSS 3D com seis faces e o seletor acessível `model-view`: Vista livre, Frente, Verso, Direita, Esquerda, Superior, Inferior e Isométrica. Clicar numa face ou escolher uma vista ajusta somente os ângulos da câmera, preservando zoom e deslocamento; não altera parâmetros, não regenera nem modifica a orientação de exportação. Vista livre indica uma orientação diferente dos presets e conserva a câmera atual quando selecionada. O cubo acompanha a rotação por sincronização local com `viewer.onDraw` da instância. Frente corresponde à face de relevo em −Y, com +Z para cima na orientação do modelo exportado. Faces voltadas para trás ficam fora da navegação Tab (`tabindex=-1`, `aria-hidden=true`); o seletor mantém todas as vistas disponíveis por teclado.

A mensagem visual `Pronto.` é removida quando há modelo válido, sem processamento e sem erro; o status anuncia `Modelo atualizado.` somente aos leitores de tela, com `visually-hidden`. Mensagens de edição, progresso e erro permanecem. O cubo usa JavaScript/CSS locais, sem biblioteca adicional e sem editar o motor vendorizado.
## Texto, Braille e letras: CFG-01 a CFG-04

`text` começa com `Olá Mundo`. Quebras CRLF/CR são normalizadas para LF; múltiplas linhas são aceitas. Texto vazio ou somente espaços é rejeitado. Caracteres sem correspondência na tabela Braille interrompem a geração com erro, sem descarte silencioso. A fonte visual não amplia a tabela Braille.

`upper` começa desativado: o texto é convertido para minúsculas antes da conversão Braille. Ativado, preserva o tratamento legado que insere o marcador `$` para `[A-ZÄÖÜ]` e depois converte para minúsculas; transforma também o texto visual em maiúsculas por `toUpperCase()` quando `visual_text` está ativado. Desativar `upper` restaura o texto visual digitado, sem alterar o conteúdo do campo `text`. Essa expressão não cobre todas as maiúsculas acentuadas portuguesas e a marcação de palavras inteiras permanece desativada no legado. O tratamento não constitui revisão linguística completa de Braille português. Contrações e conversão direta continuam parâmetros internos existentes, sem nova interface pública.

| Parâmetro | Inicial | Limite/semântica |
| --- | --- | --- |
| `visual_text` | `false` | Mesmo texto de entrada acima do Braille; desligado não reserva espaço para letras |
| `letter_size` | 6 mm | 2–30 mm; altura de referência da caixa alta, não altura do relevo |
| `letter_relief` | 0,8 mm | 0,1–5 mm; extrusão das letras |
| `letter_align` | `left` | `left`, `center`, `right`; cada linha alinhada à largura comum do conteúdo |
| `letter_gap` | 3 mm | 0–50 mm; separação entre limites geométricos das letras e pontos |

Os contornos DejaVu Sans 2.37 estão embutidos em `jscad/braille.jscad`; não há download de fonte em execução. Vazados são subtraídos dos contornos externos. O gerador inclui ASCII imprimível e Latin-1 disponíveis na fonte; caracteres sem contorno visual geram erro. Fontes e licenças estão em [DEPENDENCIES.md](DEPENDENCIES.md).

## Placa e fixação: CFG-05 a CFG-09

Todas as dimensões abaixo são em mm, exceto a posição normalizada da orelha. Os limites são validações do software, não tolerâncias de fabricação.

| Parâmetro | Inicial | Limite/semântica |
| --- | --- | --- |
| `plate_margin` | 5 | 0–100; margem adicional uniforme, não moldura nem intervalo letras/Braille. Ao ativar os furos, pode ser elevada se estiver abaixo do mínimo seguro para a combinação de parafuso e alojamento |
| `plate_thickness` | 2 | 0,2–50; controle único para placa e alojamento de cabeças |
| `reference_corner` | `true` | Canto de referência; corte com margem positiva, sem corte com margem zero. Pode ser temporariamente desativado se colidir com um furo do arranjo escolhido; a preferência é restaurada ao trocar para arranjo compatível ou desativar furos |
| `stands` | `true` | Apoios legados para impressão, exportados junto da base |
| `ear_enabled` | `false` | Ativa orelha unida volumetricamente à base |
| `ear_side` | `right` | `left`, `right`, `top`, `bottom` |
| `ear_position` | 0,5 | 0–1; desloca o centro no intervalo em que a largura cabe no lado |
| `ear_width` | 12 | 4–100; largura ao longo da borda, deve caber no lado |
| `ear_height` | 12 | 4–100; projeção externa |
| `ear_hole` | 5 | 1–50; diâmetro, menor que a menor dimensão externa menos 1 mm |
| `ear_thickness` | 2 | 0,2 até a espessura da placa |
| `ear_overlap` | 1 | 0,2–10; sobreposição da ligação à base |
| `ear_chamfer_enabled` | `false` | Ativa cortes dos dois cantos externos da orelha |
| `ear_chamfer` | 1 | 0–10, passo 0,1; mm, catetos do corte a 45° |
| `ear_joint_chamfer_enabled` | `false` | Ativa reforços nos dois cantos internos da junção |
| `ear_joint_chamfer` | 2 | 0–10, passo 0,1; mm, catetos do reforço a 45° |
| `screws_enabled` | `false` | Ativa furos passantes; não gera roscas |
| `screw_size` | `M3` | M2, M3, M4, M5 ou M6 (2, 3, 4, 5 ou 6 mm), diâmetro nominal |
| `screw_clearance` | 0,4 | 0–3; folga diametral adicionada ao nominal |
| `screw_count` | `2` | Escolha a quantidade primeiro: 2 ou 4. Com 2, libera os cinco arranjos listados em `screw_layout`; com 4, o arranjo é fixado em `corners` |
| `screw_layout` | `diagonal_left` | Com 2 furos: `top` (superior), `center` (um no meio de cada lateral), `bottom` (inferior), `diagonal_left` ou `diagonal_right`. Com 4 furos, somente `corners` (quatro cantos). `diagonal_left` mantém a posição das duas diagonais opostas usada anteriormente |
| `screw_edge` | 5 no JSCAD e na interface antes de habilitar os furos; 2,8 com os defaults após habilitá-los | Distância do centro do furo à borda da placa. A faixa segura é dinâmica: o máximo é a margem menos o raio efetivo e 0,5 mm; o mínimo mantém parede positiva ao redor do furo |
| `screw_head` | `none` | Sem alojamento, `counterbore` cilíndrico ou `countersink` escareado |
| `screw_head_diameter` | 6 | Diâmetro nominal + folga + 0,1 até 30; usado com alojamento |
| `screw_head_depth` | 1 | 0,1 até espessura da placa − 0,2; usado com alojamento |

Margem zero conserva recuos internos das células. O conteúdo determina largura e altura da placa; letras não reduzem os pontos automaticamente. Altura e diâmetro dos pontos ficam no painel Braille (iniciais 0,75 e 1,9 mm; faixas 0,6–0,8 e 1,2–2 mm). As dimensões e opções da placa, furos e chaveiro ficam em painéis separados; os controles rápidos de habilitação dos furos e do chaveiro permanecem no topo da ferramenta.

No painel Furos, selecione primeiro **Quantidade de furos**. Para 2 furos, **Posição dos furos** oferece superior, centro das laterais, inferior, diagonal esquerda e diagonal direita; o valor inicial diagonal esquerda conserva as coordenadas do padrão anterior. Para 4, a posição passa a quatro cantos. `screw_count` e `screw_layout` são, portanto, opções dependentes: a mudança de quantidade atualiza as posições permitidas e, quando necessário, seleciona o arranjo compatível.

`plate_margin` e `screw_edge` são controles independentes dentro da faixa segura dinâmica. `screw_edge` mede o centro do furo até a borda da placa. Seu limite superior é `plate_margin − raio efetivo − 0,5 mm`; o inferior garante pelo menos 0,1 mm de parede além do maior raio de corte. O raio efetivo é o maior entre o raio do furo passante (diâmetro nominal mais folga diametral, dividido por dois) e, quando há alojamento, o raio da cabeça configurada. Aumentar a margem amplia o espaço permitido para posicionar o furo. Alterar tamanho/folga do parafuso ou tipo/diâmetro do alojamento atualiza a faixa segura e pode limitar ou ajustar o valor exibido de `screw_edge`; essas mudanças não recalculam a margem, exceto quando ela precisa subir para o mínimo viável. Ao ativar furos com margem abaixo desse mínimo, a interface eleva `plate_margin` ao valor necessário. Com M3, folga diametral de 0,4 mm, sem alojamento e margem de 5 mm, ao habilitar os furos a interface limita `screw_edge` a 2,8 mm. O gerador continua rejeitando placas sem parede positiva ou furos em colisão com conteúdo, canto de referência ou chaveiro.

Se `reference_corner` estiver marcado e furos habilitados no arranjo `top`, `diagonal_left` ou `corners`, a opção é desmarcada e desabilitada temporariamente quando o furo superior esquerdo colidiria com o corte do canto. A preferência original é preservada e restaurada ao selecionar um arranjo compatível ou desativar os furos. A interface apresenta um aviso de status durante essa supressão temporária.

Colisões com texto/pontos, canto, orelha e apoios, paredes não positivas e placas pequenas interrompem a geração. A cabeça é definida pelo usuário: M2/M3/M4/M5/M6 não atribuem dimensões universais de cabeça. Os sliders de cabeça, profundidade e espessura da orelha exibem limites gerais; o gerador aplica também os limites dependentes do diâmetro escolhido e da espessura da placa, rejeitando combinações incompatíveis. O rebaixo preserva pelo menos 0,2 mm de fundo no contrato computacional. A orelha exige parede superior a 0,5 mm ao redor do furo e ligação com sobreposição.

Os chanfros alteram o contorno plano da orelha nos quatro lados possíveis e atravessam sua espessura inteira. O externo subtrai dois triângulos a 45°; o interno acrescenta dois reforços triangulares à ligação com a placa. Não são biséis nas faces superior/inferior nem arredondamentos. Valor zero equivale a não aplicar o recurso; ambas as opções começam desativadas, preservando os defaults anteriores. O corte externo deve ser menor que metade da largura e da projeção, e não invadir a reserva de 0,5 mm ao redor do furo. O reforço deve ser menor que a projeção e caber no lado da placa ao redor da posição escolhida. Colisões e demais restrições da orelha continuam sendo verificadas; a resistência do reforço depende de validação física.

Antes da exportação, o modelo é centralizado em X e girado 90° em X como na orientação legada. Apoios são adicionados nessa orientação, com 0,3 mm de altura e discos de 10 mm, e pertencem à base. Devem ser removidos após impressão conforme material e processo; sua remoção e resistência ainda exigem protótipo físico.

## Exportação e cores: CFG-10 e CFG-11

STL exporta a união geométrica sem atribuição de filamentos. 3MF usa uma montagem com partes `base`, `dots` e, quando habilitado, `text`, em milímetros e coordenadas compartilhadas. Base inclui fixações e apoios; a orelha do chaveiro recebe a mesma cor da base também na visualização; pontos são recortados no plano da base para evitar sobreposição volumétrica, com superfícies de contato. Letras desativadas não produzem parte vazia.

O título Cores e seus controles aparecem somente em 3MF: base `#e6d9b8`, texto `#222222`, pontos `#204fba` inicialmente na interface. Cada escolha tem nome textual e valor hexadecimal. Cores iguais são permitidas e não obrigam filamentos distintos. A paleta `exportColors` também colore as partes no visualizador: `updatePreviewColors()` em `js/main.js` aplica cada cor a uma cópia CSG da parte e reconstrói suas malhas WebGL, sem modificar os sólidos usados na exportação. A paleta é reaplicada após cada geração, inclusive após Redefinir; movimentos de câmera preservam as cores. O arquivo armazena cores visuais de materiais básicos Core e metadados de partes/slots para Bambu Studio. Cores distintas recebem slots distintos; cores iguais, normalizadas para hexadecimal maiúsculo, compartilham um slot. RGB importado e associação aos filamentos reais dependem do fatiador e podem exigir configuração manual; veja a revisão Bambu Studio ao final.

O exportador 3MF local versão 1.1 usa ZIP STORE sem biblioteca ZIP adicional. X3D usa escritor XML local no motor: corrige `bb` indefinido e evita o DOCTYPE inválido do escritor CSG legado, preservando a biblioteca vendorizada. Declara X3D 3.3 e unidade milímetro (`conversionFactor="0.001"`); usa as cores dos sólidos originais, sem incorporar a recoloração das cópias do visualizador. Esta correção do preview não altera os exportadores STL/3MF/X3D. Downloads usam Blob URL, com erros capturados e sem reutilização do download anterior. A disponibilidade na lista não substitui evidência de reabertura: resultados e limitações estão abaixo e em [DEPENDENCIES.md](DEPENDENCIES.md).

## Instruções de execução e verificação

Pré-requisitos de uso: Python e navegador moderno com WebGL e Web Workers. Na raiz:

```powershell
python -m http.server 8000
```

Abra <http://localhost:8000/text2braille3d.html>; a raiz apresenta `index.html`. Resultado esperado: AJAX carrega `jscad/braille.jscad` como texto e Worker resolve bibliotecas em `js/`; o modelo pode ser gerado e baixado. `file://` não valida esses contratos.

Para verificações computacionais, instale Node.js e execute na raiz:

```powershell
node tools/test-plate-geometry.js
```

Para o harness HTTP, Node.js e Playwright são necessários. Em um diretório de ferramentas fora da aplicação, execute `npm install playwright@1.51.1 three@0.180.0 x_ite@16.4.3`. Three.js e X_ITE permitem as verificações opcionais de reabertura independente: sem esses pacotes, o harness pode passar com leitores nulos no relatório, portanto isso não comprova reabertura. Defina o caminho absoluto de `node_modules`; o harness inicia seu próprio servidor local e abre `text2braille3d.html`, usando Edge headless/SwiftShader por padrão:

```powershell
$env:T2B_TEST_TOOLS = 'C:/caminho/ferramentas/node_modules'
node tools/check-plates-http.cjs
```

`T2B_BROWSER` permite indicar um executável Chromium compatível, necessário se Edge não estiver no caminho padrão `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`; `T2B_TEST_OUTPUT` indica diretório de resultados, cujo padrão fica no temporário do sistema. Resultado esperado: saída de verificações, relatório JSON e arquivos exportados. Para repetir apenas os controles/layout, use `node tools/check-plates-http.cjs --ui-only`. O harness bloqueia Google Tag Manager e não audita analytics. Esses comandos são instruções; o registro abaixo identifica somente execuções efetivamente realizadas.

## Evidências e pendências

G0: autorização nesta solicitação, inventário preservando alterações preexistentes e baseline HTTP registrados pelo responsável. G1: adotados margem uniforme, fonte DejaVu Sans 2.37, altura de caixa alta em mm, catálogo M3/M4 com cabeça parametrizada, partes base/texto/pontos, fixações/apoios associados à base e breakpoint 992 px.

**Executado — HTTP:** `node tools/check-plates-http.cjs`, com Playwright 1.51.1 externo, Microsoft Edge 155.0.4283.45 headless e WebGL SwiftShader, terminou com código 0. O harness iniciou servidor em porta dinâmica de `127.0.0.1`, observou sete Workers e nenhum erro não tratado. Analytics foi bloqueado, sem auditoria.

| Caso | Polígonos | Limites XYZ mínimo / máximo | STL / 3MF / X3D (bytes) |
| --- | --- | --- | --- |
| Baseline antes da alteração, `Olá Mundo` | 3754 | `[-49.3125,-4,0]` / `[49.3125,6,22.2]` | 362584 / não disponível / erro `bb is not defined` |
| Candidata, mesmos parâmetros iniciais | 3754 | `[-49.3125,-4,0]` / `[49.3125,6,22.2]` | 362584 / 977956 / 939053 |
| Texto visual `O B 8\nOlá`, centralizado, sem apoios | 4054 | `[-27.875,-0.8,0]` / `[27.875,2,51.374263]` | 436284 / 1161592 / 1083627 |

O caso de fixação gerou 3MF de 1317751 bytes. Foram baixados arquivos com cores iguais e sem texto visual; campos inválidos de letras desligadas não impediram geração e seu valor foi preservado. Texto vazio/caractere não suportado e cor inválida no exportador apresentaram erros; o download desatualizado permaneceu bloqueado.

Larguras 320, 576 e 1100 px não apresentaram rolagem horizontal. Todos os controles de parâmetros tinham um rótulo associado. Enter/Espaço abriram/recolheram os painéis, Tab/Shift+Tab preservaram navegação e o botão focado mostrou contorno sólido. A execução complementar `node tools/check-plates-http.cjs --ui-only` passou com texto ampliado a 200% (`html`/`body` em 32 px), largura/rolagem 320/320 px e nenhum erro. O teste complementar também confirmou que um erro em screw_edge abre Placa e fixação e foca o campo correto. Capturas desktop.png e narrow.png foram inspecionadas visualmente. Isso verifica aumento de texto por CSS, não zoom real do navegador ou dispositivo físico.

**Executado — leitores independentes:** Three.js 0.180.0 (`ThreeMFLoader`) reabriu três partes do 3MF, com nomes e cores esperados e limites equivalentes ao modelo dentro de `1e-4`. X_ITE 16.4.3 reabriu X3D com três Shapes, cores e geometria; o XML também passou pelo DOMParser. A checagem temporária `node "$env:TEMP/text2braille-compat-tools/reader-dimensions.cjs"` confirmou dimensões independentes no X_ITE, em metros: mínimos `[-0.02787500061,-0.00079999998,~0]`, máximos `[0.02787500061,0.002000000095,0.05137426406]`, comparados aos limites em mm multiplicados por 0,001, tolerância `1e-6`. Ambos foram ferramentas externas de teste, sem dependência de produção; o script complementar temporário não integra a suíte do checkout.

Resultados e downloads desta sessão ficaram em `C:/Users/Jason Piloti/AppData/Local/Temp/text2braille-plates-validation/`, incluindo `http-results.json`. São artefatos temporários, não arquivos disponíveis em um checkout novo. O código dos harnesses permanece em `tools/` para reprodução.

**Executado — geometria:** `node tools/test-plate-geometry.js` passou, cobrindo baseline, três alinhamentos, quatro lados da orelha, M3/M4 com três tipos de alojamento, margem zero, entradas inválidas e colisões rejeitadas. Nos casos da suíte, interseção volumétrica entre partes ficou abaixo de `1e-5`, diferença de volume entre união das partes e modelo abaixo de `1e-4` e intervalo letras/Braille medido em 3 mm. São verificações computacionais CSG, não impressão ou navegador.

A comparação legada `node tools/test-plate-geometry.js --baseline-only`, com `T2B_BASELINE_JSCAD` apontando ao snapshot anterior temporário, passou em seis casos: `Olá Mundo`, `AÇÃO` e `Ação\nB8`, com `upper` desligado/ligado, resolução 8 e apoios desligados. Volumes, limites, polígonos e tabela Braille permaneceram equivalentes. O snapshot anterior não é distribuído no checkout; para reproduzir essa comparação é necessário fornecer uma cópia anterior correspondente.

**Executado — fatiador:** PrusaSlicer 2.9.0 reabriu STL/3MF de baseline e texto visual com `--info` e informou malhas manifold; o round-trip do baseline terminou sem reparos. No teste CLI, `--dont-arrange --no-ensure-on-bed` preservou alinhamento/orientação e transformações. Partes entram como objetos separados e podem precisar de agrupamento manual; cores não foram preservadas na reexportação realizada. Esse resultado não valida atribuição automática de filamentos nem impressão multicolorida.

G7 permanece pendente: impressão real, encaixe M3/M4, fundo remanescente, resistência da orelha, remoção dos apoios, impressão com cores e legibilidade. Não foi estabelecida conformidade tátil ou normativa Braille. Outros navegadores, GPU e toque físicos requerem verificação própria. Merge Alfredo, arredondamento geral e roscas impressas continuam fora do escopo.

## Atualização das ferramentas — 13/10/2026

Os contratos de interface e fixação acima refletem esta atualização. O catálogo histórico M3/M4 e as evidências de 09/10 permanecem como registro das execuções anteriores.

**Executado — computacional nesta atualização:** o responsável confirmou código de saída 0 de `node tools/test-plate-geometry.js`, incluindo suíte expandida e comparação de seis casos com snapshot anterior (defaults, volumes, limites, polígonos e tabela Braille). A verificação complementar cobriu quatro lados da orelha, chanfro externo de 1 mm, reforço de 2 mm e combinação: diferenças de volume −2, +8 e +6 mm³, respectivamente, com espessura de 2 mm. Quinze combinações M2–M6 × três alojamentos passaram. A verificação confirmou rejeição de chanfros incompatíveis e preservação da união das partes. Estas são evidências computacionais reportadas pelo responsável, sem atestar impressão ou resistência.

**Executado — HTTP/interface nesta atualização:** `node tools/check-plates-http.cjs --ui-only` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. Larguras 320/576/1100 px não apresentaram rolagem horizontal; texto ampliado por CSS a 200% em 320 px também passou. Todos os controles tinham rótulos; Enter/Espaço abriram e fecharam painéis, Tab/Shift+Tab preservaram navegação e o foco apresentou contorno sólido. Erro `screw_edge` abriu o painel e focou o campo. Não houve erro de página não tratado (`errors: []`). A captura `narrow.png` foi inspecionada pelo responsável. Esta evidência não representa zoom real ou dispositivo físico.

**Executado — HTTP completo antes do ajuste para fim da interação:** `node tools/check-plates-http.cjs` terminou com código 0, Playwright externo e Edge 155.0.4283.45 headless/SwiftShader, servido em porta dinâmica de `127.0.0.1`. O relatório final registrou 29 Workers e `errors: []`. Confirmou sliders para todos os campos numéricos com limites definidos, sete grupos de parâmetros e ausência do botão manual de geração. Durante alteração real do texto, `aria-busy` ficou `true`, campo e exportação ficaram desabilitados e progresso apareceu; a atualização automática concluiu. Ao restaurar o texto inicial, parâmetros e 3754 polígonos voltaram ao baseline, preservando inclusive `ear_position = 0.5` e `letter_relief = 0.8`.

| Caso HTTP de 13/10 | Polígonos | STL / 3MF / X3D (bytes) |
| --- | --- | --- |
| Inicial, comparado ao histórico com mesmos defaults | 3754 | 362584 / 977956 / 939053 |
| Texto visual `O B 8\nOlá`, centralizado, sem apoios | 4054 | 436284 / 1161592 / 1083627 |
| Orelha com chanfro externo e reforço da junção | 3769 | 363284 / 982642 / não exportado neste caso |
| M2, M5 e M6, cada caso com margem 20 e distância 7 mm | não registrado nesta tabela | 368384 cada / não exportado / não exportado |

O baseline manteve limites XYZ `[-49.3125,-4,~0]` / `[49.3125,6,22.2]`, polígonos e tamanho STL equivalentes ao registro anterior; não foi executada comparação de hash STL nesta atualização. O caso com chanfros apresentou limites `[-49.3125,-0.75,~0]` / `[61.3125,2,42.2]`. Foram novamente verificados texto visual, cores iguais, fixações, texto desativado, entradas inválidas e leitores independentes 3MF/X3D. O relatório final e downloads estão no diretório temporário já indicado; não são distribuídos no checkout. A comparação cobre os casos citados e não todas as combinações possíveis.

**Pendências físicas desta atualização:** encaixe M2/M5/M6, resistência dos chanfros/reforços e demais protótipos continuam pendentes. Nenhuma nova conformidade tátil/normativa foi estabelecida.

## Ajuste para geração ao concluir a interação — 13/10/2026

O contrato de interface acima foi atualizado conforme `js/main.js`: `input` somente invalida o modelo anterior, enquanto `change` agenda a geração. O registro HTTP completo anterior pertence à implementação inicial de atualização automática; não comprova este ajuste posterior.

**Executado — HTTP/interface após o ajuste:** `node tools/check-plates-http.cjs --ui-only` terminou com código 0. Texto permaneceu editável durante 600 ms sem gerar Worker; sair do campo iniciou bloqueio e progresso. Arraste real do slider com mouse durante 600 ms não gerou Worker intermediário; soltar iniciou a geração. Restaurar os parâmetros manteve o baseline equivalente. Larguras 320/576/1100 px, ampliação de texto por CSS a 200%, rótulos, teclado/foco e erro direcionado ao campo passaram, com `errors: []`. Esta é validação HTTP/interface, sem impressão física.

**Executado — HTTP completo após o ajuste:** `node tools/check-plates-http.cjs` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. O relatório final atualizado registrou 31 Workers e `errors: []`. Os testes de digitação e arraste prolongados sem geração intermediária, geração ao concluir a interação, bloqueio/progresso e restauração dos defaults passaram também nesta execução completa. Baseline: 3754 polígonos, STL 362584, 3MF 977956 e X3D 939053 bytes, iguais ao registro anterior. Texto visual manteve STL/3MF/X3D de 436284/1161592/1083627 bytes; chanfros, STL/3MF de 363284/982642 bytes; M2/M5/M6, STL de 368384 bytes cada. Leitores independentes 3MF/X3D passaram novamente. O relatório atualizado permanece no diretório temporário indicado acima. Geometria e formatos não foram alterados por este ajuste; pendências físicas e limitações de navegador continuam as já descritas.

## Orientação da câmera — atualização posterior de 13/10/2026

O contrato do cubo e seletor acima foi conferido no código atual. Evidências HTTP anteriores pertencem às versões anteriores a este recurso. **Executado — HTTP/interface:** `node tools/check-plates-http.cjs --ui-only` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. Sete presets, seis faces, teclado, ausência de regeneração, preservação de zoom/deslocamento e sincronização passaram. Arrastar o canvas mudou a matriz do cubo e indicou Vista livre; Frente apresentou matriz CSS identidade; clique e Enter numa face funcionaram. Larguras 320/576/1100 px e texto ampliado por CSS a 200% passaram sem rolagem horizontal; rótulos, foco e console sem erros passaram. A captura `narrow.png` foi inspecionada pelo responsável com cubo visível e sem mensagem visual de sucesso.

**Executado — HTTP completo após o cubo de orientação:** `node tools/check-plates-http.cjs` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. O relatório atualizado confirmou os testes do cubo/seletor, 31 Workers e `errors: []`. Baseline preservado: 3754 polígonos e STL 362584 bytes. Geração e exportações STL/3MF/X3D, incluindo casos de texto visual, chanfros e novos parafusos, e leitores independentes 3MF/X3D passaram. A evidência limita-se a esse navegador headless/SwiftShader; GPU física, outros navegadores, toque físico e impressão não foram testados nesta atualização. Relatório e capturas permanecem temporários.

## Viewport, janelas e zoom — atualização posterior de 13/10/2026

Os contratos atuais acima refletem o layout da ferramenta, hoje em `text2braille3d.html`, `js/main.js` e `css/custom.css`. Registros anteriores de colunas/breakpoint e canvas 4:3 permanecem históricos. **Executado — HTTP/interface:** `node tools/check-plates-http.cjs --ui-only` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. Canvas ocupou exatamente a viewport em (0,0) nos tamanhos 320×900, 576×900, 1100×900 e 800×450; backing store com DPR e proporção da projeção largura/altura foram verificados. Zoom por teclado, sincronização da roda, janelas por teclado e quatro links de créditos/tutorial passaram; movimentos de câmera não geraram modelo. Texto ampliado por CSS a 200% em 320 px não apresentou rolagem horizontal. Testes de fim da interação, arraste real, cubo, rótulos/foco e console passaram (`errors: []`). Capturas desktop e estreita foram inspecionadas pelo responsável.

**Executado — HTTP completo após o layout:** `node tools/check-plates-http.cjs` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader. O relatório atualizado confirmou viewport, zoom, janelas, links e ausência de geração por câmera, além dos testes do cubo; registrou 31 Workers e `errors: []`. Baseline preservado: 3754 polígonos e STL 362584 bytes. Geração/exportações STL/3MF/X3D, casos de texto visual, chanfros e M2/M5/M6 e leitores independentes 3MF/X3D passaram. Os tamanhos dos arquivos continuam iguais aos registrados nas tabelas anteriores. Relatório e capturas permanecem temporários; outros navegadores, GPU/toque físicos e impressão não foram validados nesta atualização. O motor e bibliotecas vendorizadas permanecem inalterados.

## Ajustes de ferramentas, maiúsculas e redefinição — 13/10/2026

Os contratos atuais acima foram conferidos nos arquivos de interface e JSCAD. `screw_edge` já existia; o rótulo e a ajuda agora explicitam a distância entre o centro dos furos e as bordas da placa. Não houve atualização de dependências.

**Executado — geometria nesta rodada:** o responsável confirmou saída 0 da suíte completa `node tools/test-plate-geometry.js` e da comparação de seis casos com o snapshot anterior. Os testes incluem texto visual em maiúsculas com preservação do tratamento Braille legado e orelha com a cor da base. São verificações computacionais, sem impressão física.

**Executado — HTTP/interface nesta rodada:** `node tools/check-plates-http.cjs --ui-only` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader, com `errors: []`. Rótulos, teclado/foco, larguras 320/576/1100/800 px e texto ampliado por CSS a 200% passaram. Redefinir restaurou parâmetros, cores e formato inicial com uma única geração; bloqueio durante processamento e visibilidade de Cores somente em 3MF passaram. No layout estreito, o limite inferior do progresso ficou em 355,8125 px e o topo de Ferramentas em 367,8125 px, preservando 12 px de separação; a janela teve largura 366 px numa viewport de 390 px. Conteúdo com e sem excesso de altura passou com barra de rolagem sobreposta, que consumiu 0 px; barra clássica com largura positiva não foi validada em execução. A captura estreita desta rodada foi inspecionada pelo responsável.

**Executado — HTTP completo nesta rodada:** `node tools/check-plates-http.cjs` terminou com código 0 em Edge 155.0.4283.45 headless/SwiftShader, com `errors: []`. Geração e exportações STL/3MF/X3D passaram, incluindo baseline, texto visual, fixação, chanfros e casos M2/M5/M6. Os leitores independentes Three.js para 3MF e X_ITE para X3D verificaram dimensões e cores. O relatório desta execução está em `%TEMP%/text2braille-plates-validation/http-results.json`; é artefato temporário, não distribuído no checkout.

**Pendências desta rodada:** outros navegadores, barra de rolagem clássica, GPU/toque físicos e impressão não foram validados; ampliação por CSS não equivale a zoom real do navegador. Permanecem as pendências físicas e normativas descritas anteriormente.

## Compatibilidade 3MF com Bambu Studio — 13/10/2026

**Diagnóstico:** o exportador anterior gravava cores em `basematerials` do 3MF Core, suficientes para o leitor Three.js, mas sem indicar ao Bambu Studio quais filamentos usar por parte. Cor visual e slot de filamento são informações diferentes. A revisão local 1.1 de `OpenJsCad.exportPlate3MF` mantém geometria e cores Core e acrescenta `Metadata/model_settings.config`, relacionando IDs das malhas, nomes `base`/`dots`/`text` e `extruder` por parte. `Metadata/project_settings.config` registra a paleta escolhida, sem impor impressora, perfis de material, parâmetros de fatiamento ou mapeamento AMS.

**Instruções de uso:** gere e exporte novamente os arquivos antigos. Abra o novo 3MF no Bambu Studio, confira as partes e seus slots, crie ou selecione os filamentos necessários e ajuste suas cores conforme a paleta da placa. Confira a atribuição de cada parte e a prévia do fatiamento antes de imprimir. A configuração dos filamentos reais e do AMS continua no fatiador.

**Instruções de verificação computacional:** com Node.js, na raiz execute `node tools/test-3mf-colors.cjs`. Resultado esperado: `3MF PASS`, cobrindo montagem única, IDs/nomes, slots por parte, paleta normalizada sem cores duplicadas, uma/duas/três partes, escape XML e rejeição de cor inválida. Isso verifica o pacote, não a interface do fatiador.

**Executado — pacote:** `node tools/test-3mf-colors.cjs` passou com código 0.

**Executado — Bambu Studio CLI:** o responsável comparou importação/reexportação no Bambu Studio instalado **02.05.00.66**. Antes, três volumes tiveram nomes genéricos e somente `extruder=1` no objeto; depois, nomes `base`, `dots`, `text` e slots `1`, `2`, `3` ficaram preservados por parte. Os artefatos `before-roundtrip.3mf` e `after-roundtrip.3mf`, em `%TEMP%/text2braille-bambu-validation`, foram inspecionados também pela documentação. Essa comparação diagnostica metadados de partes; os casos exportados não constituem comparação geométrica equivalente.

**Limitação observada:** a reexportação CLI manteve somente a paleta padrão `#00AE42`, mesmo após a correção: o RGB de `project_settings.config` externo não foi adotado nessa execução. Portanto slots separados estão comprovados na CLI, mas cores RGB automáticas na interface gráfica não. GUI, seleção de filamentos/AMS, fatiamento multicolorido e impressão permanecem pendentes. Referência primária e comparação HTTP desta revisão: [DEPENDENCIES.md](DEPENDENCIES.md).

**Executado — HTTP direcionado nesta correção:** o responsável confirmou código 0 do harness temporário `export-http.cjs`, derivado da suíte versionada sem o bloco de interface/câmera. Edge 155.0.4283.45 headless/SwiftShader registrou 27 Workers e `errors: []`; defaults mantiveram 3754 polígonos, limites XYZ e STL 362584 bytes. Exportações STL/3MF/X3D e leitores independentes ThreeMFLoader/X_ITE passaram com dimensões e cores. Relatório temporário: `%TEMP%/text2braille-bambu-validation/http/http-results.json`. A suíte completa versionada falhou duas vezes por timeout na checagem de redimensionamento do canvas antes das exportações; o teste direcionado não revalida o bloco removido. Detalhes e comparação de tamanhos estão em [DEPENDENCIES.md](DEPENDENCIES.md).
## Cores no visualizador — correção de 13/10/2026

**Contrato conferido no código atual:** a alteração de cores em `input`/`change` atualiza imediatamente as malhas WebGL por parte, remove o download anterior e não inicia Worker. `updatePreviewColors()` usa cópias CSG; os sólidos originais de exportação permanecem intactos. A paleta escolhida é reaplicada ao concluir uma geração, e Redefinir restaura a paleta inicial. Os exportadores STL/3MF/X3D não foram alterados nesta correção.

**Executado — HTTP direcionado:** o responsável confirmou saída 0 do harness temporário `%TEMP%/text2braille-preview-colors.cjs`, em Edge headless/SwiftShader. Alterar os inputs para base vermelha, pontos verdes e texto azul atualizou os RGB das malhas sem novo Worker; polígonos, cores e limites de `currentObject`, assim como a câmera, permaneceram preservados. Regenerar com margem de 6 mm manteve a paleta escolhida. Redefinir restaurou defaults e as duas partes esperadas, sem texto visual. O nome `placa-braille-olá-mundo.3mf` permaneceu preservado e o console registrou `errors: []`. O responsável inspecionou visualmente `%TEMP%/text2braille-preview-colors.png`, confirmando as três cores no visualizador. Harness e captura são artefatos temporários e não acompanham um checkout novo.

**Limitações desta verificação:** o teste direcionado verifica a atualização do preview e a preservação dos sólidos, sem constituir nova reabertura de todos os formatos em leitores independentes ou fatiadores. Outros navegadores, GPU física, AMS e impressão permanecem sem validação nesta rodada.
