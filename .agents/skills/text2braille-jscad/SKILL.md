---
name: text2braille-jscad
description: Alterar conversão Braille e geometria paramétrica no JSCAD legado do Text2Braille3d.
---

Leia jscad/braille.jscad, getParameterDefinitions(), main(params) e os pontos
de integração no OpenJsCad. Use a API legada existente; exemplos modernos de
@jscad/modeling não são substituições compatíveis automaticamente.
Compare mapeamento de caracteres, células, dimensões e exportação com o baseline.
Mudanças de ordem dos parâmetros afetam seletores posicionais de js/main.js:
combine com front antes de editar. Preserve carregamento Worker e paths relativos.
Para regras Braille e dimensões normativas, obtenha fontes aplicáveis antes de
afirmar conformidade; teste computacional não prova legibilidade tátil.
