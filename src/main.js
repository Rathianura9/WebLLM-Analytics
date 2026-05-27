import "./style.css";
import * as webllm from "@mlc-ai/web-llm";
import { marked } from "marked";
import hljs from "highlight.js";

marked.setOptions({
  highlight: function (code, lang) {
    return hljs.highlightAuto(code).value;
  },
});

document.querySelector("#app").innerHTML = `
<div class="app">

  <aside class="sidebar">
    <h2>Testing WebLLM</h2>

    <div class="sidebar-card">
      <p>Local AI Running</p>
      <span id="status-dot"></span>
    </div>

    <div id="metadata" class="metadata">
      Loading model...
    </div>
  </aside>

  <main class="main">

    <div class="topbar">
      <h1>AI Assistant</h1>
      <p>Powered by WebLLM</p>
    </div>

    <div id="chat" class="chat"></div>

    <div class="input-container">

      <input
        id="prompt"
        type="text"
        placeholder="Ask anything..."
      />

      <button id="send">
        Send
      </button>

    </div>

  </main>

</div>
`;

const chat = document.getElementById("chat");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("send");
const metadata = document.getElementById("metadata");

function addMessage(role, content) {
  const wrapper = document.createElement("div");

  wrapper.className =
    role === "user" ? "message user-message" : "message bot-message";

  wrapper.innerHTML = `
    <div class="message-role">
      ${role}
    </div>

    <div class="message-content">
      ${marked.parse(content)}
    </div>
  `;

  chat.appendChild(wrapper);

  chat.scrollTop = chat.scrollHeight;

  return wrapper;
}

function updateMetadata(html) {
  metadata.innerHTML = html;
}

let engine;

async function loadModel() {
  const startTime = performance.now();

  engine = new webllm.MLCEngine({
    initProgressCallback: (progress) => {
      updateMetadata(`
        <div class="meta-item">
          <strong>Loading:</strong>
          ${(progress.progress * 100).toFixed(1)}%
        </div>

        <div class="meta-item">
          <strong>Elapsed:</strong>
          ${((performance.now() - startTime) / 1000).toFixed(1)} sec
        </div>
      `);
    },
  });

  await engine.reload("Llama-3.2-1B-Instruct-q4f16_1-MLC");

  const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);

  updateMetadata(`
    <div class="meta-item">
      <strong>Model:</strong>
      Llama 3.2 1B
    </div>

    <div class="meta-item">
      <strong>Load Time:</strong>
      ${loadTime}s
    </div>

    <div class="meta-item">
      <strong>Status:</strong>
      Ready
    </div>
  `);

  addMessage("assistant", "Model loaded successfully.");
}

loadModel();

sendBtn.onclick = async () => {
  const prompt = promptInput.value;

  if (!prompt) return;

  addMessage("user", prompt);

  promptInput.value = "";

  const assistantWrapper = addMessage(
    "assistant",
    `
      <div class="typing">
        Initializing generation...
      </div>
    `
  );

  const contentDiv =
    assistantWrapper.querySelector(
      ".message-content"
    );

  const messages = [
    {
      role: "system",
      content:
        "You are a professional AI assistant.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const startTime = performance.now();

  let firstTokenTime = null;

  let fullResponse = "";

  let tokenCount = 0;

  const stream =
    await engine.chat.completions.create({
      messages,
      temperature: 0.7,
      stream: true,
    });

  contentDiv.innerHTML = "";

  for await (const chunk of stream) {
    const delta =
      chunk.choices[0]?.delta?.content || "";

    if (!delta) continue;

    if (!firstTokenTime) {
      firstTokenTime = performance.now();
    }

    fullResponse += delta;

    tokenCount++;

    const elapsed =
      (performance.now() - startTime) / 1000;

    const tokensPerSecond = (
      tokenCount / elapsed
    ).toFixed(2);

    contentDiv.innerHTML = `
      ${marked.parse(fullResponse)}

      <div class="response-metadata">

        <div class="response-meta-grid">

          <div class="meta-box">
            <span class="meta-label">
              Streaming
            </span>

            <span class="meta-value live">
              LIVE
            </span>
          </div>

          <div class="meta-box">
            <span class="meta-label">
              Elapsed
            </span>

            <span class="meta-value">
              ${elapsed.toFixed(2)}s
            </span>
          </div>

          <div class="meta-box">
            <span class="meta-label">
              Tokens Streamed
            </span>

            <span class="meta-value">
              ${tokenCount}
            </span>
          </div>

          <div class="meta-box">
            <span class="meta-label">
              Tokens/sec
            </span>

            <span class="meta-value">
              ${tokensPerSecond}
            </span>
          </div>

        </div>

      </div>
    `;

    chat.scrollTop = chat.scrollHeight;
  }

  hljs.highlightAll();

  const totalTime =
    (
      (performance.now() - startTime) /
      1000
    ).toFixed(2);

  const firstTokenLatency =
    (
      (firstTokenTime - startTime) /
      1000
    ).toFixed(2);

  contentDiv.innerHTML = `
    ${marked.parse(fullResponse)}

    <div class="response-metadata">

      <div class="response-meta-grid">

        <div class="meta-box">
          <span class="meta-label">
            Status
          </span>

          <span class="meta-value success">
            Complete
          </span>
        </div>

        <div class="meta-box">
          <span class="meta-label">
            Total Time
          </span>

          <span class="meta-value">
            ${totalTime}s
          </span>
        </div>

        <div class="meta-box">
          <span class="meta-label">
            First Token Latency
          </span>

          <span class="meta-value">
            ${firstTokenLatency}s
          </span>
        </div>

        <div class="meta-box">
          <span class="meta-label">
            Tokens Generated
          </span>

          <span class="meta-value">
            ${tokenCount}
          </span>
        </div>

        <div class="meta-box">
          <span class="meta-label">
            Avg Tokens/sec
          </span>

          <span class="meta-value">
            ${(tokenCount / totalTime).toFixed(2)}
          </span>
        </div>

        <div class="meta-box">
          <span class="meta-label">
            Timestamp
          </span>

          <span class="meta-value">
            ${new Date().toLocaleTimeString()}
          </span>
        </div>

      </div>

    </div>
  `;

  updateMetadata(`
    <div class="meta-item">
      <strong>Last Generation:</strong>
      ${totalTime}s
    </div>

    <div class="meta-item">
      <strong>First Token:</strong>
      ${firstTokenLatency}s
    </div>

    <div class="meta-item">
      <strong>Tokens:</strong>
      ${tokenCount}
    </div>

    <div class="meta-item">
      <strong>Avg Speed:</strong>
      ${(tokenCount / totalTime).toFixed(2)}
      tok/sec
    </div>
  `);
};

promptInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
