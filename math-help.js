/* Deliberately bounded preview: arithmetic templates, not an AI/chat service. */
(function (root) {
  'use strict';
  const refusal = 'I can help with arithmetic only. Try “Explain this problem” or a calculation like “What is 8 × 7?”';
  const concepts = {
    addition: 'Addition combines amounts. For 8 + 7, make ten: 8 + 2 = 10, then add the remaining 5. The answer is 15.',
    subtraction: 'Subtraction finds what is left or the difference. For 13 − 5, take away 3 to reach 10, then take away 2 more: 8.',
    multiplication: 'Multiplication counts equal groups. 4 × 3 means 4 groups of 3: 3 + 3 + 3 + 3 = 12.',
    division: 'Division splits a number into equal groups. 12 ÷ 3 asks how many groups of 3 fit in 12. Since 3 × 4 = 12, the answer is 4.'
  };
  function explain(a, b, sym) {
    if (![a,b].every(n => Number.isInteger(n) && n >= 0 && n <= 1000)) return 'For this preview, use whole numbers from 0 to 1,000.';
    if (sym === '+') {
      const toTen = (10 - a % 10) % 10;
      if (toTen > 0 && b >= toTen) return `${a} + ${b} = ${a + b}.\nAdd ${toTen} to ${a} to make ${a + toTen}. Then add the remaining ${b - toTen} to get ${a + b}.`;
      return `${a} + ${b} = ${a + b}.\nStart at ${a} and count forward ${b} steps to reach ${a + b}.`;
    }
    if (sym === '−') return `${a} − ${b} = ${a - b}.\nStart at ${a} and move back ${b} on a number line.${b > a ? ' You pass zero, so the answer is negative.' : ''}`;
    if (sym === '×') return `${a} × ${b} = ${a * b}.\nThink of ${a} equal groups with ${b} in each group.${a === 0 || b === 0 ? ' Zero groups or zero in each group gives zero.' : ` Add ${b} a total of ${a} times.`}`;
    if (b === 0) return 'You cannot divide by zero. Equal groups of zero cannot make a nonzero total, and 0 ÷ 0 has no single answer.';
    const gcd=(x,y)=>y?gcd(y,x%y):x;
    const divisor=gcd(a,b), result=b/divisor===1?String(a/divisor):`${a/divisor}/${b/divisor}`;
    return `${a} ÷ ${b} = ${result}.\nDividing by ${b} can be written as the fraction ${a}/${b}.` + (divisor>1?` Divide the top and bottom by ${divisor} to simplify it to ${result}.`:'');
  }
  function answer(text, problem) {
    if (typeof text !== 'string' || text.length > 300) return refusal;
    const q = text.trim().toLowerCase().replace(/^what['’]s\s+/, 'what is ').replace(/[?!\.]+$/, '').trim();
    if (/^(?:please )?(?:explain (?:this|this problem|the problem)|help(?: me)?(?: with (?:this|this problem))?|how (?:do i|can i) solve (?:this|this problem)|give me a hint)$/.test(q)) {
      return problem?.explanation || (problem ? explain(problem.a, problem.b, problem.sym) : 'Start a game first, or type a calculation such as “8 × 7”.');
    }
    const concept = q.match(/^(?:(?:what is|explain|help me with) )?(addition|subtraction|multiplication|division)$/);
    if (concept) return concepts[concept[1]];
    // Match the entire input. Merely mentioning math never permits unrelated text.
    const match = q.match(/^(?:(?:what is|calculate|solve|explain|how much is) )?(\d{1,4})\s*(\+|plus|-|−|minus|×|\*|x|times|multiplied by|÷|\/|divided by)\s*(\d{1,4})(?:\s*=\s*)?$/);
    if (!match) return refusal;
    const symbol = {'plus':'+','-':'−','minus':'−','*':'×','x':'×','times':'×','multiplied by':'×','/':'÷','divided by':'÷'}[match[2]] || match[2];
    return explain(Number(match[1]), Number(match[3]), symbol);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {answer};
  if (!root.document) return;
  const input = document.getElementById('help-input');
  const reply = document.getElementById('help-reply');
  const context = document.getElementById('help-context');
  let problem = null, revision = 0, controller = null;
  const endpoint = root.MATH_TUTOR_ENDPOINT || '';
  const mode = document.getElementById('help-mode');
  const sendButton = document.querySelector('#help-form button');
  const codeInput = document.getElementById('tutor-code');
  const codeError = document.getElementById('tutor-code-error');
  function setCodeError(message='') {
    codeInput.setAttribute('aria-invalid',String(Boolean(message)));
    codeError.textContent=message; codeError.hidden=!message;
  }
  codeInput.addEventListener('input',()=>{setCodeError();cancelPending();});
  const explainButton = document.getElementById('help-explain');
  if (endpoint) {
    document.getElementById('tutor-unlock').hidden = false;
    mode.textContent = 'AI Math Help · family code required. Timed games keep counting while you ask for help.';
  }
  function cancelPending() {revision++;controller?.abort();controller=null;sendButton.disabled=false;explainButton.disabled=false;}
  async function ask() {
    if (!input.value.trim()) return;
    if (!endpoint) {reply.textContent=answer(input.value,problem);mode.textContent='Built-in math explanation · no API call used.';return;}
    const code=codeInput.value;
    if (!code) {setCodeError('Enter your family access code below.');codeInput.focus();return;}
    cancelPending();
    const current=revision;
    controller=new AbortController();
    const timer=setTimeout(()=>controller?.abort(),25000);
    sendButton.disabled=true;explainButton.disabled=true;
    reply.textContent='Thinking through the math…';
    try {
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Tutor-Code':code},body:JSON.stringify({question:input.value,problem}),signal:controller.signal});
      const data=await response.json();
      if(current!==revision)return;
      if(response.status===401) setCodeError('Incorrect family code. Please try again.');
      else if(response.ok) setCodeError();
      reply.textContent=response.ok?data.answer:(data.error||'AI Math Help is unavailable.');
      if(response.ok)mode.textContent=data.source==='OpenAI'?'Answered by OpenAI · timed games keep counting.':'Math-only filter · no API call used.';
    } catch {
      if(current===revision)reply.textContent='Could not connect to AI Math Help. Please try again later.';
    } finally {
      clearTimeout(timer);
      if(current===revision){sendButton.disabled=false;explainButton.disabled=false;controller=null;}
    }
  }
  root.MathHelp = {
    setProblem(value) {
      problem = {...value};
      context.textContent = `Current problem: ${problem.expression || `${problem.a} ${problem.sym} ${problem.b}`} = ?`;

    },
    reset() {
      problem = null;
      context.textContent = 'Ask a math question anytime—no game needed.';
    }
  };
  document.getElementById('help-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!input.value.trim()) return;
    ask();
  });
  document.getElementById('help-explain').addEventListener('click', () => {
    input.value = 'Explain this problem';
    ask();
  });
})(typeof window !== 'undefined' ? window : globalThis);
