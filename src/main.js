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
    <h2>WebLLM Analytics</h2>

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

async function getSystemInfo() {
  let gpuName = "Unavailable";
  let webgpuSupport = "Unsupported";

  if (navigator.gpu) {
    webgpuSupport = "Supported";

    try {
      const adapter = await navigator.gpu.requestAdapter();

      gpuName = adapter?.info?.description || "WebGPU Adapter Detected";
    } catch (err) {
      gpuName = "Could not detect GPU";
    }
  }

  const browserInfo = `
    <div class="meta-item">
      <strong>Browser:</strong>
      ${
        navigator.userAgent.includes("Chrome")
          ? "Google Chrome"
          : navigator.userAgent.includes("Firefox")
            ? "Firefox"
            : "Unknown Browser"
      }
    </div>

    <div class="meta-item">
      <strong>Platform:</strong>
      ${navigator.platform}
    </div>

    <div class="meta-item">
      <strong>CPU Cores:</strong>
      ${navigator.hardwareConcurrency || "N/A"}
    </div>

    <div class="meta-item">
      <strong>Device RAM:</strong>
      ${navigator.deviceMemory || "N/A"} GB
    </div>

    <div class="meta-item">
      <strong>WebGPU:</strong>
      ${webgpuSupport}
    </div>

    <div class="meta-item">
      <strong>GPU:</strong>
      ${gpuName}
    </div>
  `;

  metadata.innerHTML += browserInfo;
}

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

  await engine.reload("Qwen2.5-0.5B-Instruct-q4f16_1-MLC");

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
  await getSystemInfo();
}

loadModel();

sendBtn.onclick = async () => {
  try {
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
      `,
    );

    const contentDiv = assistantWrapper.querySelector(".message-content");

    const messages = [
      {
        role: "system",
        content: "You are a professional AI assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const startTime = performance.now();

    let fullResponse = "";

    const stream = await engine.chat.completions.create({
      messages,
      temperature: 0.7,
      stream: true,
    });

    contentDiv.innerHTML = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";

      fullResponse += delta;

      contentDiv.innerHTML = marked.parse(fullResponse);

      chat.scrollTop = chat.scrollHeight;
    }

    hljs.highlightAll();
  } catch (err) {
    console.error(err);

    addMessage(
      "assistant",
      `
      ❌ Error generating response.

      Possible reasons:
      - WebGPU issue
      - Model loading failure
      - Browser compatibility problem
      `,
    );
  }
};

promptInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
