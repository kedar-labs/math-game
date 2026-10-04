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
    if (sym === '+') return `${a} + ${b} = ${a + b}.\nStart with ${a}, then add ${b} more. You can split ${b} into tens and ones to add in smaller steps.`;
    if (sym === '−') return `${a} − ${b} = ${a - b}.\nStart at ${a} and move back ${b} on a number line.${b > a ? ' You pass zero, so the answer is negative.' : ''}`;
    if (sym === '×') return `${a} × ${b} = ${a * b}.\nThink of ${a} equal groups with ${b} in each group.${a === 0 || b === 0 ? ' Zero groups or zero in each group gives zero.' : ` Add ${b} a total of ${a} times.`}`;
    if (b === 0) return 'You cannot divide by zero. Equal groups of zero cannot make a nonzero total, and 0 ÷ 0 has no single answer.';
    const whole = Math.floor(a / b), remainder = a % b;
    return remainder ? `${a} ÷ ${b} = ${whole} remainder ${remainder}.\n${b} × ${whole} = ${b * whole}, with ${remainder} left over.` : `${a} ÷ ${b} = ${whole}.\nAsk: ${b} times what equals ${a}?\n${b} × ${whole} = ${a}, so the answer is ${whole}.`;
  }
  function answer(text, problem) {
    if (typeof text !== 'string' || text.length > 300) return refusal;
    const q = text.trim().toLowerCase().replace(/[?!\.]+$/, '').trim();
    if (/^(?:please )?(?:explain (?:this|this problem|the problem)|help(?: me)?(?: with (?:this|this problem))?|how (?:do i|can i) solve (?:this|this problem)|give me a hint)$/.test(q)) {
      return problem ? explain(problem.a, problem.b, problem.sym) : 'Start a game first, or type a calculation such as “8 × 7”.';
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
  let problem = null;
  root.MathHelp = {
    setProblem(value) {
      problem = {...value};
      context.textContent = `Current problem: ${problem.a} ${problem.sym} ${problem.b} = ?`;
      reply.textContent = 'Ask me to explain this problem, or type another arithmetic question.';
    },
    reset() {
      problem = null;
      input.value = '';
      context.textContent = 'Start a game to ask about your problem.';
      reply.textContent = 'Try “Explain this problem” or “What is 8 × 7?”';
    }
  };
  document.getElementById('help-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!input.value.trim()) return;
    reply.textContent = answer(input.value, problem);
  });
  document.getElementById('help-explain').addEventListener('click', () => {
    input.value = 'Explain this problem';
    reply.textContent = answer(input.value, problem);
  });
})(typeof window !== 'undefined' ? window : globalThis);
