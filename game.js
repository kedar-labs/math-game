
(function(){
  const el = {
    op:document.getElementById('op'), start:document.getElementById('btnStart'), reset:document.getElementById('btnReset'),
    q:document.getElementById('q'), ans:document.getElementById('ans'), submit:document.getElementById('btnSubmit'),
    bar:document.getElementById('bar'), board:document.getElementById('board'), img:document.getElementById('img'), msg:document.getElementById('msg'),
    nameArea:document.getElementById('nameArea'), nameLabel:document.getElementById('nameLabel'), name:document.getElementById('name'),
    timerSelect:document.getElementById('timerSelect'), history:document.getElementById('history'), reviewFooter:document.getElementById('reviewFooter')
  };

  const rewardImages = [
    "https://storage.googleapis.com/labubu-math-game-images/Soymilk.jpeg",
    "https://storage.googleapis.com/labubu-math-game-images/CocaCola.jpeg",
    "https://storage.googleapis.com/labubu-math-game-images/Dada.jpeg",
    "https://storage.googleapis.com/labubu-math-game-images/Love.jpg",
    "https://storage.googleapis.com/labubu-math-game-images/Luck.jpg",
    "https://storage.googleapis.com/labubu-math-game-images/SittingPumpkin.jpg"
  ];

  const celebrationSounds = [
    "https://storage.googleapis.com/labubu-math-game-sounds/snd_cheer-98223.mp3",
    "https://storage.googleapis.com/labubu-math-game-sounds/teenage-girl-says-yay-185316.mp3",
    "https://storage.googleapis.com/labubu-math-game-sounds/wow-423653.mp3",
    "https://storage.googleapis.com/labubu-math-game-sounds/tada-fanfare-a-6313.mp3"
  ];

  function playCelebrationSound(){
    const url = celebrationSounds[Math.floor(Math.random()*celebrationSounds.length)];
    const audio = new Audio(url);
    audio.volume = 0.9;
    audio.play().catch(err=>console.log('Audio play blocked:',err));
  }

  let STATE={running:false, secs:10, left:10, timer:null, tiles:[], hiddenIdx:[], removed:0, goal:10, answer:0, imageName:'', cur:{a:0,b:0,sym:'+',ans:0}};

  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  function randIndexCrypto(len){ if(window.crypto&&crypto.getRandomValues){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]%len; } return Math.floor(Math.random()*len); }

  function clearTiles(){ STATE.tiles.forEach(t=>t.remove()); STATE.tiles=[]; STATE.hiddenIdx=[]; STATE.removed=0; el.name.style.opacity=0; }
  function makeTiles(){ clearTiles(); const rows=5, cols=2; for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ const d=document.createElement('div'); d.className='tile'; d.style.left=(c*50)+'%'; d.style.top=(r*20)+'%'; d.style.width='50%'; d.style.height='20%'; el.board.appendChild(d); STATE.tiles.push(d);} } STATE.hiddenIdx=STATE.tiles.map((_,i)=>i); }
  function revealOne(){ if(!STATE.hiddenIdx.length) return; const idx=STATE.hiddenIdx.splice(randIndexCrypto(STATE.hiddenIdx.length),1)[0]; const t=STATE.tiles[idx]; if(!t) return; t.style.opacity=0; setTimeout(()=>t.style.display='none',650); STATE.removed++; if(STATE.removed>=STATE.goal) onRevealed(); }

  function pickRandomImage(){ const url=rewardImages[randIndexCrypto(rewardImages.length)]; const clean=url.split('?')[0]; const withCb=url+(url.includes('?')?'&':'?')+'cb='+Date.now(); el.img.src=withCb; STATE.imageName=clean.split('/').pop().split('.')[0]; }

  function nextQ(){ if(!STATE.running) return; const op=el.op.value; let a=ri(0,10), b=ri(0,10), sym='+', ans=a+b; if(op==='sub'){sym='−';if(a<b){const t=a;a=b;b=t;}ans=a-b;} else if(op==='mul'){sym='×';ans=a*b;} else if(op==='div'){sym='÷';b=ri(1,10);a=b*ri(0,10);ans=a/b;} STATE.answer=ans; STATE.cur={a,b,sym,ans}; el.q.textContent=`${a} ${sym} ${b} = ?`; clearInterval(STATE.timer); STATE.left=parseInt(el.timerSelect.value,10)||10; STATE.secs=STATE.left; tick(); STATE.timer=setInterval(()=>{ STATE.left-=.1; tick(); if(STATE.left<=0){ clearInterval(STATE.timer); el.q.textContent="⏱️ Time's up — press RESET to play again."; STATE.running=false; el.submit.disabled=true; el.ans.disabled=true; showFooter(); addHistory(false, `${a} ${sym} ${b} = ⏱️`, '⏱️', ans); } },100); }
  function tick(){ el.bar.style.width=clamp((STATE.left/STATE.secs)*100,0,100)+'%'; }

  function start(){ softReset(); el.q.textContent='Get ready!'; el.msg.style.opacity=0; el.msg.textContent=''; pickRandomImage(); makeTiles(); STATE.running=true; el.start.disabled=true; el.submit.disabled=false; el.ans.disabled=false; el.ans.value=''; el.ans.focus(); nextQ(); }

  function softReset(){
    clearInterval(STATE.timer);
    STATE.running=false; STATE.left=10; STATE.secs=10; STATE.removed=0; STATE.answer=0;
    STATE.cur={a:0,b:0,sym:'+',ans:0}; STATE.imageName='';
    el.start.disabled=false; el.submit.disabled=true; el.ans.disabled=true; el.ans.value='';
    el.q.textContent='Press Start'; el.msg.textContent=''; el.msg.style.opacity=0; el.name.textContent=''; el.name.style.opacity=0; el.nameArea.style.opacity=0; el.bar.style.width='0%'; el.history.innerHTML='';
    el.reviewFooter.style.opacity=0;
    pickRandomImage(); makeTiles();
  }

  function submit(){ if(!STATE.running) return; const v=parseFloat(el.ans.value); if(!Number.isFinite(v)) return; const {a,b,sym,ans}=STATE.cur; if(v===ans){ addHistory(true, `${a} ${sym} ${b} = ${v}`, null, ans); revealOne(); if(STATE.removed<STATE.goal) nextQ(); } else { el.q.textContent=`Oops — it's ${ans}.`; addHistory(false, `${a} ${sym} ${b} = ${v}`, v, ans); nextQ(); } el.ans.value=''; el.ans.focus(); }

  function onRevealed(){ clearInterval(STATE.timer); STATE.running=false; el.q.textContent='🎉 You revealed the mystery picture!'; el.msg.textContent=''; el.msg.style.opacity=0; el.name.textContent=STATE.imageName||'Mystery picture'; el.name.style.opacity=1; el.nameArea.style.opacity=1; el.submit.disabled=true; el.ans.disabled=true; el.start.disabled=false; playCelebrationSound(); showFooter(); }

  function addHistory(ok,expr,userVal,rightVal){ const card=document.createElement('div'); card.className='hist-card'+(ok?'':' bad'); if(ok){ card.textContent=expr; } else { const wrong=document.createElement('div'); wrong.textContent=expr; card.appendChild(wrong); const right=document.createElement('div'); right.className='right'; right.textContent=`Correct: ${rightVal}`; card.appendChild(right);} el.history.append(card); }

  function showFooter(){
    el.reviewFooter.style.opacity = 1;

  }

  el.start.addEventListener('click',start);
  el.reset.addEventListener('click',softReset);
  el.submit.addEventListener('click',submit);
  el.ans.addEventListener('keydown',e=>{if(e.key==='Enter')submit();});

  window.addEventListener('load',()=>{pickRandomImage();makeTiles();el.history.innerHTML='';el.submit.disabled=true;el.ans.disabled=true;});
})();

