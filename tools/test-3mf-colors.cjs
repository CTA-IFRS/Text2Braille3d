// Computational package checks. Bambu Studio import/round-trip is a separate check.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const context={console,Blob,TextEncoder};vm.createContext(context);
for(const file of ['js/csg.js','js/openjscad.js','jscad/braille.jscad'])
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
function unpack(buffer) {
  const files={};let offset=0;
  while(buffer.readUInt32LE(offset)===0x04034b50) {
    assert.strictEqual(buffer.readUInt16LE(offset+8),0,'ZIP STORE');
    const size=buffer.readUInt32LE(offset+18),length=buffer.readUInt16LE(offset+26),extra=buffer.readUInt16LE(offset+28);
    const name=buffer.subarray(offset+30,offset+30+length).toString('utf8'),start=offset+30+length+extra;
    files[name]=buffer.subarray(start,start+size).toString('utf8');offset=start+size;
  }
  return files;
}
(async()=>{
  const model=context.main({text:'Olá Mundo',visual_text:true,resolution:8,stands:false});
  for(const colors of [{base:'#FF0000',dots:'#00FF00',text:'#0000FF'},{base:'#aabbcc',dots:'#AABBCC',text:'#222222'}]) {
    const buffer=Buffer.from(await context.OpenJsCad.exportPlate3MF(model.parts,colors).arrayBuffer()),files=unpack(buffer);
    const config=files['Metadata/model_settings.config'],project=JSON.parse(files['Metadata/project_settings.config']);
    const expected=[...new Set(model.parts.map(p=>colors[p.name].toUpperCase()))];
    assert.deepStrictEqual(project.filament_colour,expected);
    assert.strictEqual(project.filament_settings_id.length,expected.length);
    assert.strictEqual((config.match(/<part /g)||[]).length,model.parts.length);
    model.parts.forEach((part,i)=>{
      const slot=expected.indexOf(colors[part.name].toUpperCase())+1;
      assert(config.includes('<part id="'+(i+2)+'" subtype="normal_part"><metadata key="name" value="'+part.name+'"/><metadata key="extruder" value="'+slot+'"/>'));
    });
    assert.strictEqual((files['3D/3dmodel.model'].match(/<item /g)||[]).length,1);
    if(process.env.T2B_3MF_OUTPUT && colors.base==='#FF0000')fs.writeFileSync(path.resolve(process.env.T2B_3MF_OUTPUT),buffer);
    if(process.env.T2B_3MF_OUTPUT && colors.base!=='#FF0000')fs.writeFileSync(path.resolve(process.env.T2B_3MF_OUTPUT).replace(/\.3mf$/i,'-equal.3mf'),buffer);
  }
  assert.throws(()=>context.OpenJsCad.exportPlate3MF(model.parts,{base:'bad',dots:'#333333',text:'#222222'}),/Cor inválida/);
  const onePart=[{name:'base',data:model.parts[0].data}];
  const twoParts=model.parts.filter(p=>p.name!=='text');
  const twoFiles=unpack(Buffer.from(await context.OpenJsCad.exportPlate3MF(twoParts,{base:'#FF0000',dots:'#00FF00'}).arrayBuffer()));
  assert.strictEqual((twoFiles['Metadata/model_settings.config'].match(/<part /g)||[]).length,2);
  assert(twoFiles['Metadata/model_settings.config'].includes('key="extruder" value="2"'));
  if(process.env.T2B_3MF_OUTPUT)fs.writeFileSync(path.resolve(process.env.T2B_3MF_OUTPUT).replace(/\.3mf$/i,'-two.3mf'),Buffer.from(await context.OpenJsCad.exportPlate3MF(twoParts,{base:'#FF0000',dots:'#00FF00'}).arrayBuffer()));
  const oneFiles=unpack(Buffer.from(await context.OpenJsCad.exportPlate3MF(onePart).arrayBuffer()));
  assert.strictEqual((oneFiles['Metadata/model_settings.config'].match(/<part /g)||[]).length,1);
  assert.deepStrictEqual(JSON.parse(oneFiles['Metadata/project_settings.config']).filament_colour,['#FFFFFF']);
  const escapedFiles=unpack(Buffer.from(await context.OpenJsCad.exportPlate3MF([{name:'A&"<B',data:onePart[0].data}]).arrayBuffer()));
  assert(escapedFiles['Metadata/model_settings.config'].includes('A&amp;&quot;&lt;B'));
  console.log('3MF PASS: single assembly, part IDs/names/filament assignments, normalized deduplicated palette.');
})().catch(error=>{console.error(error);process.exitCode=1;});
