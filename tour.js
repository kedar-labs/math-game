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
  const speech=window.speechSynthesis;
  let utterance=null;
  function stopReading(){
    if(utterance){utterance.onend=null;utterance.onerror=null;speech.cancel();utterance=null;}
    $('tour-read').textContent='▶';$('tour-read').setAttribute('aria-label','Read aloud');$('tour-read').title='Read aloud';$('tour-read').setAttribute('aria-pressed','false');
  }
  if(!speech||!window.SpeechSynthesisUtterance){
    $('tour-read').hidden=true;$('tour-voice-note').hidden=false;
    $('tour-voice-note').textContent='Read aloud isn’t available in this browser.';
  }
  $('tour-read').addEventListener('click',()=>{
    if(utterance){stopReading();return;}
    const text=steps[index][1]+'. '+steps[index][2]+(index===1?' Practice only: two plus three equals what?':'');
    const reading=new window.SpeechSynthesisUtterance(text);
    const voices=speech.getVoices().filter(voice=>/^en(?:-|_)/i.test(voice.lang));
    const preferred=['Aria','Jenny','Google US English','Samantha','Karen','Moira','Tessa','Ava','Zira'];
    reading.voice=preferred.map(name=>voices.find(voice=>voice.name.includes(name))).find(Boolean)||voices.find(voice=>/natural|enhanced|premium/i.test(voice.name))||voices.find(voice=>voice.default)||voices[0]||null;
    reading.lang=reading.voice?.lang||'en-US';reading.pitch=1;reading.rate=1;
    reading.onend=()=>{if(utterance===reading)stopReading();};
    reading.onerror=()=>{if(utterance===reading){stopReading();$('tour-voice-note').hidden=false;$('tour-voice-note').textContent='Couldn’t play the voice. Try Read aloud again.';}};
    $('tour-voice-note').hidden=true;utterance=reading;
    $('tour-read').textContent='■';$('tour-read').setAttribute('aria-label','Stop reading');$('tour-read').title='Stop reading';$('tour-read').setAttribute('aria-pressed','true');
    speech.speak(reading);
  });
  window.addEventListener('pagehide',stopReading);
  function show(){
    stopReading();
    target?.classList.remove('tour-highlight');
    const [selector,title,copy]=steps[index];target=document.querySelector(selector);
    target.classList.add('tour-highlight');target.scrollIntoView({block:'center',behavior:'auto'});
    $('tour-count').textContent=`${index+1} OF ${steps.length}`;$('tour-title').textContent=title;$('tour-text').textContent=copy;
    $('tour-back').disabled=index===0;$('tour-next').textContent=index===steps.length-1?'Let’s play!':'Next →';
    $('tour-sample').hidden=index!==1;
  }
  function close(){stopReading();target?.classList.remove('tour-highlight');$('tour').hidden=true;previousFocus?.focus();}
  $('tour-open').addEventListener('click',()=>{previousFocus=document.activeElement;index=0;$('tour-answer').value='';$('tour-result').textContent='';$('tour-piece').hidden=true;$('tour').hidden=false;show();$('tour-close').focus();});
  $('tour-close').addEventListener('click',close);
  $('tour-back').addEventListener('click',()=>{if(index>0){index--;show();}});
  $('tour-next').addEventListener('click',()=>{if(index===steps.length-1)close();else{index++;show();}});
  $('tour-check').addEventListener('click',()=>{const ok=$('tour-answer').value.trim()==='5';$('tour-result').textContent=ok?'Yes! 2 + 3 = 5.':'Start at 2 and count three more: 3, 4, 5. Try again.';$('tour-piece').hidden=!ok;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('tour').hidden)close();});
})();
