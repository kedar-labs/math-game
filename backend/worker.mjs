import {parseQuestion, REFUSAL, reserve} from './policy.mjs';
const MODEL='gpt-4.1-mini-2025-04-14';
const INSTRUCTIONS='You are a warm, concise arithmetic tutor for a fifth grader. Explain only the supplied validated arithmetic task. Use 2-4 short sentences with concrete numeric steps and correct arithmetic. For addition, make the next ten when helpful; never suggest tens in a single-digit addend. Use the supplied verified answer. For hint mode, give the first useful step without the final answer. For alternative mode, show another method. No links, personal questions, non-math topics, roleplay, or requests for information. Return plain text. Do not claim to see a screen.';
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin');
    const allowed=(env.ALLOWED_ORIGINS||'https://kedar-labs.github.io').split(',');
    if(!allowed.includes(origin))return json({error:'Origin not allowed.'},403);
    const headers={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Tutor-Code','Cache-Control':'no-store'};
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    let result;
    try{
      if(new URL(request.url).pathname!=='/help' && new URL(request.url).pathname!=='/speech')result=json({error:'Not found.'},404);
      else if(request.method!=='POST')result=json({error:'Use POST.'},405);
      else if(!env.OPENAI_API_KEY||!env.TUTOR_ACCESS_CODE||env.TUTOR_ACCESS_CODE.length<6)result=json({error:'AI tutor setup is not complete.'},503);
      else if(request.headers.get('X-Tutor-Code')!==env.TUTOR_ACCESS_CODE)result=json({error:'Enter the family access code to use AI Math Help.'},401);
      else result=await env.TUTOR.get(env.TUTOR.idFromName('family-budget-v1')).fetch(request);
    }catch{result=json({error:'Math Help is temporarily unavailable. Please try later.'},503);}
    const response=new Response(result.body,result);for(const[k,v]of Object.entries(headers))response.headers.set(k,v);return response;
  }
};
export class Tutor {
  constructor(ctx,env){this.ctx=ctx;this.env=env;}
  async fetch(request){
    // Bound the stream before decoding JSON, including chunked requests.
    const reader=request.body?.getReader();if(!reader)return json({error:'Question required.'},400);
    const chunks=[];let size=0;
    while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return json({error:'Question is too long.'},413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
    let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid question.'},400);}
    const isSpeech=new URL(request.url).pathname==='/speech';
    const voices=['coral','shimmer','nova','marin'];
    if(isSpeech && (typeof body.text!=='string'||!body.text.trim()||body.text.length>1000||!voices.includes(body.voice)))return json({error:'Enter up to 1,000 characters and choose a voice.'},400);
    const task=isSpeech?{}:parseQuestion(body.question,body.problem);
    if(!task)return json({answer:REFUSAL,source:'math-only filter'});
    // Atomic durable reservation happens BEFORE the external API call. Never refund
    // ambiguous failures: an upstream timeout may still incur a charge.
    const budget=await this.ctx.storage.transaction(async tx=>{
      const next=reserve(await tx.get('ledger'),Date.now(),isSpeech?10:1);
      if(next.state)await tx.put('ledger',next.state);
      return next;
    });
    if(budget.error)return json({error:budget.error},budget.status);
    if(isSpeech){
      try{
        const audio=await fetch('https://api.openai.com/v1/audio/speech',{
          method:'POST',headers:{Authorization:`Bearer ${this.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
          body:JSON.stringify({model:'gpt-4o-mini-tts',voice:body.voice,input:body.text.trim(),response_format:'mp3',instructions:'Speak as a tiny cheerful pink squishy cartoon mascot. Use a naturally high-pitched, bright, light, bouncy voice with warm playful expression. Clear American English, medium pace. Avoid robotic delivery; keep every word easy to understand.'}),signal:AbortSignal.timeout(60000)
        });
        if(!audio.ok)return json({error:'Voice generation is unavailable. Check API billing or try later.'},503);
        return new Response(audio.body,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
      }catch{return json({error:'Voice generation timed out. Try later.'},503);}
    }
    let response;
    try{
      response=await fetch('https://api.openai.com/v1/responses',{
        method:'POST',headers:{'Authorization':`Bearer ${this.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:MODEL,instructions:INSTRUCTIONS,input:JSON.stringify(task),max_output_tokens:350,store:false}),signal:AbortSignal.timeout(20000)
      });
      if(!response.ok)return json({error:response.status===429?'The API allowance is unavailable. Ask a parent to check API billing.':'AI Math Help could not answer just now. Try again later.'},503);
      const data=await response.json();
      if(data.status!=='completed')return json({error:'The explanation was incomplete. Please try again.'},502);
      const answer=(data.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
      if(!answer||answer.length>1800||/https?:\/\/|www\.|<\/?[a-z]/i.test(answer))return json({error:'The explanation could not be displayed safely. Please try again.'},502);
      return json({answer,source:'OpenAI',model:MODEL});
    }catch{return json({error:'AI Math Help timed out or is unavailable. Please try again later.'},503);}
  }
}
