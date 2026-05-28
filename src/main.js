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

    <div class="metadata">

      <div id="system-info">
        Loading system info...
      </div>

      <hr class="meta-divider" />

      <div id="response-info">
        Waiting for first response...
      </div>

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

const systemInfo =
  document.getElementById("system-info");

const responseInfo =
  document.getElementById("response-info");

function addMessage(role, content) {
  const wrapper = document.createElement("div");

  wrapper.className =
    role === "user"
      ? "message user-message"
      : "message bot-message";

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

let engine;

async function getSystemInfo() {
  let gpuName = "Unavailable";
  let webgpuSupport = "Unsupported";

  if (navigator.gpu) {
    webgpuSupport = "Supported";

    try {
      const adapter =
        await navigator.gpu.requestAdapter();

      gpuName =
        adapter?.info?.description ||
        "WebGPU Adapter Detected";
    } catch (err) {
      gpuName = "Could not detect GPU";
    }
  }

  systemInfo.innerHTML = `
    <div class="meta-item">
      <strong>Model:</strong>
      Qwen 2.5 0.5B
    </div>

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
}

async function loadModel() {
  const startTime = performance.now();

  responseInfo.innerHTML = `
    <div class="meta-item">
      <strong>Status:</strong>
      Loading Model...
    </div>
  `;

  engine = new webllm.MLCEngine({
    initProgressCallback: (progress) => {
      responseInfo.innerHTML = `
        <div class="meta-item">
          <strong>Loading:</strong>
          ${(progress.progress * 100).toFixed(1)}%
        </div>

        <div class="meta-item">
          <strong>Elapsed:</strong>
          ${(
            (performance.now() - startTime) /
            1000
          ).toFixed(1)} sec
        </div>
      `;
    },
  });

  await engine.reload(
    "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"
  );

  const loadTime = (
    (performance.now() - startTime) /
    1000
  ).toFixed(2);

  responseInfo.innerHTML = `
    <div class="meta-item">
      <strong>Status:</strong>
      Ready
    </div>

    <div class="meta-item">
      <strong>Load Time:</strong>
      ${loadTime}s
    </div>
  `;

  addMessage(
    "assistant",
    "Model loaded successfully."
  );

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
      "Initializing generation..."
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

    let fullResponse = "";

    let tokenCount = 0;

    const stream =
      await engine.chat.completions.create({
        messages,
        temperature: 0.7,
        stream: true,
      });

    for await (const chunk of stream) {
      const delta =
        chunk.choices[0]?.delta?.content || "";

      if (!delta) continue;

      fullResponse += delta;

      tokenCount++;

      const elapsed =
        (
          (performance.now() - startTime) /
          1000
        ).toFixed(2);

      const tokensPerSecond =
        (
          tokenCount / elapsed
        ).toFixed(2);

      // IMPORTANT:
      // plain text during streaming
      contentDiv.textContent =
        fullResponse;

      responseInfo.innerHTML = `
        <div class="meta-item">
          <strong>Status:</strong>
          Streaming
        </div>

        <div class="meta-item">
          <strong>Elapsed:</strong>
          ${elapsed}s
        </div>

        <div class="meta-item">
          <strong>Tokens:</strong>
          ${tokenCount}
        </div>

        <div class="meta-item">
          <strong>Speed:</strong>
          ${tokensPerSecond} tok/sec
        </div>
      `;

      chat.scrollTop =
        chat.scrollHeight;
    }

    // parse markdown ONLY ONCE
    // after stream finishes
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
              Tokens Generated
            </span>

            <span class="meta-value">
              ${tokenCount}
            </span>
          </div>

          <div class="meta-box">
            <span class="meta-label">
              Total Time
            </span>

            <span class="meta-value">
              ${(
                (performance.now() -
                  startTime) /
                1000
              ).toFixed(2)}s
            </span>
          </div>

        </div>

      </div>
    `;

    hljs.highlightAll();

    responseInfo.innerHTML = `
      <div class="meta-item">
        <strong>Status:</strong>
        Complete
      </div>

      <div class="meta-item">
        <strong>Total Tokens:</strong>
        ${tokenCount}
      </div>

      <div class="meta-item">
        <strong>Completed:</strong>
        ${new Date().toLocaleTimeString()}
      </div>
    `;

    await engine.runtimeStatsText();

  } catch (err) {
    console.error(
      "Generation Error:",
      err
    );

    addMessage(
      "assistant",
      `
❌ Error generating response.

Check browser console for details.
      `
    );
  }
};

promptInput.addEventListener(
  "keypress",
  (e) => {
    if (e.key === "Enter") {
      sendBtn.click();
    }
  }
);