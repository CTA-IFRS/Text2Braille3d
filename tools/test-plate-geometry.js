/* Computational CSG checks; HTTP/Worker and physical checks are separate. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={console,OpenJsCad:{log:function(){}}}; vm.createContext(context);
vm.runInContext(fs.readFileSync('js/csg.js','utf8'),context);
vm.runInContext(fs.readFileSync('jscad/braille.jscad','utf8'),context);
function run(params){return context.main(Object.assign({resolution:8},params));}
function volume(solid){let sum=0;solid.polygons.forEach(p=>{let a=p.vertices[0].pos;for(let i=1;i<p.vertices.length-1;i++)sum+=a.dot(p.vertices[i].pos.cross(p.vertices[i+1].pos))/6;});return Math.abs(sum);}
if(process.argv.includes('--baseline-only') && !process.env.T2B_BASELINE_JSCAD) throw new Error('Defina T2B_BASELINE_JSCAD com o snapshot anterior.');
// A snapshot from before the change can be supplied to compare unchanged Braille cases.
if(process.env.T2B_BASELINE_JSCAD) {
  const previous={console,OpenJsCad:{log:function(){}}}; vm.createContext(previous);
  vm.runInContext(fs.readFileSync('js/csg.js','utf8'),previous);
  vm.runInContext(fs.readFileSync(process.env.T2B_BASELINE_JSCAD,'utf8'),previous);
  const defaults={}; previous.getParameterDefinitions().forEach(d=>defaults[d.name]=d.initial);
  for(const text of ['Olá Mundo','AÇÃO','Ação\nB8'])for(const upper of [false,true]) {
    const params=Object.assign({},defaults,{text,upper,resolution:8,stands:false});
    const before=previous.main(Object.assign({},params)),after=run(params);
    const bb=before.getBounds(),ab=after.getBounds();
    for(let b=0;b<2;b++)for(const axis of ['x','y','z'])assert(Math.abs(bb[b][axis]-ab[b][axis])<1e-6,'bounds regression');
    assert(Math.abs(volume(before)-volume(after))<1e-5,'volume regression');
    assert.strictEqual(before.polygons.length,after.polygons.length,'polygon regression');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(previous.characters)),JSON.parse(JSON.stringify(context.characters)),'Braille table regression');
    console.log('BASELINE PASS',JSON.stringify({text,upper,polygons:after.polygons.length,bounds:ab.map(v=>[v.x,v.y,v.z])}));
  }
}
if(process.argv.includes('--baseline-only')) process.exit(0);
function checkParts(model){
  model.parts.forEach(p=>assert(p.data.polygons.length,'empty '+p.name));
  for(let i=0;i<model.parts.length;i++)for(let j=i+1;j<model.parts.length;j++)
    assert(volume(model.parts[i].data.intersect(model.parts[j].data))<1e-5,'overlap');
  let union=new context.CSG(); model.parts.forEach(p=>union=union.union(p.data));
  assert(Math.abs(volume(union)-volume(model))<1e-4,'part union volume');
}
let baseline=run({resolution:16});checkParts(baseline);
assert.strictEqual(baseline.polygons.length,3754,'legacy baseline polygons');
console.log('default',baseline.polygons.length,baseline.getBounds().map(v=>[v.x,v.y,v.z]));
for(let align of ['left','center','right']){
 let m=run({text:align==='left'?'Olá\nB8':'O',visual_text:true,letter_align:align,stands:false});checkParts(m);
 let text=m.parts.find(p=>p.name==='text').data,dots=m.parts.find(p=>p.name==='dots').data;
 assert(Math.abs(text.getBounds()[0].z-dots.getBounds()[1].z-3)<1e-5,'measured text/Braille gap');
 console.log('visual',align,m.polygons.length,m.plateInfo);
}
for(let side of ['left','right','top','bottom'])checkParts(run({ear_enabled:true,ear_side:side,stands:false,reference_corner:false}));
for(let size of ['M2','M3','M4','M5','M6'])for(let head of ['none','counterbore','countersink'])checkParts(run({screws_enabled:true,screw_size:size,screw_head:head,screw_head_diameter:10,plate_margin:20,screw_edge:7,reference_corner:false,stands:false}));
for(let side of ['left','right','top','bottom']) {
 const params={ear_enabled:true,ear_side:side,stands:false,reference_corner:false};
 const plain=run(params);
 for(const config of [{ear_chamfer_enabled:true},{ear_joint_chamfer_enabled:true},{ear_chamfer_enabled:true,ear_joint_chamfer_enabled:true}]) {
  const model=run(Object.assign({},params,config));checkParts(model);
  assert.deepStrictEqual(model.plateInfo,plain.plateInfo);
  const delta=volume(model)-volume(plain), expected=config.ear_chamfer_enabled?(config.ear_joint_chamfer_enabled?6:-2):8;
  assert(Math.abs(delta-expected)<1e-5,'chamfer volume');
 }
}
assert.throws(()=>run({ear_enabled:true,ear_chamfer_enabled:true,ear_chamfer:6}));
assert.throws(()=>run({ear_enabled:true,ear_joint_chamfer_enabled:true,ear_joint_chamfer:10}));
checkParts(run({plate_margin:0,stands:false}));
assert.throws(()=>run({text:'  \n '}));assert.throws(()=>run({text:'🙂'}));
assert.throws(()=>run({screws_enabled:true,plate_margin:0}));
assert.throws(()=>run({ear_enabled:true,ear_hole:12}));
assert.throws(()=>run({screws_enabled:true,screw_head:'counterbore',screw_head_depth:2}));
assert.deepStrictEqual(run({text:'Olá\r\nMundo'}).plateInfo,run({text:'Olá\nMundo'}).plateInfo);
console.log('GEOMETRY PASS: parts, features, rejected collisions and invalid values.');
