/* A separate guided demo: never changes game state or calls the tutor API. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const steps=[
    ['.settings','Make it your game','Choose a topic. Pick No timer when you want time to think, or try a 10- or 20-second challenge.'],
    ['.right-panel','Try a little math','Type your answer, then press Enter. Fractions like 1/4 work too. Try this sample below—it won’t affect your game.'],
    ['.left-panel','Reveal your surprise','Each correct answer uncovers one tile. Get ten correct answers to reveal your squishy! A wrong answer goes into your answer trail so you can learn from it.'],
    ['.math-help','Ask me for help','Explain this problem asks about the current question. Or type your own math question and press Send question—even before starting a game. You need your family access code to use AI Math Help. Ask a parent for the code and enter it at the bottom of the Math Help panel.'],
    ['.history-section','Every try helps you learn','Your answer trail shows what you tried and the correct answers. Reset gives you a fresh start. Start game after a win also clears the old round. Ready? Close this guide and choose your topic!']
  ];
  let index=0,target=null,previousFocus=null;
  function show(){
    target?.classList.remove('tour-highlight');
    const [selector,title,copy]=steps[index];target=document.querySelector(selector);
    target.classList.add('tour-highlight');target.scrollIntoView({block:'center',behavior:'auto'});
    $('tour-count').textContent=`${index+1} OF ${steps.length}`;$('tour-title').textContent=title;$('tour-text').textContent=copy;
    $('tour-back').disabled=index===0;$('tour-next').textContent=index===steps.length-1?'Let’s play!':'Next →';
    $('tour-sample').hidden=index!==1;
  }
  function close(){target?.classList.remove('tour-highlight');$('tour').hidden=true;previousFocus?.focus();}
  $('tour-open').addEventListener('click',()=>{previousFocus=document.activeElement;index=0;$('tour-answer').value='';$('tour-result').textContent='';$('tour-piece').hidden=true;$('tour').hidden=false;show();$('tour-close').focus();});
  $('tour-close').addEventListener('click',close);
  $('tour-back').addEventListener('click',()=>{if(index>0){index--;show();}});
  $('tour-next').addEventListener('click',()=>{if(index===steps.length-1)close();else{index++;show();}});
  $('tour-check').addEventListener('click',()=>{const ok=$('tour-answer').value.trim()==='5';$('tour-result').textContent=ok?'Yes! 2 + 3 = 5.':'Start at 2 and count three more: 3, 4, 5. Try again.';$('tour-piece').hidden=!ok;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('tour').hidden)close();});
})();
