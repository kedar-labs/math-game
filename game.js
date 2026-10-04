/* Math Game: no dependencies or server required. */
(function () {
  'use strict';
  const rewardImages = [
    {"src": "assets/rewards/dumpling.png", "name": "Sunny Dumpling"},
    {"src": "assets/rewards/strawberry.png", "name": "Berry Sweet"},
    {"src": "assets/rewards/cheese-cube.png", "name": "Cheddar Charm"},
    {"src": "assets/rewards/cat-paw.png", "name": "Peachy Paw"},
    {"src": "assets/rewards/butterfly.png", "name": "Luna Butterfly"},
    {"src": "assets/rewards/glitter-cube.png", "name": "Cosmic Cube"}
  ];

  const celebrationSounds = [
    "https://storage.googleapis.com/labubu-math-game-sounds/snd_cheer-98223.mp3",
    "https://storage.googleapis.com/labubu-math-game-sounds/teenage-girl-says-yay-185316.mp3",
    "https://storage.googleapis.com/labubu-math-game-sounds/wow-423653.mp3",
    "https://storage.googleapis.com/labubu-math-game-sounds/tada-fanfare-a-6313.mp3"
  ];

  const $ = id => document.getElementById(id);
  const state = {running:false, timer:null, deadline:0, seconds:20, tiles:[], remaining:[], correct:0, attempts:0, problem:null, imageName:'', audio:null};
  const randomInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  function randomIndex(length) {
    if (window.crypto?.getRandomValues) return window.crypto.getRandomValues(new Uint32Array(1))[0] % length;
    return randomInt(0,length-1);
  }
  function progress() {
    $('progress').textContent = `${state.correct} / 10`;
    Array.from($('progress-dots').children).forEach((dot,i) => dot.className = i < state.correct ? 'done' : '');
  }
  function coverPicture() {
    state.tiles.forEach(tile => tile.remove());
    state.tiles = [];
    state.remaining = [];
    for (let i=0;i<10;i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.setAttribute('aria-hidden','true');
      tile.textContent = '?';
      Object.assign(tile.style,{left:`${i%2*50}%`,top:`${Math.floor(i/2)*20}%`,width:'50%',height:'20%'});
      $('board').appendChild(tile);
      state.tiles.push(tile);
      state.remaining.push(i);
    }
    progress();
  }
  function pickPicture() {
    const reward = rewardImages[randomIndex(rewardImages.length)];
    state.imageName = reward.name;
    $('img').hidden = true;
    $('board-placeholder').hidden = false;
    $('image-status').hidden = true;
    $('img').alt = 'Mystery picture';
    $('img').src = reward.src;
  }
  $('img').addEventListener('load', () => { $('img').hidden = false; $('board-placeholder').hidden = true; });
  $('img').addEventListener('error', () => { $('image-status').textContent = 'The picture could not load. You can still practice, or reset to try another.'; $('image-status').hidden = false; });
  function setTime(left) {
    const remaining = Math.max(0,left);
    $('bar').style.width = `${Math.min(100,(state.seconds ? remaining/state.seconds*100 : 0))}%`;
    $('time-left').textContent = `${Math.ceil(remaining)}s`;
    $('timer').setAttribute('aria-valuemax',state.seconds);
    $('timer').setAttribute('aria-valuenow',Math.ceil(remaining));
  }
  function updateTimerDisplay() {
    const untimed=state.seconds===0;
    $('timer').hidden=untimed;
    $('timer-note').textContent=untimed?'Take your time. There’s no countdown.':'Out of time? Press Reset for a fresh start.';
    if(untimed) $('time-left').textContent='Unlimited';
  }
  function stopTimer() { clearInterval(state.timer); state.timer = null; }
  function history(ok, value, timeout=false) {
    const {a,b,sym,ans} = state.problem;
    const card = document.createElement('div');
    card.className = 'hist-card'+(ok?'':' bad');
    const expression = document.createElement('div');
    expression.textContent = `${ok?'✓':timeout?'◷':'✕'} ${state.problem.expression || `${a} ${sym} ${b}`} = ${timeout?'Time’s up':value}`;
    card.appendChild(expression);
    if (!ok) { const correction = document.createElement('div'); correction.className='right'; correction.textContent=`Correct answer: ${state.problem.answerText || ans}`; card.appendChild(correction); }
    $('history').appendChild(card);
    state.attempts++;
    $('history-empty').hidden = true;
    $('history-count').textContent = `${state.correct} correct · ${state.attempts} ${state.attempts===1?'try':'tries'}`;
  }
  function timeout() {
    stopTimer(); state.running=false; setTime(0);
    $('q').textContent = 'Time’s up!';
    $('round-label').textContent = 'A FRESH START AWAITS';
    $('feedback').textContent = 'Press Reset, then try again. You’ve got this.';
    $('feedback').className = 'feedback';
    $('ans').disabled = true; $('btnSubmit').disabled = true;
    $('results').hidden = false; $('nameArea').hidden = true;
    history(false,null,true);
  }

  function fraction(n,d) {
    const gcd=(a,b)=>b?gcd(b,a%b):a;
    const g=gcd(n,d); return d/g===1 ? String(n/g) : `${n/g}/${d/g}`;
  }
  function enrichProblem(topic) {
    const model=$('area-model'); model.replaceChildren(); model.hidden=true; $('model-guide').hidden=true; $('division-guide').hidden=true; $('easy-guide').hidden=true;

    if(topic==='fraction-easy') {
      const denominator=randomInt(2,4), amount=randomInt(2,3), sharing=randomInt(0,1)===0;
      const p=sharing
        ? {a:1/denominator,b:amount,sym:'÷',ans:1/(denominator*amount),answerText:`1/${denominator*amount}`,expression:`1/${denominator} ÷ ${amount}`,
           explanation:`Share 1/${denominator} equally between ${amount} people.\n\nSplit that shaded piece into ${amount} smaller pieces. Each person gets one.\n\nThe whole now has ${denominator*amount} equal pieces, so each person gets 1/${denominator*amount}.`}
        : {a:amount,b:1/denominator,sym:'÷',ans:amount*denominator,answerText:String(amount*denominator),expression:`${amount} ÷ 1/${denominator}`,
           explanation:`How many pieces of size 1/${denominator} fit into ${amount} wholes?\n\nEach whole has ${denominator} pieces. Count the pieces in all ${amount} bars.\n\n${amount} × ${denominator} = ${amount*denominator} pieces.`};
      state.problem=p;
      $('easy-guide').hidden=false;
      $('easy-title').textContent=sharing?`Share 1/${denominator} equally between ${amount} people`:`Cut ${amount} wholes into pieces of size 1/${denominator}`;
      $('easy-task').textContent=sharing?'Dark purple is one person’s share. What fraction of the whole is it?':'Each bar is one whole. Count all the purple pieces.';
      const bars=$('easy-bars');bars.replaceChildren();
      for(let r=0;r<(sharing?1:amount);r++){
        const bar=document.createElement('div');bar.className=sharing?'fraction-bar sharing-bar':'fraction-bar whole-bar';
        const parts=sharing?denominator*amount:denominator;
        bar.style.gridTemplateColumns=`repeat(${parts},minmax(0,1fr))`;
        bar.setAttribute('role','img');bar.setAttribute('aria-label',sharing?`One whole with ${parts} equal parts. ${amount} parts are shaded; one dark part is one person's share.`:`One whole split into ${parts} purple pieces.`);
        for(let group=0;group<denominator;group++){
          const outline=document.createElement('div');outline.className='fraction-section';outline.style.gridTemplateColumns=`repeat(${sharing?amount:1},minmax(0,1fr))`;
          for(let piece=0;piece<(sharing?amount:1);piece++){const cell=document.createElement('span');cell.className=`bar-piece ${sharing?(group===0?(piece===0?'dark':'light'):''):'dark'}`;outline.appendChild(cell);}
          bar.appendChild(outline);
        }
        bar.style.gridTemplateColumns=`repeat(${denominator},minmax(0,1fr))`;
        bars.appendChild(bar);
      }
      return;
    }
    if (!['fraction-mul','fraction-div','area'].includes(topic)) return;
    const d=randomInt(3,6), e=randomInt(3,6), n=randomInt(2,d-1), m=randomInt(2,e-1);
    let p;
    if(topic==='area') {
      const a=randomInt(2,6), b=randomInt(2,6);
      p={a,b,sym:'×',ans:a*b,expression:`${a} × ${b}`,prompt:`${a} by ${b} rectangle: area = ?`,explanation:`Each of the ${a} rows has ${b} unit squares. Multiply ${a} × ${b} = ${a*b} square units.`,rows:a,cols:b};
    } else {
      const divide=topic==='fraction-div';
      const numerator=divide?n*e:n*m, denominator=divide?d*m:d*e;
      p={a:n/d,b:m/e,sym:divide?'÷':'×',ans:numerator/denominator,answerText:fraction(numerator,denominator),expression:`${n}/${d} ${divide?'÷':'×'} ${m}/${e}`};
      p.explanation=divide?`Dividing by ${m}/${e} asks how many groups of that size fit. Multiply by its reciprocal: ${n}/${d} × ${e}/${m} = ${p.answerText}. Check by multiplying your answer by ${m}/${e}.`:`Shade ${n} of ${d} columns and ${m} of ${e} rows. The overlap covers ${n*m} of the ${d*e} equal parts: ${n}/${d} × ${m}/${e} = ${p.answerText}.`;
      if(divide) {
        const gcd=(a,b)=>b?gcd(b,a%b):a;
        const total=d*e/gcd(d,e), have=n*total/d, group=m*total/e;
        $('division-guide').hidden=false;
        $('division-scale').textContent=`Each full bar represents 1, split into ${total} equal pieces.`;
        $('division-have-label').textContent=`Amount we have: ${n}/${d} = ${have}/${total}`;
        $('division-group-label').textContent=`One group: ${m}/${e} = ${group}/${total}`;
        for(const [id,count,tone] of [['division-have',have,'dark'],['division-group',group,'light']]) {
          const bar=$(id);bar.replaceChildren();bar.style.gridTemplateColumns=`repeat(${total},minmax(0,1fr))`;
          bar.setAttribute('role','img');bar.setAttribute('aria-label',`${count} of ${total} equal pieces shaded ${tone} purple`);
          for(let i=0;i<total;i++){const cell=document.createElement('span');cell.className=`bar-piece ${i<count?tone:''}`;bar.appendChild(cell);}
        }
        p.explanation=`Let’s solve ${n}/${d} ÷ ${m}/${e}, one step at a time.\n\n1. Keep ${n}/${d}.\n2. Change ÷ to ×.\n3. Flip ONLY the second fraction: ${m}/${e} becomes ${e}/${m}.\n\nNow multiply the top numbers and the bottom numbers:\n${n}/${d} × ${e}/${m} = (${n} × ${e}) / (${d} × ${m}) = ${n*e}/${d*m}.\n\n${fraction(n*e,d*m)===`${n*e}/${d*m}`?`Answer: ${p.answerText}.`:`Simplify ${n*e}/${d*m} to get ${p.answerText}.`}`;
      }
      if(!divide)Object.assign(p,{rows:e,cols:d,shadeRows:m,shadeCols:n});
    }
    state.problem=p;
    if(p.rows){
      $('model-guide').hidden=false;
      const fractions=topic==='fraction-mul';
      $('model-title').textContent=fractions?'The whole square represents 1':'Each small square is 1 square unit';
      $('model-columns').textContent=fractions?`${p.shadeCols}/${p.cols} across → (${p.shadeCols} of ${p.cols} columns)`:`${p.cols} columns →`;
      $('model-rows').textContent=fractions?`${p.shadeRows}/${p.rows} down ↓`:`${p.rows} rows ↓`;
      $('model-key').textContent=fractions?'Light purple = selected rows or columns · Dark purple = overlap':'';
      $('model-task').textContent=fractions?'Count the dark purple squares. What fraction of ALL the small squares is dark purple?':'Count the squares, or multiply rows × columns.';
      model.style.aspectRatio=fractions?'1':`${p.cols} / ${p.rows}`;
      model.hidden=false;model.style.gridTemplateColumns=`repeat(${p.cols}, 1fr)`;
      model.setAttribute('role','img');model.setAttribute('aria-label',topic==='area'?`${p.rows} rows and ${p.cols} columns of unit squares`:`A unit square divided into ${p.rows} rows and ${p.cols} columns; ${p.shadeRows} rows and ${p.shadeCols} columns shaded light purple. Dark purple shows their overlap.`);
      for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++){
        const cell=document.createElement('span');cell.className=topic==='area'?'model-cell overlap':`model-cell ${r<p.shadeRows?(c<p.shadeCols?'overlap':'row-shade'):(c<p.shadeCols?'col-shade':'')}`;model.appendChild(cell);
      }
    }
  }
  function nextQuestion() {
    let a=randomInt(0,10),b=randomInt(0,10),sym='+',ans=a+b;
    if ($('op').value==='sub') { sym='−'; if(a<b) [a,b]=[b,a]; ans=a-b; }
    if ($('op').value==='mul') { sym='×'; ans=a*b; }
    if ($('op').value==='div') { sym='÷'; b=randomInt(1,10); a=b*randomInt(0,10); ans=a/b; }
    state.problem={a,b,sym,ans};
    enrichProblem($('op').value);
    window.MathHelp.setProblem(state.problem);
    $('q').textContent=state.problem.prompt || `${state.problem.expression || `${a} ${sym} ${b}`} = ?`;
    $('round-label').textContent='ONE PROBLEM AT A TIME';
    state.seconds=Number($('timerSelect').value);
    state.deadline=state.seconds ? Date.now()+state.seconds*1000 : Infinity;
    stopTimer(); setTime(state.seconds);
    updateTimerDisplay();
    if (!state.seconds) return;
    state.timer=setInterval(() => {const left=(state.deadline-Date.now())/1000; setTime(left); if(left<=0) timeout();},100);
  }
  function celebrate() {
    stopTimer(); state.running=false;
    $('q').textContent='Mystery solved!';
    $('round-label').textContent='TEN OUT OF TEN';
    $('feedback').textContent='Look what a little persistence can do.';
    $('feedback').className='feedback good';
    $('ans').disabled=true; $('btnSubmit').disabled=true; $('btnStart').disabled=false;
    $('name').textContent=state.imageName || 'Mystery picture';
    $('img').alt=state.imageName || 'Revealed picture';
    $('results').hidden=false; $('nameArea').hidden=false;
    $('board-note').textContent='You did it! All ten tiles revealed.';
    state.audio = new Audio(celebrationSounds[randomIndex(celebrationSounds.length)]);
    state.audio.volume=.9;
    state.audio.play().catch(() => {});
  }
  function reset() {
    stopTimer();
    if (state.audio) {state.audio.pause(); state.audio=null;}
    Object.assign(state,{running:false,correct:0,attempts:0,problem:null});
    $('btnStart').disabled=false; $('ans').disabled=true; $('btnSubmit').disabled=true;
    $('ans').value=''; $('q').textContent='Ready to reveal?';
    $('round-label').textContent='READY WHEN YOU ARE';
    $('feedback').textContent='Choose your settings, then press Start game.'; $('feedback').className='feedback';
    $('area-model').hidden=true; $('model-guide').hidden=true; $('division-guide').hidden=true; $('easy-guide').hidden=true;
    $('results').hidden=true; $('nameArea').hidden=true; $('name').textContent='';
    $('history').replaceChildren(); $('history-empty').hidden=false; $('history-count').textContent='A fresh start';
    $('board-note').textContent='Every correct answer reveals a tile.';
    state.seconds=Number($('timerSelect').value); setTime(0); $('time-left').textContent='—'; updateTimerDisplay();
    window.MathHelp.reset();
    pickPicture(); coverPicture();
  }
  function start() {
    reset(); state.running=true;
    $('btnStart').disabled=true; $('ans').disabled=false; $('btnSubmit').disabled=false;
    $('feedback').textContent='Take a breath. You’ve got this.';
    nextQuestion(); $('ans').focus();
  }
  function submit(event) {
    event.preventDefault();
    if (!state.running) return;
    if (Date.now()>=state.deadline) {timeout();return;}
    if (!$('ans').value.trim()) return;
    const raw=$('ans').value.trim();
    const parts=raw.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    const value=parts ? (Number(parts[2]) ? Number(parts[1])/Number(parts[2]) : NaN) : (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)?Number(raw):NaN);
    if (!Number.isFinite(value)) return;
    const ok=Math.abs(value-state.problem.ans)<1e-10;
    if (ok) state.correct++;
    history(ok,raw);
    if(ok) {
      const index=state.remaining.splice(randomIndex(state.remaining.length),1)[0];
      state.tiles[index].classList.add('revealed'); progress();
      $('feedback').textContent='Nice work! One more piece of the mystery.'; $('feedback').className='feedback good';
      if(state.correct===10) celebrate(); else nextQuestion();
    } else {
      $('feedback').textContent=`Previous question: ${state.problem.expression || `${state.problem.a} ${state.problem.sym} ${state.problem.b}`} = ${state.problem.answerText || state.problem.ans}. Try this new one.`; $('feedback').className='feedback bad';
      nextQuestion();
    }
    $('ans').value=''; if(state.running) $('ans').focus();
  }
  for(let i=0;i<10;i++) $('progress-dots').appendChild(document.createElement('span'));
  $('btnStart').addEventListener('click',start);
  $('btnReset').addEventListener('click',reset);
  $('answer-form').addEventListener('submit',submit);
  reset();
})();
