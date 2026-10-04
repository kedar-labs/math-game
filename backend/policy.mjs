export const REFUSAL = 'I can help with arithmetic only. Ask about this problem, addition, subtraction, multiplication, or division.';
export function problem(value) {
  if (!value || ![value.a,value.b].every(n=>Number.isInteger(n)&&n>=0&&n<=1000) || !['+','−','×','÷'].includes(value.sym)) return null;
  const {a,b,sym}=value;
  const gcd=(x,y)=>y?gcd(y,x%y):x;
  const divisor=b===0?1:gcd(a,b);
  const answer=sym==='+'?a+b:sym==='−'?a-b:sym==='×'?a*b:b===0?'undefined':(b/divisor===1?String(a/divisor):`${a/divisor}/${b/divisor}`);
  return {a,b,sym,answer};
}
function fractionTask(text) {
  const operand='(\\d{1,4}(?:\\s*/\\s*\\d{1,4})?)';
  const match=text.match(new RegExp('^'+operand+'\\s*(\\+|plus|−|-|minus|×|\\*|x|times|multiplied by|÷|divided by)\\s*'+operand+'$'));
  if(!match || ![match[1],match[3]].some(x=>x.includes('/')))return null;
  const read=x=>{const [n,d=1]=x.split('/').map(Number);return n<=1000&&d>0&&d<=1000?{numerator:n,denominator:d}:null;};
  const a=read(match[1]),b=read(match[3]);if(!a||!b)return null;
  const sym={plus:'+','-':'−',minus:'−','*':'×',x:'×',times:'×','multiplied by':'×','divided by':'÷'}[match[2]]||match[2];
  let n,d;
  if(sym==='+'){n=a.numerator*b.denominator+b.numerator*a.denominator;d=a.denominator*b.denominator;}
  if(sym==='−'){n=a.numerator*b.denominator-b.numerator*a.denominator;d=a.denominator*b.denominator;}
  if(sym==='×'){n=a.numerator*b.numerator;d=a.denominator*b.denominator;}
  if(sym==='÷'){n=a.numerator*b.denominator;d=a.denominator*b.numerator;}
  const gcd=(x,y)=>y?gcd(y,x%y):x;const g=gcd(Math.abs(n),d)||1;
  const answer=d===0?'undefined':d/g===1?String(n/g):`${n/g}/${d/g}`;
  return {kind:'problem',mode:'explain',problem:{a,b,sym,answer}};
}
export function parseQuestion(text, context) {
  if(typeof text!=='string'||text.length>300) return null;
  const q=text.trim().toLowerCase().replace(/^what['’]s\s+/, 'what is ').replace(/[?.!]+$/,'').trim();
  const current=/^(?:please )?(?:explain (?:this|this problem|the problem|it)|help(?: me)?(?: with (?:this|this problem))?|how (?:do i|can i) (?:solve|do) (?:this|this problem)|give me a hint|show (?:me )?(?:the steps|another way)|why is that the answer)$/;
  if(current.test(q)){const fraction=context?.expression?fractionTask(context.expression):null; if(fraction){fraction.mode=q.includes('hint')?'hint':q.includes('another')?'alternative':'explain';return fraction;}const p=problem(context);return p?{kind:'problem',mode:q.includes('hint')?'hint':q.includes('another')?'alternative':'explain',problem:p}:null;}
  const concept=q.match(/^(?:(?:what is|explain|help me with|how does) )?(addition|subtraction|multiplication|division)(?: work)?$/);
  if(concept)return {kind:'concept',topic:concept[1]};
  const normalized=q.replace(/^(?:what is|calculate|solve|explain|how much is|how do i calculate) /,'').replace(/^tell me what (.+) is$/,'$1');
  const fractions=fractionTask(normalized);if(fractions)return fractions;
  const m=normalized.match(/^(?:(?:what is|calculate|solve|explain|how much is|how do i calculate) )?(\d{1,4})\s*(\+|plus|-|−|minus|×|\*|x|times|multiplied by|÷|\/|divided by)\s*(\d{1,4})(?:\s*=\s*)?$/);
  if(!m)return null;
  const sym={'plus':'+','-':'−','minus':'−','*':'×','x':'×','times':'×','multiplied by':'×','/':'÷','divided by':'÷'}[m[2]]||m[2];
  const p=problem({a:Number(m[1]),b:Number(m[3]),sym});return p?{kind:'problem',mode:'explain',problem:p}:null;
}
export function reserve(ledger, now=Date.now(), cents=1) {
  const month=new Date(now).toISOString().slice(0,7);
  const day=new Date(now).toISOString().slice(0,10);
  const state=ledger||{};
  if(state.month!==month){state.month=month;state.reservedCents=0;}
  if(state.day!==day){state.day=day;state.daily=0;}
  if(state.reservedCents+cents>500)return {error:'The monthly Math Help allowance is used up. Try again next month.',status:429};
  if(state.daily>=50)return {error:'Math Help has reached today’s limit. Try again tomorrow.',status:429};
  if(state.last && now-state.last<5000)return {error:'Please wait a few seconds before another question.',status:429};
  state.reservedCents+=cents;state.daily++;state.last=now;
  return {state};
}
