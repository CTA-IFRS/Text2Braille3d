---
name: text2braille-front
description: Implementar a interface HTML/CSS/jQuery do Text2Braille3d preservando a integração OpenJsCad.
---

Leia index.html, css/main.css, css/custom.css e js/main.js conforme o escopo.
Os controles são gerados pelo Processor: associe paramDefinitions[i].name a
paramControls[i]; não use seletores posicionais tr:eq em parseParameters.
Use jQuery 4.0.0 completo local (AJAX necessário) e Bootstrap 5.3.8 somente CSS
antes dos estilos locais. Busque o JSCAD explicitamente como texto; não inclua
Bootstrap JS, jQuery slim ou Migrate em produção.
Antes de mudar controles, combine o contrato com backend. Preserve #viewer,
onload(), js/ como caminho do motor e AJAX para jscad/braille.jscad.
Receba tokens e estados do designer. Verifique teclado, foco, rótulos e layout
estreito, além da geração/exportação em servidor HTTP. Relate testes não executados.
