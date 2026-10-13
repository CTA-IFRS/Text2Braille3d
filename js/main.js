var gProcessor = null;
var parameterControls = {};
var parameterRows = {};
var generationTimer = null;
var generationProgress;
var modelDirty = false;
var panelBodies = [];
var colorFields = {};
var colorsHeading;
var resetButton;
var initialExportFormat;
var defaultExportColors = {base: '#e6d9b8', text: '#222222', dots: '#204fba'};
var contrastEnabled = false;

// Present errors in accessible toasts instead of the legacy alert handler.
window.addEventListener('error', function (event) {
    if (event.message) reportWorkspaceError(event.message.replace(/^Uncaught /i, ''));
});

window.addEventListener('unhandledrejection', function (event) {
    reportWorkspaceError(event.reason && event.reason.message || String(event.reason || 'Ocorreu um erro inesperado.'));
});

try { contrastEnabled = localStorage.getItem('text2braille-tool-contrast') === 'true'; } catch (error) { /* Storage may be unavailable. */ }

function applyWorkspaceTheme() {
    document.documentElement.classList.toggle('tool-high-contrast', contrastEnabled);
    document.getElementById('contrast-toggle').setAttribute('aria-pressed', String(contrastEnabled));
    if (gProcessor && gProcessor.viewer) {
        gProcessor.viewer.gl.clearColor(contrastEnabled ? 0 : 0.973, contrastEnabled ? 0 : 0.977, contrastEnabled ? 0 : 0.981, 1);
        gProcessor.viewer.onDraw();
    }
}

document.getElementById('contrast-toggle').addEventListener('click', function () {
    contrastEnabled = !contrastEnabled;
    applyWorkspaceTheme();
    try { localStorage.setItem('text2braille-tool-contrast', String(contrastEnabled)); } catch (error) { /* The toggle still works for this visit. */ }
});

applyWorkspaceTheme();

function reportWorkspaceError(message) {
    if (gProcessor) gProcessor.setError(message);
    else showErrorToast(message);
}

function showErrorToast(message) {
    var container = document.getElementById('error-toasts');
    var existing = document.getElementById('workspace-error-toast');
    if (!message) { container.replaceChildren(); return; }
    if (existing && existing.dataset.message === message) return;
    var toast = document.createElement('section');
    toast.id = 'workspace-error-toast';
    toast.className = 'error-toast';
    toast.dataset.message = message;
    var text = document.createElement('p');
    text.setAttribute('role', 'alert');
    text.setAttribute('aria-atomic', 'true');
    text.textContent = message;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close';
    close.setAttribute('aria-label', 'Fechar aviso de erro');
    close.addEventListener('click', function () {
        var invalid = document.querySelector('[aria-invalid="true"]:not(:disabled)');
        if (invalid && !invalid.closest('[hidden]')) invalid.focus();
        else document.getElementById('tools-toggle').focus();
        toast.remove();
    });
    toast.append(text, close);
    container.replaceChildren(toast);
}

document.querySelector('#tutorial-toast button').addEventListener('click', function () {
    document.getElementById('tutorial-toast').hidden = true;
    document.querySelector('.workspace-home').focus();
});

function onload() {
    gProcessor = new OpenJsCad.Processor(document.getElementById('viewer'));
    gProcessor.setOpenJsCadPath('js/');
    adaptControls();
    jQuery.get('jscad/braille.jscad', function (data) {
        gProcessor.setJsCad(data, 'braille.jscad');
        adaptParameterControls();
    }, 'text').fail(function () {
        gProcessor.setError('Não foi possível carregar o modelo Braille. Recarregue a página.');
    });
}

function adaptControls() {
    applyWorkspaceTheme();
    var originalSetRenderedObjects = gProcessor.setRenderedObjects;
    gProcessor.setRenderedObjects = function (objects) {
        originalSetRenderedObjects.call(this, objects);
        updatePreviewColors();
    };
    
    var originalSetError = gProcessor.setError;
    gProcessor.setError = function (message) {
        message = message == null ? '' : String(message);
        originalSetError.call(this, message);
        showErrorToast(message);
        if (!message) Object.keys(parameterControls).forEach(function (name) {
            var control = parameterControls[name];
            control.removeAttribute('aria-invalid');
            var ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) { return id && id !== 'configuration-errors'; });
            if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
            else control.removeAttribute('aria-describedby');
        });
    };
    
    var $viewer = $('#viewer').addClass('config-layout');
    var $settings = $('<section id="tools-window" class="settings-column floating-window" aria-labelledby="tools-heading"><h2 id="tools-heading">Ferramentas</h2></section>').appendTo($viewer);
    var $preview = $('<section class="preview-column" aria-label="Visualização do modelo">').appendTo($viewer);
    $preview.append(gProcessor.viewerdiv);
    gProcessor.zoomControl.onscroll = null;
    $(gProcessor.zoomControl).remove();
    
    adaptViewCube();
    adaptViewport();
    adaptZoomSlider();
    
    $settings.append(gProcessor.parametersdiv);
    $(gProcessor.parametersdiv).find('button').remove();
    resetButton = $('<button id="reset-model" type="button" class="btn btn-outline-secondary">Redefinir</button>').on('click', resetConfiguration);
    $('<div class="export-actions">').append(resetButton, gProcessor.generateOutputFileButton, gProcessor.downloadOutputFileLink).appendTo($settings);
    generationProgress = $('<div class="generation-progress" hidden><label for="model-progress">Atualizando modelo...</label><progress id="model-progress" aria-label="Atualizando modelo"></progress></div>').appendTo($preview);
    $settings.append(gProcessor.statusdiv, gProcessor.errordiv);
    adaptFloatingWindows();
    
    $(gProcessor.parametersdiv).children('.header').remove();
    $(gProcessor.generateOutputFileButton).addClass('btn btn-outline-secondary');
    $(gProcessor.abortbutton).addClass('btn btn-outline-secondary');
    $(gProcessor.downloadOutputFileLink).addClass('btn btn-outline-secondary');
    var originalGenerateOutputBlob = gProcessor.generateOutputFileBlobUrl;
    gProcessor.generateOutputFileBlobUrl = function () {
        originalGenerateOutputBlob.call(this);
        var text = String(this.getParamValues().text || '').normalize('NFC').toLowerCase()
            .replace(/[\s<>:"/\\|?*\u0000-\u001f]+/g, '-').replace(/-+/g, '-')
            .replace(/^[.-]+|[.-]+$/g, '');
        this.downloadOutputFileLink.setAttribute('download', 'placa-braille-' + text + '.' + this.selectedFormatInfo().extension);
    };
    $(gProcessor.formatDropdown).addClass('form-select').attr({id: 'export-format', 'aria-label': 'Formato de exportação'});
    $(gProcessor.renderedElementDropdown).addClass('form-select').attr('aria-label', 'Objeto para exportação');
    $(gProcessor.statusspan).attr({role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true'});
    $(gProcessor.errordiv).attr('id', 'configuration-errors').addClass('visually-hidden');
    
    var originalEnable = gProcessor.enableItems;
    gProcessor.enableItems = function () {
        originalEnable.call(this);
        this.formatDropdown.style.display = 'block';
        var busy = this.processing || generationTimer !== null;
        if (!busy && !this.hasError && this.hasValidCurrentObject && $(this.statusspan).text().trim() === 'Pronto.') {
            $(this.statusspan).empty().append($('<span class="visually-hidden">').text('Modelo atualizado.'));
        }
        this.generateOutputFileButton.disabled = modelDirty || busy || !this.hasValidCurrentObject || this.hasError;
        this.generateOutputFileButton.style.display = this.hasOutputFile && !modelDirty && !busy ? 'none' : 'block';
        if (modelDirty || busy || this.hasError) this.downloadOutputFileLink.style.display = 'none';
        $(this.generateOutputFileButton).addClass('export-model btn-primary').removeClass('btn-outline-secondary').html('<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11 3h2v10l3-3 1.4 1.4L12 17l-5.4-5.6L8 10l3 3V3zM5 18h14v3H5z"/></svg> Exportar modelo para impressão');
        document.getElementById('viewer').setAttribute('aria-busy', String(busy));
        generationProgress.prop('hidden', !busy);
        resetButton.prop('disabled', busy || !Object.keys(parameterControls).length);
        updateConditionalControls();
    };
    
    var originalGetValues = gProcessor.getParamValues;
    gProcessor.getParamValues = function () {
        var saved = [];
        this.paramDefinitions.forEach(function (definition, index) {
            var control = gProcessor.paramControls[index];
            if (control.dataset.inactive === 'true' && (definition.type === 'float' || definition.type === 'int')) {
                saved.push({control: control, value: control.value});
                control.value = definition.initial !== undefined ? definition.initial : definition.default;
            }
        });
        try { return originalGetValues.call(this); }
        finally { saved.forEach(function (entry) { entry.control.value = entry.value; }); }
    };
    
    var originalChange = gProcessor.onchange;
    gProcessor.onchange = function () {
        if (originalChange) originalChange();
        if (!this.processing && (this.hasError || !this.hasValidCurrentObject)) modelDirty = true;
        this.enableItems();
        if (this.hasError) focusEngineError();
    };
    
    var originalExport = gProcessor.generateOutputFileButton.onclick;
    gProcessor.generateOutputFileButton.onclick = function (event) {
        if (!modelDirty && generationTimer === null && !gProcessor.processing && !gProcessor.hasError) {
            try { originalExport.call(this, event); }
            catch (error) { gProcessor.setError(error.message || String(error)); }
        }
    };
    
    var originalFormatChange = gProcessor.formatDropdown.onchange;
    gProcessor.formatDropdown.onchange = function (event) {
        gProcessor.clearOutputFile();
        originalFormatChange.call(this, event);
        scheduleGeneration(0);
    };
}

function setFloatingWindow(id, open, returnFocus) {
    var windowElement = document.getElementById(id);
    var toggle = document.getElementById(id.replace('-window', '-toggle'));
    
    if (!open && (returnFocus || windowElement.contains(document.activeElement))) toggle.focus();
    
    windowElement.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    
    synchronizeToolsLayout();
}

function synchronizeToolsLayout() {
    var tools = document.getElementById('tools-window');
    
    if (!tools) return;
    
    var scrollbar = 0;
    
    if (!tools.hidden && tools.scrollHeight > tools.clientHeight) {
        var style = getComputedStyle(tools);
        scrollbar = Math.max(0, tools.offsetWidth - tools.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth));
    }
    
    tools.style.setProperty('--tools-scrollbar-width', scrollbar + 'px');
    
    document.documentElement.style.setProperty('--mobile-tools-clearance', tools.hidden ? '12px' : (tools.getBoundingClientRect().height + 24) + 'px');
}

function adaptFloatingWindows() {
    var toolbar = document.querySelector('.workspace-toolbar');
    
    function synchronizeToolbarHeight() {
        document.documentElement.style.setProperty('--workspace-overlay-top', (toolbar.getBoundingClientRect().height + 8) + 'px');
    }
    
    new ResizeObserver(synchronizeToolbarHeight).observe(toolbar);
    
    var tools = document.getElementById('tools-window');
    
    new ResizeObserver(synchronizeToolsLayout).observe(tools);
    new MutationObserver(synchronizeToolsLayout).observe(tools, {subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'aria-expanded']});
    
    window.addEventListener('resize', synchronizeToolsLayout);
    
    synchronizeToolbarHeight();
    setFloatingWindow('tools-window', true);

    // Keep the mobile reading order aligned with the visual order. Restore each
    // element to its original parent when returning to the desktop workspace.
    var mobile = window.matchMedia('(max-width: 767.98px)');
    var preview = document.querySelector('.preview-column');
    var viewer = document.getElementById('viewer');
    var controls = document.createElement('div');
    controls.className = 'mobile-preview-controls';
    var elements = ['.view-navigation', '.zoom-slider-control', '#about-window', '#preferences-window', '#tutorial-toast', '#error-toasts'].map(function (selector) {
        var element = document.querySelector(selector);
        var marker = document.createComment('Desktop position: ' + selector);
        element.before(marker);
        return {element: element, marker: marker};
    });
    preview.append(controls);

    function synchronizeMobileLayout() {
        if (mobile.matches) {
            viewer.prepend(preview);
            elements.forEach(function (entry, index) {
                (index < 2 ? controls : viewer).append(entry.element);
            });
        } else {
            viewer.append(preview);
            elements.forEach(function (entry) { entry.marker.after(entry.element); });
        }
    }
    mobile.addEventListener('change', synchronizeMobileLayout);
    synchronizeMobileLayout();
    
    ['tools', 'about', 'preferences'].forEach(function (name) {
        $('#' + name + '-toggle').on('click', function () {
            var id = name + '-window';
            var open = document.getElementById(id).hidden;
            if (open) ['tools', 'about', 'preferences'].forEach(function (other) { if (other !== name) setFloatingWindow(other + '-window', false); });
            setFloatingWindow(id, open);
            if (open && name === 'preferences') document.getElementById('contrast-toggle').focus();
        });
    });
    
    $(document).on('keydown', function (event) {
        if (event.key !== 'Escape') return;
        var activeWindow = document.activeElement.closest('.floating-window');
        if (!activeWindow) activeWindow = Array.from(document.querySelectorAll('.floating-window')).find(function (element) { return !element.hidden; });
        if (activeWindow && !activeWindow.hidden) {
            event.preventDefault();
            setFloatingWindow(activeWindow.id, false, true);
        }
    });
}

function adaptZoomSlider() {
    if (!gProcessor.viewer) return;
    
    var viewer = gProcessor.viewer;
    var $zoom = $('<div class="zoom-slider-control" role="group" aria-label="Zoom do modelo">').appendTo(gProcessor.viewerdiv);
    
    $('<label for="model-zoom"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-1 2v3H6v2h3v3h2v-3h3V9h-3V6z"/></svg> Zoom</label>').appendTo($zoom);
    
    var $slider = $('<input id="model-zoom" class="form-range" type="range" min="0" max="100" step="0.1" aria-describedby="model-zoom-value">').appendTo($zoom);
    var $output = $('<output id="model-zoom-value" for="model-zoom">').appendTo($zoom);
    
    function synchronizeZoom() {
        var distance = Math.max(viewer.ZOOM_MIN, Math.min(viewer.ZOOM_MAX, viewer.viewpointZ));
        var value = 100 * (1 - Math.log(distance / viewer.ZOOM_MIN) / Math.log(viewer.ZOOM_MAX / viewer.ZOOM_MIN));
        $slider.val(value);
        $output.text(Number($slider.val()).toFixed(1) + '%');
        $slider.attr('aria-valuetext', $output.text());
    }
    
    viewer.onZoomChanged = synchronizeZoom;
    $slider.on('input change', function () {
        var distance = viewer.ZOOM_MIN * Math.pow(viewer.ZOOM_MAX / viewer.ZOOM_MIN, 1 - Number(this.value) / 100);
        viewer.setZoom((distance - viewer.ZOOM_MIN) / (viewer.ZOOM_MAX - viewer.ZOOM_MIN));
    });
    
    $zoom.on('mousedown mousemove mouseup wheel touchstart touchmove touchend', function (event) { event.stopPropagation(); });
    
    synchronizeZoom();
}

function adaptViewport() {
    if (!gProcessor.viewer) return;
    
    var viewer = gProcessor.viewer;
    
    function resize() {
        var rect = gProcessor.viewerdiv.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        var ratio = Math.min(window.devicePixelRatio || 1, 2);
        var width = Math.max(1, Math.round(rect.width * ratio));
        var height = Math.max(1, Math.round(rect.height * ratio));
        var gl = viewer.gl;
        if (gl.canvas.width === width && gl.canvas.height === height) return;
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.makeCurrent();
        gl.viewport(0, 0, width, height);
        gl.matrixMode(gl.PROJECTION);
        gl.loadIdentity();
        gl.perspective(45, rect.width / rect.height, 0.5, 100000);
        gl.matrixMode(gl.MODELVIEW);
        viewer.onDraw();
    }
    
    var observer = new ResizeObserver(resize);

    observer.observe(gProcessor.viewerdiv);
    window.addEventListener('resize', resize);
    
    resize();
}

function adaptViewCube() {
    if (!gProcessor.viewer) return;
    
    var viewer = gProcessor.viewer;
    var views = [
        {name: 'front', label: 'Frente', angles: [-90, 0, 0], normal: [0, 0, 1]},
        {name: 'back', label: 'Verso', angles: [-90, 0, 180], normal: [0, 0, -1]},
        {name: 'right', label: 'Direita', angles: [-90, 0, -90], normal: [1, 0, 0]},
        {name: 'left', label: 'Esquerda', angles: [-90, 0, 90], normal: [-1, 0, 0]},
        {name: 'top', label: 'Superior', angles: [0, 0, 0], normal: [0, -1, 0]},
        {name: 'bottom', label: 'Inferior', angles: [180, 0, 0], normal: [0, 1, 0]},
        {name: 'iso', label: 'Isométrica', angles: [-60, 0, -45]}
    ];
    
    var $overlay = $('<div class="view-navigation" role="group" aria-label="Orientação do modelo">').appendTo(gProcessor.viewerdiv);
    var $scene = $('<div class="view-cube-scene">').appendTo($overlay);
    var $cube = $('<div class="view-cube">').appendTo($scene);
    var $select = $('<select id="model-view" class="form-select view-select" aria-label="Vista do modelo">').appendTo($overlay);
    
    $('<option value="free">Vista livre</option>').appendTo($select);
    
    function choose(view) {
        viewer.angleX = view.angles[0];
        viewer.angleY = view.angles[1];
        viewer.angleZ = view.angles[2];
        viewer.onDraw();
    }
    
    views.forEach(function (view) {
        $('<option>').val(view.name).text(view.label).appendTo($select);
        if (!view.normal) return;
        view.button = $('<button type="button" class="view-cube-face">').addClass('cube-' + view.name).attr('aria-label', 'Vista ' + view.label).text(view.label).appendTo($cube);
        view.button.on('click', function (event) { event.stopPropagation(); choose(view); });
    });
    
    $select.on('change', function () {
        var selected = views.find(function (view) { return view.name === $select.val(); });
        if (selected) choose(selected);
    });
    
    $overlay.on('mousedown mousemove mouseup wheel touchstart touchmove touchend', function (event) { event.stopPropagation(); });
    
    function multiply(a, b) {
        return a.map(function (row) {
            return b[0].map(function (_, column) {
                return row.reduce(function (sum, value, index) { return sum + value * b[index][column]; }, 0);
            });
        });
    }

    function synchronize() {
        var radians = Math.PI / 180;
        var x = viewer.angleX * radians, y = viewer.angleY * radians, z = viewer.angleZ * radians;
        var cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
        var rotation = multiply(multiply([[1, 0, 0], [0, cx, -sx], [0, sx, cx]], [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]), [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]]);
        // Cube front is world -Y; its top is world +Z. Reflect screen Y for CSS.
        var matrix = multiply([[1, 0, 0], [0, -1, 0], [0, 0, 1]], multiply(rotation, [[1, 0, 0], [0, 0, -1], [0, -1, 0]]));
        var css = [];
        for (var column = 0; column < 3; column++) css.push(matrix[0][column], matrix[1][column], matrix[2][column], 0);
        css.push(0, 0, 0, 1);
        $cube.css('transform', 'matrix3d(' + css.join(',') + ')');
        views.forEach(function (view) {
            if (!view.normal) return;
            var facing = matrix[2].reduce(function (sum, value, index) { return sum + value * view.normal[index]; }, 0) > 0.001;
            view.button.attr({tabindex: facing ? '0' : '-1', 'aria-hidden': String(!facing)});
        });
        var selected = views.find(function (view) {
            return view.angles.every(function (angle, index) {
                var current = [viewer.angleX, viewer.angleY, viewer.angleZ][index];
                return Math.abs(((current - angle + 540) % 360) - 180) < 0.01;
            });
        });
        $select.val(selected ? selected.name : 'free');
    }
    
    var originalDraw = viewer.onDraw;
    viewer.onDraw = function () {
        originalDraw.apply(this, arguments);
        synchronize();
    };

    synchronize();
}

function createPanel(title, index) {
    var $section = $('<section class="configuration-panel">').appendTo(gProcessor.parametersdiv);
    var $heading = $('<h2>');
    var $button = $('<button type="button" class="panel-toggle">').text(title).attr({id: 'panel-toggle-' + index, 'aria-expanded': String(index === 0), 'aria-controls': 'panel-body-' + index});
    var $body = $('<div class="panel-body">').attr({id: 'panel-body-' + index, role: 'region', 'aria-labelledby': 'panel-toggle-' + index}).prop('hidden', index !== 0);
    $heading.append($button).appendTo($section);
    $body.appendTo($section);
    $button.on('click', function () {
        var closing = !$body.prop('hidden');
        if (closing && $body[0].contains(document.activeElement)) this.focus();
        $body.prop('hidden', closing);
        $(this).attr('aria-expanded', String(!closing));
    });
    panelBodies[index] = $body;
    return $body;
}

function adaptParameterControls() {
    ['Texto e Braille', 'Placa e fixação', 'Exportação e cores'].forEach(createPanel);
    gProcessor.paramDefinitions.forEach(function (definition, index) {
        var control = gProcessor.paramControls[index];
        control.name = definition.name;
        control.id = 'parameter-' + definition.name;
        parameterControls[definition.name] = control;
        var $oldRow = $(control).closest('tr');
        var $field = $('<div class="parameter-field">').attr('data-parameter', definition.name);
        $('<label>').attr('for', control.id).text(definition.caption || definition.name).appendTo($field);
        var $value = $('<div class="parameter-value">').appendTo($field);
        $value.append($(control).parent().contents());
        $oldRow.remove();
        if (definition.type === 'float' || definition.type === 'int') {
            var originalValue = control.value;
            var lower = definition.min !== undefined ? definition.min : definition.begin;
            var upper = definition.max !== undefined ? definition.max : definition.end;
            control.type = lower !== undefined && upper !== undefined ? 'range' : 'number';
            control.step = definition.step !== undefined ? definition.step : definition.type === 'int' ? '1' : control.type === 'range' ? '0.1' : 'any';
            if (lower !== undefined) control.min = lower;
            if (upper !== undefined) control.max = upper;
            control.value = originalValue;
        }
        $(control).addClass(control.type === 'checkbox' ? 'form-check-input' : control.type === 'range' ? 'form-range' : control.tagName === 'SELECT' ? 'form-select' : 'form-control');
        if (control.type === 'range') {
            $(control).siblings('span').remove();
            var unit = /position/.test(definition.name) ? '' : ' mm';
            var $output = $('<output class="range-value">').attr({id: control.id + '-value', for: control.id}).appendTo($value);
            control.setAttribute('aria-describedby', $output.attr('id'));
            function updateRange() {
                $(control).siblings('span').remove();
                $output.text(control.value + unit);
                control.setAttribute('aria-valuetext', control.value + unit);
            }
            $(control).on('input change', updateRange);
            updateRange();
        }
        if (definition.visible === false) $field.prop('hidden', true);
        parameterRows[definition.name] = $field;
    });
    var subgroups = [
        [['Informação', ['text', 'upper']], ['Texto visual', ['visual_text', 'letter_size', 'letter_relief', 'letter_align', 'letter_gap']], ['Pontos Braille', ['dot_height', 'dot_diameter']]],
        [['Placa', ['plate_margin', 'plate_thickness']], ['Chaveiro', ['ear_enabled', 'ear_side', 'ear_position', 'ear_width', 'ear_height', 'ear_hole', 'ear_thickness', 'ear_overlap', 'ear_chamfer_enabled', 'ear_chamfer', 'ear_joint_chamfer_enabled', 'ear_joint_chamfer']], ['Parafusos', ['screws_enabled', 'screw_size', 'screw_clearance', 'screw_count', 'screw_edge', 'screw_head', 'screw_head_diameter', 'screw_head_depth']], ['Orientação e impressão', ['reference_corner', 'stands']]]
    ];
    subgroups.forEach(function (sections, index) {
        sections.forEach(function (section) {
            var $group = $('<section class="configuration-group">').appendTo(panelBodies[index]);
            $('<h3>').text(section[0]).appendTo($group);
            section[1].forEach(function (name) { if (parameterRows[name]) $group.append(parameterRows[name]); });
        });
    });
    Object.keys(parameterRows).forEach(function (name) {
        if (!parameterRows[name].parent().length) panelBodies[0].append(parameterRows[name]);
    });
    $(gProcessor.parameterstable).hide();
    $('<p class="field-help">Maiúscula mantém o tratamento de maiúsculas no Braille e transforma também o texto visual em maiúsculas. Ao desmarcar, o texto visual volta ao texto digitado.</p>').insertAfter(parameterRows.upper);
    $('<p class="field-help">Margem adicional ao conteúdo, em mm. Zero preserva os recuos internos das células Braille.</p>').insertAfter(parameterRows.plate_margin);
    $('<p class="field-help">Os alojamentos usam a espessura da placa definida acima. Informe as medidas da cabeça do seu parafuso; M2/M3/M4/M5/M6 indicam somente o diâmetro nominal.</p>').insertAfter(parameterRows.screws_enabled);
    if (parameterRows.screw_edge) {
        parameterRows.screw_edge.find('label').text('Distância do centro dos furos à borda (mm)');
        $('<p id="screw-edge-help" class="field-help">Medida da borda da placa ao centro do furo. A distância até a parede do furo depende também do seu diâmetro.</p>').insertAfter(parameterRows.screw_edge);
        parameterControls.screw_edge.setAttribute('aria-describedby', 'parameter-screw_edge-value screw-edge-help');
    }
    $('<p class="field-help">Canto de referência para orientação da placa. Apoios são destinados à impressão e integram a base exportada.</p>').appendTo(panelBodies[1]);
    $('<h3>').text('Formato').appendTo(panelBodies[2]);
    $('<label for="export-format">Formato de exportação</label>').appendTo(panelBodies[2]);
    panelBodies[2].append(gProcessor.formatDropdown);
    $('<p class="field-help">STL: geometria de uma cor. 3MF: cores por parte; a atribuição de filamentos depende do fatiador.</p>').appendTo(panelBodies[2]);
    colorsHeading = $('<h3 class="group-divider">').text('Cores').appendTo(panelBodies[2]);
    initialExportFormat = gProcessor.formatDropdown.value || 'stl';
    gProcessor.exportColors = Object.assign({}, defaultExportColors);
    [['base', 'Base'], ['text', 'Texto visual'], ['dots', 'Pontos Braille']].forEach(function (entry) {
        var $row = $('<div class="color-field">').appendTo(panelBodies[2]);
        $('<label>').attr('for', 'color-' + entry[0]).text(entry[1]).appendTo($row);
        var $input = $('<input type="color">').attr('id', 'color-' + entry[0]).val(gProcessor.exportColors[entry[0]]).appendTo($row);
        var $value = $('<output>').attr('for', $input.attr('id')).text($input.val()).appendTo($row);
        colorFields[entry[0]] = $row;
        $input.on('input change', function () {
            if (gProcessor.exportColors[entry[0]] === this.value) return;
            gProcessor.exportColors[entry[0]] = this.value;
            $value.text(this.value);
            gProcessor.clearOutputFile();
            updatePreviewColors();
            gProcessor.enableItems();
        });
    });
    $(gProcessor.parametersdiv).on('input change', '[data-parameter] input, [data-parameter] select, [data-parameter] textarea', function (event) {
        this.removeAttribute('aria-invalid');
        if (event.type === 'input') markModelDirty();
        else scheduleGeneration(0);
    });
    updateConditionalControls();
}

function updatePreviewColors() {
    if (!gProcessor || !gProcessor.viewer || !gProcessor.plateParts || !gProcessor.plateParts.length) return;
    var colors = gProcessor.exportColors || defaultExportColors;
    var meshes = [];
    gProcessor.plateParts.forEach(function (part) {
        var hex = colors[part.name] || defaultExportColors[part.name];
        if (!hex || !part.data) return;
        var rgb = [1, 3, 5].map(function (offset) { return parseInt(hex.slice(offset, offset + 2), 16) / 255; });
        // setColor returns a copy: retain the original solids used for export.
        var preview = part.data.setColor(rgb[0], rgb[1], rgb[2]);
        meshes = meshes.concat(OpenJsCad.Viewer.csgToMeshes(preview));
    });
    gProcessor.viewer.meshes = meshes;
    gProcessor.viewer.onDraw();
}

function resetConfiguration() {
    if (gProcessor.processing || generationTimer !== null) return;
    gProcessor.paramDefinitions.forEach(function (definition) {
        var control = parameterControls[definition.name];
        var initial = definition.initial !== undefined ? definition.initial : definition.default;
        if (control.type === 'checkbox') control.checked = initial === true;
        else if (control.tagName === 'SELECT') control.value = initial !== undefined ? initial : definition.values[0];
        else control.value = initial !== undefined ? initial : (definition.type === 'float' || definition.type === 'int' ? '0' : '');
        control.removeAttribute('aria-invalid');
        if (control.getAttribute('aria-describedby') === 'configuration-errors') control.removeAttribute('aria-describedby');
        if (control.type === 'range') {
            $(control).siblings('span').remove();
            var unit = /position/.test(definition.name) ? '' : ' mm';
            $(control).siblings('output').text(control.value + unit);
            control.setAttribute('aria-valuetext', control.value + unit);
            control.setAttribute('aria-describedby', control.id + '-value' + (definition.name === 'screw_edge' ? ' screw-edge-help' : ''));
        }
    });
    gProcessor.exportColors = Object.assign({}, defaultExportColors);
    Object.keys(colorFields).forEach(function (name) {
        colorFields[name].find('input').val(defaultExportColors[name]);
        colorFields[name].find('output').text(defaultExportColors[name]);
    });
    gProcessor.currentFormat = initialExportFormat;
    gProcessor.formatDropdown.value = initialExportFormat;
    gProcessor.setError('');
    updateConditionalControls();
    scheduleGeneration(0);
}

function markModelDirty() {
    modelDirty = true;
    gProcessor.clearOutputFile();
    $(gProcessor.statusspan).text('Edição em andamento. Conclua a interação para atualizar o modelo.');
    gProcessor.enableItems();
}

function scheduleGeneration(delay) {
    if (gProcessor.processing) return;
    if (generationTimer !== null) clearTimeout(generationTimer);
    modelDirty = true;
    gProcessor.clearOutputFile();
    generationTimer = setTimeout(function () { generationTimer = null; parseParameters(); }, delay);
    $(gProcessor.statusspan).text('Atualizando modelo...');
    gProcessor.enableItems();
}

function updateConditionalControls() {
    var busy = gProcessor.processing || generationTimer !== null;
    function enabled(name) { return parameterControls[name] && parameterControls[name].checked; }
    Object.keys(parameterControls).forEach(function (name) {
        var conditional = /^letter_/.test(name) ? enabled('visual_text') : /^ear_/.test(name) && name !== 'ear_enabled' ? enabled('ear_enabled') : /^screw_/.test(name) ? enabled('screws_enabled') : null;
        if (name === 'ear_chamfer') conditional = conditional && enabled('ear_chamfer_enabled');
        if (name === 'ear_joint_chamfer') conditional = conditional && enabled('ear_joint_chamfer_enabled');
        if (name === 'screw_head_diameter' || name === 'screw_head_depth') conditional = conditional && parameterControls.screw_head && parameterControls.screw_head.value !== 'none';
        parameterControls[name].dataset.inactive = String(conditional === false);
        parameterControls[name].disabled = busy || conditional === false;
        if (conditional !== null) {
            var row = parameterRows[name];
            if (!conditional && row[0].contains(document.activeElement)) {
                var toggleName = /^letter_/.test(name) ? 'visual_text' : /^ear_/.test(name) ? 'ear_enabled' : 'screws_enabled';
                parameterControls[toggleName].focus();
            }
            row.prop('hidden', !conditional);

        }
    });
    gProcessor.formatDropdown.disabled = busy;
    if (colorsHeading) colorsHeading.prop('hidden', gProcessor.formatDropdown.value !== '3mf');
    Object.keys(colorFields).forEach(function (name) {
        var visible = gProcessor.formatDropdown.value === '3mf' && (name !== 'text' || enabled('visual_text'));
        colorFields[name].prop('hidden', !visible).find('input').prop('disabled', busy || !visible);
    });
}

function showFieldError(control, message) {
    setFloatingWindow('tools-window', true);
    var $body = $(control).closest('.panel-body');
    $body.prop('hidden', false);
    $('#' + $body.attr('aria-labelledby')).attr('aria-expanded', 'true');
    control.setAttribute('aria-invalid', 'true');
    describeConfigurationError(control);
    gProcessor.setError(message);
    control.focus();
}

function describeConfigurationError(control) {
    var ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (ids.indexOf('configuration-errors') === -1) ids.push('configuration-errors');
    control.setAttribute('aria-describedby', ids.join(' '));
}

function focusEngineError() {
    setFloatingWindow('tools-window', true);
    var message = $(gProcessor.errorpre).text();
    var token = message.match(/\b([a-z][a-z0-9_]*)\s*:/);
    var matched = token && parameterControls[token[1]] && !parameterControls[token[1]].disabled ? token[1] : null;
    if (matched) {
        var control = parameterControls[matched];
        var $body = $(control).closest('.panel-body').prop('hidden', false);
        $('#' + $body.attr('aria-labelledby')).attr('aria-expanded', 'true');
        control.setAttribute('aria-invalid', 'true');
        describeConfigurationError(control);
        control.focus();
    }
}

function parseParameters() {
    gProcessor.enableItems();
    var invalid = gProcessor.paramDefinitions.find(function (definition) {
        var control = parameterControls[definition.name];
        if (control.dataset.inactive === 'true') return false;
        if (definition.name === 'text') return !control.value.trim();
        if (definition.type === 'float' || definition.type === 'int' || definition.type === 'range') return !control.value.trim() || !Number.isFinite(Number(control.value)) || !control.checkValidity();
        return false;
    });
    if (invalid) {
        showFieldError(parameterControls[invalid.name], invalid.name === 'text' ? 'Digite um texto para gerar a placa.' : 'Valor inválido em ' + (invalid.caption || invalid.name) + '. Revise o campo indicado.');
        return;
    }
    modelDirty = false;
    try { gProcessor.rebuildSolid(); }
    catch (error) { modelDirty = true; gProcessor.processing = false; gProcessor.setError(error.message); focusEngineError(); }
}
