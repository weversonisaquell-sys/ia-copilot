// server.js - proxy simples (Express)
// Uso: configurar OPENAI_API_KEY no env para encaminhar ao OpenAI.
// Ou configure LOCAL_LLM_URL para encaminhar a um endpoint local (ex.: ollama/llama-api).
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// /api/chat aceita { messages, openaiKey? }
app.post('/api/chat', async (req, res) => {
  const { messages, openaiKey } = req.body || {};
  const OPENAI_KEY = process.env.OPENAI_API_KEY || openaiKey;
  const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL;

  if(LOCAL_LLM_URL){
    // Encaminhar para LLM local (API específica depende do seu LLM)
    try{
      const r = await fetch(LOCAL_LLM_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({messages})
      });
      const data = await r.json();
      // Espera-se data.reply
      return res.json({reply: data.reply || JSON.stringify(data)});
    }catch(e){
      return res.status(500).json({error: e.message});
    }
  }

  if(!OPENAI_KEY){
    return res.status(400).json({error: 'Nenhuma chave OpenAI configurada no servidor e nenhuma chave fornecida.'});
  }

  // Encaminha a OpenAI Chat Completions (exemplo com chat completions v1)
  try{
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: messages || [{role:'system',content:'Você é um assistente.'}]
      })
    });
    const data = await r.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    res.json({reply: reply || JSON.stringify(data)});
  }catch(e){
    res.status(500).json({error: e.message});
  }
});

app.listen(PORT, ()=> console.log(`Servidor rodando em http://localhost:${PORT}`));