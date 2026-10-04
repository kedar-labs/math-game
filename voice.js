(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let audioUrl=null;
  $('voice-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const endpoint=window.MATH_TUTOR_ENDPOINT;
    if(!endpoint){$('voice-status').textContent='The voice service has not been configured.';return;}
    $('voice-generate').disabled=true;$('voice-status').textContent='Making your squishy voice…';
    $('voice-player').pause();$('voice-player').hidden=true;$('voice-save').hidden=true;
    try{
      const response=await fetch(new URL('/speech',endpoint),{method:'POST',headers:{'Content-Type':'application/json','X-Tutor-Code':$('voice-code').value},body:JSON.stringify({text:$('voice-text').value,voice:$('voice-choice').value}),signal:AbortSignal.timeout(65000)});
      $('voice-code').setAttribute('aria-invalid',String(response.status===401));
      if(!response.ok){const error=await response.json();throw new Error(error.error||'Could not make the voice.');}
      if(!response.headers.get('Content-Type')?.includes('audio/'))throw new Error('The service did not return audio.');
      const blob=await response.blob();if(!blob.size)throw new Error('The audio was empty.');
      if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(blob);
      $('voice-player').src=audioUrl;$('voice-player').hidden=false;$('voice-save').href=audioUrl;$('voice-save').hidden=false;
      $('voice-status').textContent='Ready! Press Play to listen, or download the sample.';
    }catch(error){$('voice-status').textContent=error.name==='TimeoutError'?'Voice generation took too long. Try later.':error.message;}
    finally{$('voice-generate').disabled=false;}
  });
  $('voice-code').addEventListener('input',()=>$('voice-code').removeAttribute('aria-invalid'));
  window.addEventListener('pagehide',()=>{if(audioUrl)URL.revokeObjectURL(audioUrl);});
})();
