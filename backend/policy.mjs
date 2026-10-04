export const REFUSAL = 'I can help with arithmetic only. Ask about this problem, addition, subtraction, multiplication, or division.';
export function problem(value) {
  if (!value || ![value.a,value.b].every(n=>Number.isInteger(n)&&n>=0&&n<=1000) || !['+','−','×','÷'].includes(value.sym)) return null;
  const {a,b,sym}=value;
  const answer=sym==='+'?a+b:sym==='−'?a-b:sym==='×'?a*b:b===0?'undefined':`${Math.floor(a/b)} remainder ${a%b}`;
  return {a,b,sym,answer};
}
export function parseQuestion(text, context) {
  if(typeof text!=='string'||text.length>300) return null;
  const q=text.trim().toLowerCase().replace(/^what['’]s\s+/, 'what is ').replace(/[?.!]+$/,'').trim();
  const current=/^(?:please )?(?:explain (?:this|this problem|the problem|it)|help(?: me)?(?: with (?:this|this problem))?|how (?:do i|can i) (?:solve|do) (?:this|this problem)|give me a hint|show (?:me )?(?:the steps|another way)|why is that the answer)$/;
  if(current.test(q)){const p=problem(context);return p?{kind:'problem',mode:q.includes('hint')?'hint':q.includes('another')?'alternative':'explain',problem:p}:null;}
  const concept=q.match(/^(?:(?:what is|explain|help me with|how does) )?(addition|subtraction|multiplication|division)(?: work)?$/);
  if(concept)return {kind:'concept',topic:concept[1]};
  const m=q.match(/^(?:(?:what is|calculate|solve|explain|how much is|how do i calculate) )?(\d{1,4})\s*(\+|plus|-|−|minus|×|\*|x|times|multiplied by|÷|\/|divided by)\s*(\d{1,4})(?:\s*=\s*)?$/);
  if(!m)return null;
  const sym={'plus':'+','-':'−','minus':'−','*':'×','x':'×','times':'×','multiplied by':'×','/':'÷','divided by':'÷'}[m[2]]||m[2];
  const p=problem({a:Number(m[1]),b:Number(m[3]),sym});return p?{kind:'problem',mode:'explain',problem:p}:null;
}
export function reserve(ledger, now=Date.now()) {
  const month=new Date(now).toISOString().slice(0,7);
  const day=new Date(now).toISOString().slice(0,10);
  const state=ledger||{};
  if(state.month!==month){state.month=month;state.reservedCents=0;}
  if(state.day!==day){state.day=day;state.daily=0;}
  if(state.reservedCents>=500)return {error:'The monthly Math Help allowance is used up. Try again next month.',status:429};
  if(state.daily>=50)return {error:'Math Help has reached today’s limit. Try again tomorrow.',status:429};
  if(state.last && now-state.last<5000)return {error:'Please wait a few seconds before another question.',status:429};
  state.reservedCents++;state.daily++;state.last=now;
  return {state};
}
