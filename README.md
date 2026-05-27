# WebLLM AI Chatbot

A modern browser-based AI chatbot powered by WebLLM and WebGPU.

This project runs Large Language Models entirely inside the browser without requiring any backend server or external AI API. It also includes real-time inference benchmarking and streaming token generation for analyzing local LLM performance.

---

# Features

- Browser-based local AI inference
- WebGPU acceleration
- Streaming token generation
- Real-time performance benchmarking
- Response metadata analytics
- First token latency tracking
- Tokens/sec measurement
- Markdown rendering
- Syntax-highlighted code blocks
- Modern responsive UI
- Fully client-side architecture
- No backend required
- No API keys required

---

# Tech Stack

## Frontend
- Vite
- Vanilla JavaScript
- HTML5
- CSS3

## AI & Inference
- WebLLM
- WebGPU

## Rendering
- Marked.js
- Highlight.js

---

# Performance Metrics

The chatbot tracks and displays:

- Response generation time
- First token latency
- Tokens generated
- Tokens per second
- Streaming throughput
- Model load time
- Real-time metadata during inference

---

# Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/webllm-ai-chatbot.git
```

Move into the project directory:

```bash
cd webllm-ai-chatbot
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

# Build For Production

```bash
npm run build
```

---

# Deployment

This project can be deployed directly on:

- Vercel
- Netlify

Since the application runs entirely client-side, no backend configuration is required.

---

# How It Works

The application uses WebLLM to run quantized Large Language Models directly inside the browser using WebGPU acceleration.

Inference is performed locally on the user's machine, eliminating the need for:
- cloud inference
- external APIs
- server-side LLM hosting

The chatbot streams tokens in real-time while simultaneously benchmarking model performance metrics.

---

# Research Purpose

This project was developed to explore and benchmark browser-based LLM inference using WebGPU.

The goal was to analyze:
- local inference speed
- response latency
- streaming performance
- browser-side AI execution
- WebGPU acceleration efficiency

---

# Future Improvements

- Multiple model support
- Export benchmark reports
- Conversation persistence
- GPU information overlay
- Benchmark analytics dashboard
- PWA support
- Offline caching

---

# License

MIT License

---

# Author

Anurag Rathi