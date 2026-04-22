# 🏗️ PROJECT UNDER DEVELOPMENT 🏗️
![CFxtbot](https://github.com/jaimerusso/cf_ai_tbot_lite/blob/main/frontend/src/assets/CFxtbot.png?raw=true)

---

# tbot lite - Cloudflare Software Engineer Internship (Summer 2026)

A specialized interface showcasing a "lite" version of my **tbot** thesis project. This full-stack application was built and deployed entirely on Cloudflare's ecosystem, leveraging Workers AI for document ingestion and conversational dialogue.

**Live Demo:** [https://cf-ai-tbot-lite.pages.dev/home](https://cf-ai-tbot-lite.pages.dev/home)

## 🧠 Project Core: RAG Architecture

This "lite" version implements a robust **RAG (Retrieval-Augmented Generation)** pipeline. Unlike standard LLM implementations, this system is capable of providing specialized responses based on specific domain knowledge provided by the user anytime.

### How it works:

1. **Document Ingestion (Backoffice):** Users can upload specific files (PDFs, text) through the ingestion backoffice.
2. **Vectorization & Storage:** The system processes these documents, converting text into embeddings (vectors) that represent their semantic meaning.
3. **Contextual Retrieval:** When a user asks a question in the **Dialogue** interface, the system searches the ingested data to find the most relevant snippets of information.
4. **Augmented Response:** This retrieved context is fed into the LLM (running on Cloudflare Workers AI), allowing it to generate accurate, specialized answers rooted in the provided documents, effectively eliminating hallucinations and providing domain-specific expertise.

---

## 🛠️ Development & Authorship

This project is a full-stack implementation built for Cloudflare Software Engineer Internship (Summer 2026) application.

- **Backend:** Developed following official [**Cloudflare Workers (Durable Objects) documentation**](https://developers.cloudflare.com/durable-objects/), ensuring the project adheres to the platform's best practices and architectural standards.
- **Frontend:** Built with **React**, leveraging experience from my academic thesis (**tbot**) over the past year. Part of the UI code was inspired by and adapted from my original thesis work.
- **AI Assistance:** **Claude 4.6 Sonnet** was used to accelerate initial setup, assist with documentation, and streamline the debugging of Cloudflare build logs. Detailed interaction logs can be found in `PROMPTS.md`.

---

## 🤖 AI Collaboration Disclosure

In this project, AI was used as a development "co-pilot" specifically for:

- **Documentation:** Assisting in drafting and structuring this `README.md` as well as the `PROMPTS.md`.
- **Error Resolution:** Analyzing build logs to quickly identify version conflicts and TypeScript errors.
- **Boilerplate:** Generating initial project structures and standard configuration files.
- **UI Styling:** Support with Tailwind CSS v4 directives and complex CSS transitions.

---

## 🚀 Technical Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Infrastructure:** Cloudflare Pages
- **Backend:** Cloudflare Workers
- **LLM:** Llama 3.3 (llama-3.3-70b-instruct-fp8-fast)
- **Embedding:** BAAI General Embedding (bge-base-en-v1.5)
