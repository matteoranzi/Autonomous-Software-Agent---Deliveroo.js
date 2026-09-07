// webchat.js
import http from 'http';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WebChat</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: monospace;
      display: flex;
      flex-direction: column;
      height: 100vh;
      margin: 0;
    }

    #mainRow {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    #left {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      border-right: 1px solid #ccc;
    }
    #messages { flex: 1; overflow-y: auto; padding: 10px; }
    .user  { color: #222; margin: 4px 0; }
    .agent { color: #4a90d9; white-space: pre-wrap; margin: 4px 0; }
    #inputBar { display: flex; border-top: 1px solid #ccc; }
    #textInput { flex: 1; padding: 10px; font-size: 16px; border: none; outline: none; }
    #sendBtn { padding: 10px 20px; border: none; background: #4a90d9; color: white; cursor: pointer; }

    #right {
      width: 380px;
      min-width: 260px;
      display: flex;
      flex-direction: column;
      background: #f7f8fa;
    }
    #right h2 {
      margin: 0;
      padding: 10px;
      font-size: 14px;
      background: #eaeef2;
      border-bottom: 1px solid #ccc;
    }
    #plans { flex: 1; overflow-y: auto; padding: 10px; }
    .plan-card {
      background: #fff;
      border: 1px solid #d5d9de;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .plan-chat {
      color: #4a90d9;
      white-space: pre-wrap;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #ccc;
    }
    .plan-steps { list-style: none; margin: 0; padding: 0; }
    .plan-step {
      background: #f1f4f8;
      border-left: 3px solid #4a90d9;
      border-radius: 3px;
      padding: 6px 8px;
      margin-bottom: 6px;
    }
    .plan-step .step-type {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      color: #4a90d9;
    }
    .plan-step pre {
      margin: 4px 0 0 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
    }
    .plan-empty { color: #888; font-style: italic; padding: 10px; }

    #timingPanel {
      flex-shrink: 0;
      max-height: 140px;
      overflow-y: auto;
      background: #1e1e1e;
      color: #d4d4d4;
      border-top: 1px solid #444;
      padding: 6px 10px;
      font-size: 12px;
    }
    #timingPanel h3 {
      margin: 0 0 4px 0;
      font-size: 12px;
      color: #9cdcfe;
    }
    .timing-entry {
      display: flex;
      gap: 16px;
      padding: 2px 0;
      border-bottom: 1px dotted #333;
    }
    .timing-entry .t-delta {
      color: #4ec9b0;
      font-weight: bold;
      min-width: 70px;
    }
    .timing-entry .t-req { color: #ce9178; }
    .timing-entry .t-res { color: #4a90d9; }
    .timing-empty { color: #777; font-style: italic; }
  </style>
</head>
<body>
  <div id="mainRow">
    <div id="left">
      <div id="messages"></div>
      <div id="inputBar">
        <input id="textInput" type="text" placeholder="Type a message..." />
        <button id="sendBtn">Send</button>
      </div>
    </div>

    <div id="right">
      <h2>Structured Plans</h2>
      <div id="plans">
        <div class="plan-empty">No plans yet.</div>
      </div>
    </div>
  </div>

  <div id="timingPanel">
    <h3>⏱ Tempi di risposta (ms)</h3>
    <div id="timingList">
      <div class="timing-empty">Nessuna richiesta ancora.</div>
    </div>
  </div>

  <script>
    const messages = document.getElementById('messages');
    const plans = document.getElementById('plans');
    const input = document.getElementById('textInput');
    const btn = document.getElementById('sendBtn');
    const timingList = document.getElementById('timingList');
    let plansCleared = false;
    let timingCleared = false;

    // Tracks the timestamp of the last request still awaiting its first reply.
    let pendingRequest = null; // { sentAt: performance.now(), sentAtWall: Date }

    function fmtTime(date) {
      return date.toLocaleTimeString('it-IT', { hour12: false }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
    }

    function addTimingEntry(sentAtWall, receivedAtWall, deltaMs) {
      if (!timingCleared) {
        timingList.innerHTML = '';
        timingCleared = true;
      }
      const entry = document.createElement('div');
      entry.className = 'timing-entry';
      entry.innerHTML =
        '<span class="t-delta">' + Math.round(deltaMs) + ' ms</span>' +
        '<span class="t-req">richiesta: ' + fmtTime(sentAtWall) + '</span>' +
        '<span class="t-res">risposta: ' + fmtTime(receivedAtWall) + '</span>';
      timingList.prepend(entry);
    }

    function addMessage(text, cls) {
      const div = document.createElement('div');
      div.className = cls;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function renderPlan(planObj) {
      if (!plansCleared) {
        plans.innerHTML = '';
        plansCleared = true;
      }

      const card = document.createElement('div');
      card.className = 'plan-card';

      if (planObj.chat) {
        const chatDiv = document.createElement('div');
        chatDiv.className = 'plan-chat';
        chatDiv.textContent = planObj.chat;
        card.appendChild(chatDiv);
      }

      const list = document.createElement('ul');
      list.className = 'plan-steps';

      (planObj.plan || []).forEach((step, i) => {
        const li = document.createElement('li');
        li.className = 'plan-step';

        const type = document.createElement('div');
        type.className = 'step-type';
        type.textContent = (i + 1) + '. ' + (step.type || step.tool || 'step');
        li.appendChild(type);

        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(step, null, 2);
        li.appendChild(pre);

        list.appendChild(li);
      });

      card.appendChild(list);
      plans.appendChild(card);
      plans.scrollTop = plans.scrollHeight;
    }

    function tryParsePlan(raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj && Array.isArray(obj.plan)) return obj;
      } catch (e) {
        // not JSON / not a plan — ignore
      }
      return null;
    }

    const events = new EventSource('/events');
    events.onmessage = (e) => {
      const raw = e.data.replace(/\\\\n/g, '\\n');
      const planObj = tryParsePlan(raw);

      // Record the timing of the FIRST reply received for a pending request.
      if (pendingRequest) {
        const receivedAt = performance.now();
        const receivedAtWall = new Date();
        const deltaMs = receivedAt - pendingRequest.sentAt;
        addTimingEntry(pendingRequest.sentAtWall, receivedAtWall, deltaMs);
        pendingRequest = null;
      }

      if (planObj) {
        renderPlan(planObj);
        if (planObj.chat) addMessage(planObj.chat, 'agent');
      } else {
        addMessage(raw, 'agent');
      }
    };

    async function send() {
      const text = input.value.trim();
      if (!text) return;

      input.value = '';

      try {
        const res = await fetch('/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          pendingRequest = { sentAt: performance.now(), sentAtWall: new Date() };
          addMessage('🧑 ' + text, 'user');
        } else {
          addMessage('[error sending message]', 'agent');
        }
      } catch (e) {
        addMessage('[error: ' + e.message + ']', 'agent');
      }
    }

    btn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send();
    });
  </script>
</body>
</html>`;

export function startWebChat(onMessage) {
    const sseClients = [];

    const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        }

        if (req.method === 'GET' && req.url === '/events') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });
            res.write('\n');
            sseClients.push(res);

            req.on('close', () => {
                const idx = sseClients.indexOf(res);
                if (idx >= 0) sseClients.splice(idx, 1);
            });
            return;
        }

        if (req.method === 'POST' && req.url === '/message') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
                try {
                    const { text } = JSON.parse(body);
                    if (typeof text === 'string' && text.length > 0) {
                        onMessage(text);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: e.message }));
                }
            });
            return;
        }

        res.writeHead(404);
        res.end('Not found');
    });

    server.listen(8081, () => {
        console.log('WebChat running at http://localhost:8081');
    });

    function sendReply(text) {
        const payload = String(text).replace(/\n/g, '\\n');
        for (const client of sseClients) {
            client.write(`data: ${payload}\n\n`);
        }
    }

    return { server, sendReply };
}