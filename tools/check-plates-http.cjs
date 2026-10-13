// Run with Playwright installed outside the application:
// $env:T2B_TEST_TOOLS='C:/path/to/node_modules'; node tools/check-plates-http.cjs
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const external = process.env.T2B_TEST_TOOLS;
const {chromium} = require(external ? path.join(external, 'playwright') : 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.T2B_TEST_OUTPUT || path.join(require('os').tmpdir(), 'text2braille-plates-validation');
fs.mkdirSync(output, {recursive: true});
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.jscad':'text/plain; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.x3d':'model/x3d+xml'};
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if(rel === '/__reader.html') { res.setHeader('Content-Type','text/html'); res.end('<!doctype html><html><head><script type="importmap">{"imports":{"three":"/test-tools/three/build/three.module.js"}}</script></head><body></body></html>'); return; }
  const folder = rel.startsWith('/test-tools/') ? external : root;
  if(rel.startsWith('/test-tools/')) rel = rel.slice('/test-tools'.length);
  if(rel === '/') rel = '/index.html';
  const file = path.resolve(folder || root, '.'+rel);
  if(!file.startsWith(path.resolve(folder || root)+path.sep)) { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404); res.end(); }
});
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:'+server.address().port;
  browser = await chromium.launch({executablePath: process.env.T2B_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1100,height:900}});
  const errors = [], workers = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', async d => {errors.push(d.message()); await d.dismiss();});
  page.on('worker', w => workers.push(w.url()));
  await page.route('**/*googletagmanager*', route => route.abort());
  await page.goto(url);
  const landingAssets = await page.evaluate(() => Array.from(document.querySelectorAll('script[src], link[rel="stylesheet"], img[src]')).map(node => node.src || node.href));
  for(const asset of landingAssets.filter(asset => asset.startsWith(url))) {
    const response = await page.request.get(asset);
    assert(response.ok(), 'Landing asset unavailable: '+asset);
  }
  await page.setViewportSize({width:320,height:900});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const menuToggle = page.locator('[data-menu-toggle="#menuAcessibilidade"]');
  await menuToggle.click();
  assert.strictEqual(await menuToggle.getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.strictEqual(await menuToggle.getAttribute('aria-expanded'),'false');
  assert(await menuToggle.evaluate(node => node === document.activeElement));
  await page.locator('#high_contrast').evaluate(node => node.click());
  assert(await page.locator('body').evaluate(node => node.classList.contains('alto-contraste')));
  await page.locator('#high_contrast').evaluate(node => node.click());
  await page.setViewportSize({width:1100,height:900});
  await page.goto(url+'/text2braille3d.html');
  async function ready() { await page.waitForFunction(() => gProcessor && !gProcessor.processing && generationTimer === null && (gProcessor.hasError || gProcessor.hasValidCurrentObject), null, {timeout:180000}); }
  await ready();
  const snapshot = () => page.evaluate(() => ({params:gProcessor.getParamValues(), error:gProcessor.hasError ? gProcessor.errorpre.textContent : null, polygons:gProcessor.currentObject.polygons.length, bounds:gProcessor.currentObject.getBounds().map(v=>[v.x,v.y,v.z]),parts:(gProcessor.plateParts || []).map(p=>({name:p.name,polygons:p.data.polygons.length,bounds:p.data.getBounds().map(v=>[v.x,v.y,v.z])}))}));
  const initial = await snapshot();
  console.log('HTTP: modelo inicial carregado.');
  assert.strictEqual(initial.error, null, initial.error);
  assert.strictEqual(initial.params.ear_position,0.5);assert.strictEqual(initial.params.letter_relief,0.8);
  assert.strictEqual(initial.polygons,3754,'Default geometry changed');
  assert(Math.abs(initial.bounds[0][0]+49.3125)<1e-6);
  assert(Math.abs(initial.bounds[1][2]-22.2)<1e-6);
  assert(!await page.locator('.statusdiv').innerText().then(text=>text.includes('Pronto.')));
  const gizmoWorkers=workers.length;
  const cameraStart=await page.evaluate(()=>{const v=gProcessor.viewer;v.viewpointX=3;v.viewpointY=-2;v.onDraw();return [v.viewpointX,v.viewpointY,v.viewpointZ];});
  const presets={front:[-90,0,0],back:[-90,0,180],right:[-90,0,-90],left:[-90,0,90],top:[0,0,0],bottom:[180,0,0],iso:[-60,0,-45]};
  for(const [name,angles] of Object.entries(presets)) {
    await page.locator('#model-view').selectOption(name);
    const camera=await page.evaluate(()=>{const v=gProcessor.viewer;return {angles:[v.angleX,v.angleY,v.angleZ],position:[v.viewpointX,v.viewpointY,v.viewpointZ],faces:document.querySelectorAll('.view-cube-face').length};});
    assert.deepStrictEqual(camera.angles,angles);assert.deepStrictEqual(camera.position,cameraStart);assert.strictEqual(camera.faces,6);
  }
  await page.locator('.cube-front').click();assert.strictEqual(await page.locator('#model-view').inputValue(),'front');
  const frontal=await page.locator('.view-cube').evaluate(node=>Array.from(new DOMMatrix(getComputedStyle(node).transform).toFloat64Array()));
  frontal.forEach((value,index)=>assert(Math.abs(value-([0,5,10,15].includes(index)?1:0))<1e-5));
  await page.locator('.cube-front').focus();await page.keyboard.press('Enter');
  assert.strictEqual(await page.locator('#model-view').inputValue(),'front');
  const canvas=await page.locator('canvas').boundingBox();
  await page.mouse.move(canvas.x+canvas.width*0.6,canvas.y+canvas.height*0.5);await page.mouse.down();
  await page.mouse.move(canvas.x+canvas.width*0.6+20,canvas.y+canvas.height*0.5+12,{steps:5});await page.mouse.up();
  assert.strictEqual(await page.locator('#model-view').inputValue(),'free');
  assert.notDeepStrictEqual(await page.locator('.view-cube').evaluate(node=>Array.from(new DOMMatrix(getComputedStyle(node).transform).toFloat64Array())),frontal);
  assert.strictEqual(workers.length,gizmoWorkers);
  await page.evaluate(()=>{const v=gProcessor.viewer;v.viewpointX=0;v.viewpointY=0;v.onDraw();});
  await page.locator('#model-view').selectOption('iso');
  const gizmo={presets:7,faces:6,keyboard:true,synchronized:true,keepsZoomAndPan:true,noGeneration:true};
  const cameraWorkers=workers.length;
  await page.locator('#model-zoom').focus();await page.keyboard.press('ArrowRight');
  assert(await page.evaluate(()=>gProcessor.viewer.viewpointZ<200));
  await page.evaluate(()=>gProcessor.viewer.setZoom((500-10)/(10000-10)));
  assert(Math.abs(Number(await page.locator('#model-zoom').inputValue())-100*(1-Math.log(500/10)/Math.log(1000)))<0.11);
  await page.mouse.move(canvas.x+canvas.width*0.6,canvas.y+canvas.height*0.5);await page.mouse.wheel(0,-100);
  await page.waitForFunction(()=>gProcessor.viewer.viewpointZ<500);
  assert.strictEqual(workers.length,cameraWorkers);
  await page.evaluate(()=>gProcessor.viewer.setZoom((200-10)/(10000-10)));
  await page.locator('#tools-toggle').click();assert(await page.locator('#tools-window').isHidden());
  await page.keyboard.press('Enter');assert(await page.locator('#tools-window').isVisible());
  await page.keyboard.press('Escape');assert(await page.locator('#tools-window').isHidden());
  assert.strictEqual(await page.evaluate(()=>document.activeElement.id),'tools-toggle');
  await page.locator('#about-toggle').click();assert(await page.locator('#about-window').isVisible());
  assert.strictEqual(await page.locator('#about-window a').count(),5);
  await page.keyboard.press('Escape');assert(await page.locator('#about-window').isHidden());
  await page.locator('#tools-toggle').click();
  const workspace={fullscreen:true,zoomKeyboard:true,wheelSync:true,windowsKeyboard:true,creditsLinks:5,noCameraGeneration:true};
  const layouts=[];
  for(const [width,height] of [[320,900],[576,900],[1100,900],[800,450]]) {
    await page.setViewportSize({width,height});
    await page.waitForFunction(()=>{const c=document.querySelector('canvas');return c.width===Math.round(innerWidth*Math.min(devicePixelRatio,2))&&c.height===Math.round(innerHeight*Math.min(devicePixelRatio,2));});
    const layout = await page.evaluate(() => {const c=document.querySelector('canvas'),r=c.getBoundingClientRect(),m=gProcessor.viewer.gl.projectionMatrix.m;return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,canvas:r.width,canvasHeight:r.height,x:r.x,y:r.y,projectionAspect:m[5]/m[0]};});
    assert(layout.scroll<=width, JSON.stringify(layout));assert.strictEqual(layout.canvas,width);assert.strictEqual(layout.canvasHeight,height);assert.strictEqual(layout.x,0);assert.strictEqual(layout.y,0);assert(Math.abs(layout.projectionAspect-width/height)<1e-5);layouts.push(layout);
  }
  await page.evaluate(()=>{document.documentElement.style.fontSize='32px';document.body.style.fontSize='32px';});
  await page.setViewportSize({width:320,height:900});
  const enlargedText=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(enlargedText.scroll<=enlargedText.width);
  await page.evaluate(()=>{document.documentElement.style.fontSize='';document.body.style.fontSize='';});
  await page.setViewportSize({width:1100,height:900});
  if(await page.locator('#tools-window').isHidden()) await page.locator('#tools-toggle').click();
  const automatic = await page.evaluate(() => {
 const fields=gProcessor.paramDefinitions.filter(d=>(d.type==='float'||d.type==='int')&&d.min!==undefined&&d.max!==undefined);

 return {sliders:fields.every(d=>parameterControls[d.name].type==='range'), groups:document.querySelectorAll('.configuration-group').length,manual:!!document.querySelector('.generate-model')};
});
assert(automatic.sliders);assert.strictEqual(automatic.groups,7);assert(!automatic.manual);
await page.locator('#parameter-text').focus();await page.keyboard.press('End');await page.keyboard.type('a');
const workersDuringTyping=workers.length;
await page.waitForTimeout(600);
const editing=await page.evaluate(()=>({busy:document.getElementById('viewer').getAttribute('aria-busy'),disabled:parameterControls.text.disabled,pending:generationTimer,dirty:modelDirty}));
assert.deepStrictEqual(editing,{busy:'false',disabled:false,pending:null,dirty:true});assert.strictEqual(workers.length,workersDuringTyping);
const locked=await page.evaluate(()=>{document.getElementById('panel-toggle-0').focus();return {busy:document.getElementById('viewer').getAttribute('aria-busy'),disabled:parameterControls.text.disabled,progress:!document.querySelector('.generation-progress').hidden,exportDisabled:gProcessor.generateOutputFileButton.disabled};});
assert.deepStrictEqual(locked,{busy:'true',disabled:true,progress:true,exportDisabled:true});await ready();
await page.locator('#parameter-dot_height').scrollIntoViewIfNeeded();
const slider=await page.locator('#parameter-dot_height').boundingBox();
const sliderWorkers=workers.length;
await page.mouse.move(slider.x+slider.width*0.6,slider.y+slider.height/2);await page.mouse.down();
await page.mouse.move(slider.x+slider.width*0.8,slider.y+slider.height/2,{steps:5});await page.waitForTimeout(600);
assert.strictEqual(workers.length,sliderWorkers);assert.strictEqual(await page.locator('#parameter-dot_height').isEnabled(),true);
await page.mouse.up();await ready();assert(workers.length>sliderWorkers);
await page.evaluate(()=>{parameterControls.dot_height.value='0.75';parameterControls.dot_height.dispatchEvent(new Event('change',{bubbles:true}));});await ready();
await page.evaluate(()=>{parameterControls.text.value='Ol\u00e1 Mundo';parameterControls.text.dispatchEvent(new Event('change',{bubbles:true}));});await ready();
const reset=await snapshot();assert.deepStrictEqual(reset.params,initial.params);assert.strictEqual(reset.polygons,initial.polygons);
const labels = await page.evaluate(() => gProcessor.paramControls.every(c => c.labels && c.labels.length===1)); assert(labels);
  await page.locator('#panel-toggle-1').focus(); await page.keyboard.press('Enter');
  assert.strictEqual(await page.locator('#panel-toggle-1').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Space'); assert(await page.locator('#panel-body-1').isHidden());
  const focus = await page.evaluate(() => ({id:document.activeElement.id,outline:getComputedStyle(document.activeElement).outlineStyle})); assert.strictEqual(focus.outline,'solid');
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  assert.strictEqual(await page.evaluate(()=>document.activeElement.id),'panel-toggle-1');
  // Reset is a single generation and restores the model contract plus UI defaults.
  const resetWorkers=workers.length;
  const resetBusy=await page.evaluate(()=>{
    resetConfiguration();
    const progress=document.querySelector('.generation-progress');
    return {disabled:document.getElementById('reset-model').disabled,visible:!progress.hidden,outsideTools:!document.getElementById('tools-window').contains(progress),pointerEvents:getComputedStyle(progress).pointerEvents};
  });
  assert.deepStrictEqual(resetBusy,{disabled:true,visible:true,outsideTools:true,pointerEvents:'none'});
  await ready();
  const resetModel=await snapshot();
  assert.deepStrictEqual(resetModel.params,initial.params);
  assert.strictEqual(workers.length,resetWorkers+1);
  assert.strictEqual(await page.locator('#reset-model').isEnabled(),true);
  const resetUI=await page.evaluate(()=>({colors:gProcessor.exportColors,format:gProcessor.formatDropdown.value,colorsHidden:colorsHeading.prop('hidden'),values:Object.fromEntries(Object.keys(colorFields).map(name=>[name,colorFields[name].find('input').val()]))}));
  assert.deepStrictEqual(resetUI.colors,{base:'#e6d9b8',text:'#222222',dots:'#204fba'});
  assert.deepStrictEqual(resetUI.values,resetUI.colors);
  assert.strictEqual(resetUI.colorsHidden,resetUI.format!=='3mf');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{setFloatingWindow('tools-window',true);synchronizeToolsLayout();scheduleGeneration(1000);});
  const mobileProgress=await page.evaluate(()=>{const p=document.querySelector('.generation-progress').getBoundingClientRect(),t=document.getElementById('tools-window').getBoundingClientRect();return {progressBottom:p.bottom,toolsTop:t.top,toolsWidth:t.width,viewport:innerWidth};});
  assert(mobileProgress.progressBottom<=mobileProgress.toolsTop);
  assert(mobileProgress.toolsWidth<=mobileProgress.viewport-24);
  await ready();
  await page.setViewportSize({width:1100,height:900});
  const scrollbarValidation=await page.evaluate(()=>{
    const tools=document.getElementById('tools-window');
    const original=tools.style.maxHeight;
    function capture(){synchronizeToolsLayout();const style=getComputedStyle(tools);return {overflow:tools.scrollHeight>tools.clientHeight,width:tools.getBoundingClientRect().width,compensation:parseFloat(style.getPropertyValue('--tools-scrollbar-width')),consumed:Math.max(0,tools.offsetWidth-tools.clientWidth-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth))};}
    tools.style.maxHeight='140px';const overflowing=capture();
    tools.style.maxHeight='none';const fitting=capture();
    tools.style.maxHeight=original;synchronizeToolsLayout();
    return {overflowing,fitting};
  });
  assert(scrollbarValidation.overflowing.overflow);
  assert.strictEqual(scrollbarValidation.overflowing.compensation,scrollbarValidation.overflowing.consumed);
  assert.strictEqual(scrollbarValidation.overflowing.width,360+scrollbarValidation.overflowing.compensation);
  assert.strictEqual(scrollbarValidation.fitting.overflow,false);
  assert.strictEqual(scrollbarValidation.fitting.compensation,0);
  assert.strictEqual(scrollbarValidation.fitting.width,360);
  const resetValidation={singleGeneration:true,defaultsRestored:true,busyDisabled:true,progressOutsideTools:true,mobileProgress,scrollbarValidation};
  if(process.argv.includes('--ui-only')) {
    await page.evaluate(()=>{parameterControls.screws_enabled.checked=true;updateConditionalControls();gProcessor.setError('screw_edge: furo invade texto/Braille.');gProcessor.onchange();});
    const errorFocus=await page.evaluate(()=>({id:document.activeElement.id,expanded:document.getElementById('panel-toggle-1').getAttribute('aria-expanded')}));
    assert.strictEqual(errorFocus.id,'parameter-screw_edge');assert.strictEqual(errorFocus.expanded,'true');
    await page.evaluate(()=>{parameterControls.screws_enabled.checked=false;updateConditionalControls();gProcessor.setError('');});
    await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
    await page.setViewportSize({width:320,height:900});await page.screenshot({path:path.join(output,'narrow.png'),fullPage:true});
  const result={browser:await browser.version(),workspace,gizmo,resetValidation,layouts,enlargedText,labels,focus,errorFocus,errors};
    fs.writeFileSync(path.join(output,'ui-results.json'),JSON.stringify(result,null,2));
    assert.deepStrictEqual(errors,[]);console.log(JSON.stringify(result,null,2));return;
  }
  const files=[];
  async function download(format, prefix) {
    // Open the export panel through its real keyboard-accessible toggle.
    if(await page.locator('#panel-body-2').isHidden()) await page.locator('#panel-toggle-2').click();
    await page.locator('#export-format').selectOption(format); await ready();
    await page.locator('.export-model').click();
    assert.strictEqual(await page.evaluate(()=>gProcessor.hasError), false, await page.locator('pre').textContent());
    const waiting=page.waitForEvent('download'); await page.locator('a[download]').click();
    const downloaded=await waiting, target=path.join(output,prefix+'.'+format); await downloaded.saveAs(target);
    const record={format,path:target,bytes:fs.statSync(target).size}; files.push(record); return target;
  }
  const stl=await download('stl','baseline');
  assert.strictEqual(fs.statSync(stl).size,362584);
  const initial3mf=await download('3mf','baseline');
  const initialX3d=await download('x3d','baseline');
  console.log('HTTP: downloads baseline STL/3MF/X3D concluídos.');
  const x3d=await page.evaluate(async () => {
    const xml=await gProcessor.currentObjectToBlob().text(), documentXml=new DOMParser().parseFromString(xml,'application/xml');
    return {valid:!documentXml.querySelector('parsererror'),shapes:documentXml.querySelectorAll('Shape').length,colors:Array.from(documentXml.querySelectorAll('Material')).map(n=>n.getAttribute('diffuseColor'))};
  }); assert(x3d.valid); assert(x3d.shapes>0);
  async function generate(values) {
    await page.evaluate(values => {
      Object.keys(values).forEach(name => {const c=parameterControls[name]; if(!c) throw Error('Missing '+name); if(c.type==='checkbox') c.checked=values[name]; else c.value=values[name]; c.dispatchEvent(new Event('change',{bubbles:true}));});
    },values);
    // Committed changes schedule a build; ready waits for scheduling and Worker.
    await ready(); return snapshot();
  }
  const visual=await generate({visual_text:true,text:'O B 8\nOlá',stands:false,letter_size:6,letter_relief:0.8,letter_align:'center',letter_gap:3,plate_margin:5});
  assert.strictEqual(visual.error,null,visual.error); assert.deepStrictEqual(visual.parts.map(p=>p.name).sort(),['base','dots','text']);
  await download('stl','visual'); const visual3mf=await download('3mf','visual'); const visualX3d=await download('x3d','visual');
  console.log('HTTP: texto visual e três formatos concluídos.');
  await page.locator('#export-format').selectOption('3mf'); await ready();
  await page.locator('#color-text').fill('#204fba'); await ready(); // Same color as dots must retain both parts.
  await download('3mf','equal-colors');
  const fixation=await generate({text:'Olá Mundo',visual_text:true,stands:false,plate_margin:8,ear_enabled:true,ear_side:'right',screws_enabled:true,screw_size:'M3',screw_edge:4,screw_head:'none',reference_corner:false});
  assert.strictEqual(fixation.error,null,fixation.error); await download('3mf','fixation');
  const chamfered=await generate({visual_text:false,plate_margin:15,screws_enabled:false,ear_chamfer_enabled:true,ear_joint_chamfer_enabled:true});assert.strictEqual(chamfered.error,null,JSON.stringify(chamfered.params)+chamfered.error);await download('stl','chamfered');await download('3mf','chamfered');
for(const size of ['M2','M5','M6']) {const nominal=await generate({ear_enabled:false,ear_chamfer_enabled:false,ear_joint_chamfer_enabled:false,screws_enabled:true,screw_size:size,plate_margin:20,screw_edge:7});assert.strictEqual(nominal.error,null,nominal.error);await download('stl',size);}
const noVisual=await generate({visual_text:false,ear_enabled:false,screws_enabled:false,plate_margin:0,reference_corner:true,stands:true});
  assert.strictEqual(noVisual.error,null,noVisual.error); assert(!noVisual.parts.some(p=>p.name==='text')); await download('3mf','no-visual');
  // Hidden invalid fields must neither destroy values nor block a valid build.
  await page.evaluate(()=>parameterControls.letter_size.value='');
  const hiddenInvalid=await generate({plate_margin:1}); assert.strictEqual(hiddenInvalid.error,null,hiddenInvalid.error);
  assert.strictEqual(await page.locator('#parameter-letter_size').inputValue(),'16'); // Range sanitizes empty to midpoint.
  const invalid=await generate({text:'',plate_margin:5}); assert(invalid.error);
  assert.strictEqual(await page.evaluate(()=>document.activeElement.id),'parameter-text');
  assert(await page.locator('a[download]').isHidden());
  const unsupported=await generate({text:'🙂'}); assert(unsupported.error);
  // A failed export is reported and cannot leave a stale download visible.
  await generate({text:'Olá Mundo',stands:true,reference_corner:true});
  await page.evaluate(()=>{gProcessor.currentFormat='3mf';gProcessor.formatDropdown.value='3mf';gProcessor.exportColors.base='invalid';gProcessor.generateOutputFile();});
  assert(await page.locator('a[download]').isHidden()); assert(await page.evaluate(()=>gProcessor.hasError));
  // Independently reopen X3D with an external viewer, when supplied in test tools.
  let reader=null, threeMFReader=null;
  if(external && fs.existsSync(path.join(external,'three/examples/jsm/loaders/3MFLoader.js'))) {
    const readerPage=await browser.newPage(); await readerPage.goto(url+'/__reader.html');
    await readerPage.addScriptTag({type:'module',content:"import {ThreeMFLoader} from '/test-tools/three/examples/jsm/loaders/3MFLoader.js'; import {Box3} from 'three'; window.threeMFLoader=new ThreeMFLoader(); window.ThreeBox3=Box3;"});
    await readerPage.waitForFunction(()=>window.threeMFLoader);
    threeMFReader=await readerPage.evaluate(bytes=>{
      const assembly=threeMFLoader.parse(Uint8Array.from(bytes).buffer); assembly.updateMatrixWorld(true);
      const meshes=[]; assembly.traverse(node=>{if(node.isMesh){const box=new ThreeBox3().setFromObject(node); meshes.push({name:node.name,colors:[].concat(node.material).map(m=>m.color.getHexString()),bounds:[box.min.toArray(),box.max.toArray()]});}});
      const box=new ThreeBox3().setFromObject(assembly); return {meshes,bounds:[box.min.toArray(),box.max.toArray()]};
    },Array.from(fs.readFileSync(visual3mf)));
    assert.strictEqual(threeMFReader.meshes.length,3);
    const expected=['e6d9b8','222222','204fba']; assert.deepStrictEqual(threeMFReader.meshes.flatMap(m=>m.colors).sort(),expected.sort());
    for(let b=0;b<2;b++)for(let axis=0;axis<3;axis++)assert(Math.abs(threeMFReader.bounds[b][axis]-visual.bounds[b][axis])<1e-4);
    await readerPage.close();
  }
  if(external && fs.existsSync(path.join(external,'x_ite/dist/x_ite.min.js'))) {
    const viewer=await browser.newPage();
    await viewer.goto(url+'/__reader.html');
    await viewer.addScriptTag({url:url+'/test-tools/x_ite/dist/x_ite.min.js'});
    const xml=fs.readFileSync(visualX3d,'utf8');
    reader=await viewer.evaluate(async xml => {
      const canvas=X3D.createBrowser(); document.body.appendChild(canvas);
      const scene=await canvas.browser.createX3DFromString(xml); canvas.browser.replaceWorld(scene);
      const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];
      for(const node of scene.rootNodes)for(const point of node.geometry.coord.point) {
        const coordinates=[point.x,point.y,point.z];
        for(let axis=0;axis<3;axis++) {bounds[0][axis]=Math.min(bounds[0][axis],coordinates[axis]);bounds[1][axis]=Math.max(bounds[1][axis],coordinates[axis]);}
      }
      return {roots:scene.rootNodes.length,bounds,colors:Array.from(scene.rootNodes).map(node=>Array.from(node.appearance.material.diffuseColor)),geometry:Array.from(scene.rootNodes).map(node=>({points:node.geometry.coord.point.length,indices:node.geometry.coordIndex.length}))};
    },xml); assert(reader.roots>0); await viewer.close();
    // X_ITE converts declared millimeters to its internal meter coordinates.
    for(let b=0;b<2;b++)for(let axis=0;axis<3;axis++)assert(Math.abs(reader.bounds[b][axis]-visual.bounds[b][axis]*.001)<1e-6);
  }
  const result={browser:await browser.version(),workspace,gizmo,resetValidation,initial,automatic,locked,chamfered,layouts,enlargedText,labels,focus,x3d,visual,fixation,noVisual,hiddenInvalid,invalid:invalid.error,unsupported:unsupported.error,workers:workers.length,errors,files,threeMFReader,x3dReader:reader};
  fs.writeFileSync(path.join(output,'http-results.json'),JSON.stringify(result,null,2));
  assert.deepStrictEqual(errors,[]); console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
