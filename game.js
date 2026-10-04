/* Math Game: no dependencies or server required. */
(function () {
  'use strict';
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
    const url = rewardImages[randomIndex(rewardImages.length)];
    state.imageName = url.split('/').pop().split('.')[0];
    $('img').hidden = true;
    $('board-placeholder').hidden = false;
    $('image-status').hidden = true;
    $('img').alt = 'Mystery picture';
    $('img').src = url;
  }
  $('img').addEventListener('load', () => { $('img').hidden = false; $('board-placeholder').hidden = true; });
  $('img').addEventListener('error', () => { $('image-status').textContent = 'The picture could not load. You can still practice, or reset to try another.'; $('image-status').hidden = false; });
  function setTime(left) {
    const remaining = Math.max(0,left);
    $('bar').style.width = `${Math.min(100,remaining/state.seconds*100)}%`;
    $('time-left').textContent = `${Math.ceil(remaining)}s`;
    $('timer').setAttribute('aria-valuemax',state.seconds);
    $('timer').setAttribute('aria-valuenow',Math.ceil(remaining));
  }
  function stopTimer() { clearInterval(state.timer); state.timer = null; }
  function history(ok, value, timeout=false) {
    const {a,b,sym,ans} = state.problem;
    const card = document.createElement('div');
    card.className = 'hist-card'+(ok?'':' bad');
    const expression = document.createElement('div');
    expression.textContent = `${ok?'✓':timeout?'◷':'✕'} ${a} ${sym} ${b} = ${timeout?'Time’s up':value}`;
    card.appendChild(expression);
    if (!ok) { const correction = document.createElement('div'); correction.className='right'; correction.textContent=`Correct answer: ${ans}`; card.appendChild(correction); }
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
  function nextQuestion() {
    let a=randomInt(0,10),b=randomInt(0,10),sym='+',ans=a+b;
    if ($('op').value==='sub') { sym='−'; if(a<b) [a,b]=[b,a]; ans=a-b; }
    if ($('op').value==='mul') { sym='×'; ans=a*b; }
    if ($('op').value==='div') { sym='÷'; b=randomInt(1,10); a=b*randomInt(0,10); ans=a/b; }
    state.problem={a,b,sym,ans};
    window.MathHelp.setProblem(state.problem);
    $('q').textContent=`${a} ${sym} ${b} = ?`;
    $('round-label').textContent='ONE PROBLEM AT A TIME';
    state.seconds=Number($('timerSelect').value);
    state.deadline=Date.now()+state.seconds*1000;
    stopTimer(); setTime(state.seconds);
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
    $('results').hidden=true; $('nameArea').hidden=true; $('name').textContent='';
    $('history').replaceChildren(); $('history-empty').hidden=false; $('history-count').textContent='A fresh start';
    $('board-note').textContent='Every correct answer reveals a tile.';
    state.seconds=Number($('timerSelect').value); setTime(0); $('time-left').textContent='—';
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
    const value=Number($('ans').value);
    if (!Number.isFinite(value)) return;
    const ok=value===state.problem.ans;
    if (ok) state.correct++;
    history(ok,value);
    if(ok) {
      const index=state.remaining.splice(randomIndex(state.remaining.length),1)[0];
      state.tiles[index].classList.add('revealed'); progress();
      $('feedback').textContent='Nice work! One more piece of the mystery.'; $('feedback').className='feedback good';
      if(state.correct===10) celebrate(); else nextQuestion();
    } else {
      $('feedback').textContent=`That one was ${state.problem.ans}. Let’s try the next problem.`; $('feedback').className='feedback bad';
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
