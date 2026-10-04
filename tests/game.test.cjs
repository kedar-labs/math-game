const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
class Element {
 constructor(){this.children=[];this.style={};this.hidden=false;this.disabled=false;this.value='';this.textContent='';this.listeners={};this.className='';this.classList={add:c=>this.className+=' '+c};}
 setAttribute(k,v){this[k]=v;}
 appendChild(e){this.children.push(e);e.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);}
 replaceChildren(){this.children=[];}
 addEventListener(n,fn){this.listeners[n]=fn;}
 focus(){}
 fire(n){this.listeners[n]?.({preventDefault(){}});}
}
function game(){
 const els={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g))els[id]=new Element();
 els.op.value='add';els.timerSelect.value='20';let now=0,serial=0,plays=0;const timers=new Map();let problem=null;
 const context={document:{getElementById:id=>{assert.ok(els[id],id);return els[id];},createElement:()=>new Element()},window:{MathHelp:{reset(){problem=null;},setProblem(p){problem={...p};}}},Date:{now:()=>now},Math,Uint32Array,Audio:class{play(){plays++;return Promise.resolve();}pause(){}},setInterval:fn=>{timers.set(++serial,fn);return serial;},clearInterval:id=>timers.delete(id)};
 vm.runInNewContext(fs.readFileSync('game.js','utf8'),context);
 return {els,timers,get problem(){return problem;},get plays(){return plays;},start(){els.btnStart.fire('click');},answer(value){els.ans.value=String(value);els['answer-form'].fire('submit');},advance(ms){now+=ms;for(const fn of [...timers.values()])fn();}};
}
test('ten correct answers reveal picture and results; Start fully clears old round',()=>{
 const g=game();g.start();for(let i=0;i<10;i++)g.answer(g.problem.ans);
 assert.equal(g.els.progress.textContent,'10 / 10');assert.equal(g.els.results.hidden,false);assert.equal(g.els.nameArea.hidden,false);assert.equal(g.els.history.children.length,10);assert.equal(g.plays,1);assert.equal(g.timers.size,0);
 g.start();assert.equal(g.els.history.children.length,0);assert.equal(g.els.progress.textContent,'0 / 10');assert.equal(g.els.results.hidden,true);assert.equal(g.els.name.textContent,'');assert.equal(g.els.board.children.length,10);assert.equal(g.timers.size,1);
});
test('wrong answer stays covered, records correction, starts next question',()=>{
 const g=game();g.start();g.answer(g.problem.ans+1);assert.equal(g.els.progress.textContent,'0 / 10');assert.match(g.els.history.children[0].className,/bad/);assert.match(g.els.history.children[0].children[1].textContent,/Correct answer/);assert.equal(g.timers.size,1);
});
test('10 and 20 second timeout stops input; reset clears and restores Start',()=>{
 for(const seconds of [10,20]){const g=game();g.els.timerSelect.value=String(seconds);g.start();g.advance(seconds*1000-1);assert.equal(g.els.ans.disabled,false);g.advance(1);assert.equal(g.els.ans.disabled,true);assert.equal(g.els.btnStart.disabled,true);assert.equal(g.els.nameArea.hidden,true);assert.equal(g.els.results.hidden,false);assert.equal(g.els.history.children.length,1);g.els.btnReset.fire('click');assert.equal(g.els.btnStart.disabled,false);assert.equal(g.els.history.children.length,0);assert.equal(g.timers.size,0);}
});
test('all operation generators preserve original arithmetic ranges',()=>{
 for(const op of ['add','sub','mul','div']){const g=game();g.els.op.value=op;for(let i=0;i<30;i++){g.start();const{a,b,ans}=g.problem;assert.ok(Number.isInteger(ans));if(op==='add')assert.equal(ans,a+b);if(op==='sub'){assert.ok(a>=b);assert.equal(ans,a-b);}if(op==='mul')assert.equal(ans,a*b);if(op==='div'){assert.ok(b>0);assert.equal(ans,a/b);}}}
});
test('blank and invalid answers do not reveal or add history',()=>{const g=game();g.start();g.answer('');g.answer('oops');assert.equal(g.els.history.children.length,0);assert.equal(g.els.progress.textContent,'0 / 10');});
test('all original media URLs remain unchanged',()=>{const original=JSON.parse(fs.readFileSync('tests/media-urls.json','utf8'));const current=fs.readFileSync('game.js','utf8');const urls=s=>s.match(/https:\/\/storage\.googleapis\.com\/[^"\s]+/g);assert.deepEqual(urls(current),original);});
