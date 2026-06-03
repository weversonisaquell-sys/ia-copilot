// app.js - cliente
const messagesEl = document.getElementById('messages');
const form = document.getElementById('inputForm');
const promptInput = document.getElementById('prompt');
const modeSelect = document.getElementById('mode');
const openaiKeyInput = document.getElementById('openaiKey');
const clearBtn = document.getElementById('clear');

let convo = JSON.parse(localStorage.getItem('convo_v1') || '[]');

function render(){
  messagesEl.innerHTML = '';
  for(const m of convo){
    const div = document.createElement('div');
    div.className = 'message ' + (m.role === 'user' ? 'user' : 'assistant');
    div.textContent = m.content;
    messagesEl.appendChild(div);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
render();

function pushMessage(role, content){
  convo.push({role, content});
  localStorage.setItem('convo_v1', JSON.stringify(convo));
  render();
}

clearBtn.onclick = () => {
  convo = [];
  localStorage.removeItem('convo_v1');
  render();
};

// Resposta offline simples (grátis) - rule-based e limitada
function offlineReply(userText){
  const t = userText.toLowerCase();
  if(t.includes('olá')||t.includes('oi')) return 'Olá! Como posso ajudar hoje?';
  if(t.includes('codigo')||t.includes('exemplo')) return 'Posso mostrar um exemplo simples. Que linguagem você prefere?';
  if(t.includes('limitações')||t.includes('restrições')) return 'Sou uma versão offline limitada: não tenho acesso a modelos proprietários e não posso executar código remoto.';
  if(t.length < 20) return 'Conte-me mais detalhes para eu ajudar melhor.';
  return "Desculpe — minha versão offline é limitada. Para respostas mais completas, use o modo 'Proxy' com um servidor que encaminhe para um modelo maior.";
}

async function proxyReply(messages, openaiKey){
  // Chama o servidor local /api/chat (implemente server.js)
  try{
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({messages, openaiKey})
    });
    if(!res.ok) throw new Error('Erro no servidor: ' + res.status);
    const data = await res.json();
    return data.reply || '[sem resposta]';
  }catch(e){
    return 'Erro ao chamar o servidor: ' + e.message;
  }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = promptInput.value.trim();
  if(!text) return;
  pushMessage('user', text);
  promptInput.value = '';
  const mode = modeSelect.value;
  pushMessage('assistant', '...'); // placeholder
  render();

  const lastIndex = convo.length - 1;
  // Build messages for model: use convo array
  const msgs = convo.map(m => ({role: m.role, content: m.content}));

  let reply = '';
  if(mode === 'offline'){
    reply = offlineReply(text);
  } else if(mode === 'proxy'){
    reply = await proxyReply(msgs, null);
  } else if(mode === 'openai'){
    // Aviso: postar chave em cliente expõe chave. Use só em ambiente local.
    const key = openaiKeyInput.value.trim();
    if(!key){ reply = 'Por favor forneça uma chave OpenAI no campo acima.'; }
    else reply = await proxyReply(msgs, key);
  }

  // Replace last assistant placeholder
  convo[convo.length - 1] = {role:'assistant', content: reply};
  localStorage.setItem('convo_v1', JSON.stringify(convo));
  render();
});