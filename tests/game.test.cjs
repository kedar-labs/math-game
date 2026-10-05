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
function game(rewardIndex=0){
 const els={};for(const [,id]of fs.readFileSync('index.html','utf8').matchAll(/id="([^"]+)"/g))els[id]=new Element();
 els.op.value='add';els.timerSelect.value='20';let now=0,serial=0,plays=0;const timers=new Map();let problem=null;
 const context={document:{getElementById:id=>{assert.ok(els[id],id);return els[id];},createElement:()=>new Element()},window:{crypto:{getRandomValues(a){a[0]=rewardIndex;return a;}},MathHelp:{reset(){problem=null;},setProblem(p){problem={...p};}}},Date:{now:()=>now},Math,Uint32Array,Audio:class{play(){plays++;return Promise.resolve();}pause(){}},setInterval:fn=>{timers.set(++serial,fn);return serial;},clearInterval:id=>timers.delete(id)};
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
test('10 and 20 second timeouts spend three chances before resetting',()=>{
 for(const seconds of [10,20]){const g=game();g.els.timerSelect.value=String(seconds);g.start();for(let i=1;i<=2;i++){g.advance(seconds*1000);assert.equal(g.els.ans.disabled,false);assert.equal(g.els['chances-left'].textContent,`${3-i} ${i===2?'try':'tries'} left`);assert.equal(g.els.history.children.length,i);}g.advance(seconds*1000);assert.equal(g.els.ans.disabled,true);assert.equal(g.els.btnStart.disabled,false);assert.equal(g.timers.size,0);assert.equal(g.els.history.children.length,0);assert.match(g.els.feedback.textContent,/Three chances used/);}
});
test('wrong answers spend chances, correct answers keep them, third miss resets reveal',()=>{
 const g=game();g.start();g.answer(g.problem.ans);g.answer(g.problem.ans+1);assert.equal(g.els.progress.textContent,'1 / 10');assert.equal(g.els['chance-3'].hidden,true);assert.equal(g.els['chances-left'].textContent,'2 tries left');g.answer(g.problem.ans);assert.equal(g.els['chances-left'].textContent,'2 tries left');g.answer(g.problem.ans+1);assert.equal(g.els['chance-2'].hidden,true);g.answer(g.problem.ans+1);assert.equal(g.els.progress.textContent,'0 / 10');assert.equal(g.els.ans.disabled,true);assert.equal(g.els['chance-3'].hidden,false);assert.equal(g.els['chances-left'].textContent,'3 tries left');
});
test('all operation generators preserve original arithmetic ranges',()=>{
 for(const op of ['add','sub','mul','div']){const g=game();g.els.op.value=op;for(let i=0;i<30;i++){g.start();const{a,b,ans}=g.problem;assert.ok(Number.isInteger(ans));if(op==='add')assert.equal(ans,a+b);if(op==='sub'){assert.ok(a>=b);assert.equal(ans,a-b);}if(op==='mul')assert.equal(ans,a*b);if(op==='div'){assert.ok(b>0);assert.equal(ans,a/b);}}}
});
test('blank and invalid answers do not reveal or add history',()=>{const g=game();g.start();g.answer('');g.answer('oops');assert.equal(g.els.history.children.length,0);assert.equal(g.els.progress.textContent,'0 / 10');});
test('original celebration sounds remain unchanged',()=>{const original=JSON.parse(fs.readFileSync('tests/celebration-sounds.json','utf8'));const current=fs.readFileSync('game.js','utf8');assert.deepEqual(current.match(/https:\/\/storage\.googleapis\.com\/[^"\s]+/g),original);});
test('all uploaded squishy rewards load local assets and reveal their matching names',()=>{
 const rewards=[{"src": "assets/rewards/photos/butter.png", "name": "Butter Buddy"}, {"src": "assets/rewards/photos/pink-cat-burger.webp", "name": "Pink Cat Burger"}, {"src": "assets/rewards/photos/chick-trio.webp", "name": "Cozy Chick Trio"}, {"src": "assets/rewards/photos/bear-sundae.webp", "name": "Bear Sundae"}, {"src": "assets/rewards/photos/rainbow-llama.jpg", "name": "Rainbow Llama"}, {"src": "assets/rewards/photos/gorilla.webp", "name": "Stretchy Gorilla"}, {"src": "assets/rewards/photos/cat-burger.webp", "name": "Cheddar Cat Burger"}, {"src": "assets/rewards/photos/carrot.jpeg", "name": "Crunchy Carrot"}, {"src": "assets/rewards/photos/toast.webp", "name": "Happy Toast"}, {"src": "assets/rewards/photos/penguin.jpg", "name": "Penguin Pals"}, {"src": "assets/rewards/photos/rainbow-dumpling.webp", "name": "Rainbow Dumpling"}];
 rewards.forEach(({src,name},index)=>{const g=game(index);g.start();assert.equal(g.els.img.src,src);assert.ok(fs.statSync(src).size>1000);for(let i=0;i<10;i++)g.answer(g.problem.ans);assert.equal(g.els.name.textContent,name);assert.equal(g.els.img.alt,name);});
});
test('fraction and area topics accept exact equivalents and show models',()=>{
 for(const topic of ['fraction-mul','fraction-div','area']){
  const g=game();g.els.op.value=topic;g.start();
  const p=g.problem;assert.ok(p.explanation);assert.equal(g.els['area-model'].hidden,topic==='fraction-div');
  if(topic!=='fraction-div')assert.equal(g.els['area-model'].children.length,p.rows*p.cols);
  g.answer('1/0');assert.equal(g.els.history.children.length,0);
  const [n,d=1]=String(p.answerText||p.ans).split('/').map(Number);g.answer(`${n*2}/${d*2}`);assert.equal(g.els.progress.textContent,'1 / 10');
  g.answer(g.problem.ans+1);assert.match(g.els.history.children[1].className,/bad/);
  g.els.btnReset.fire('click');assert.equal(g.els['area-model'].hidden,true);
 }
});

test('untimed games have no countdown or timeout and still finish and restart',()=>{
 const g=game();g.els.timerSelect.value='0';g.start();
 assert.equal(g.timers.size,0);assert.equal(g.els.timer.hidden,true);assert.equal(g.els['time-left'].textContent,'Unlimited');
 g.advance(24*60*60*1000);g.answer(g.problem.ans+1);assert.equal(g.els.ans.disabled,false);
 for(let i=0;i<10;i++){g.advance(60*60*1000);g.answer(g.problem.ans);}
 assert.equal(g.els.progress.textContent,'10 / 10');assert.equal(g.els.results.hidden,false);
 g.start();assert.equal(g.els.history.children.length,0);assert.equal(g.timers.size,0);
 g.els.btnReset.fire('click');g.els.timerSelect.value='10';g.start();
 assert.equal(g.els.timer.hidden,false);assert.equal(g.timers.size,1);g.advance(10000);assert.equal(g.els.ans.disabled,false);assert.equal(g.els['chances-left'].textContent,'2 tries left');
});

test('division bars share a whole and their shaded ratio matches the answer',()=>{
 const g=game();g.els.op.value='fraction-div';
 for(let i=0;i<40;i++){
  g.start();assert.equal(g.els['division-guide'].hidden,false);
  const a=g.els['division-have'].children,b=g.els['division-group'].children;
  assert.equal(a.length,b.length);
  const n=a.filter(x=>x.className.includes('dark')).length,d=b.filter(x=>x.className.includes('light')).length;
  assert.ok(Math.abs(n/d-g.problem.ans)<1e-10);
 }
 g.els.btnReset.fire('click');assert.equal(g.els['division-guide'].hidden,true);
 g.els.op.value='add';g.start();assert.equal(g.els['division-guide'].hidden,true);
});

test('beginner fraction division uses small unit fractions and resets its diagram',()=>{
 const g=game();g.els.op.value='fraction-easy';
 for(let i=0;i<40;i++){
  g.start();const p=g.problem;assert.equal(p.ans,p.a/p.b);assert.equal(g.els['easy-guide'].hidden,false);
  assert.ok(g.els['easy-bars'].children.length>=1);
  if(p.a<1){assert.ok(p.b===2||p.b===3);assert.ok(p.answerText.startsWith('1/'));}
  else {assert.ok(p.a===2||p.a===3);assert.ok(Number.isInteger(p.ans));}
  g.answer(p.answerText);assert.equal(g.els.progress.textContent,'1 / 10');
 }
 g.els.btnReset.fire('click');assert.equal(g.els['easy-guide'].hidden,true);
});
