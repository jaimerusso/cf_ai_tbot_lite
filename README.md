# tbot lite — Cloudflare Software Engineer Internship (Summer 2026)

![CFxtbot](https://github.com/jaimerusso/cf_ai_tbot_lite/blob/main/frontend/src/assets/CFxtbot.png?raw=true)

A specialized interface showcasing a "lite" version of my **tbot** thesis project. This full-stack application was built and deployed entirely on Cloudflare's ecosystem, leveraging Workers AI for document ingestion and conversational dialogue.

**Live Demo:** [https://cf-ai-tbot-lite.pages.dev/home](https://cf-ai-tbot-lite.pages.dev/home)

---

## 🧠 Project Core: RAG Architecture

This project implements a **RAG (Retrieval-Augmented Generation)** pipeline. Unlike standard LLM implementations, this system provides specialized responses based on domain knowledge uploaded by the user at any time.

### How it works

1. **Document Ingestion (Backoffice):** Users upload plain text files through the knowledge backoffice.
2. **Vectorization & Storage:** Documents are processed and converted into embeddings stored in Cloudflare Vectorize.
3. **Contextual Retrieval:** When a user asks a question, the system searches the vector index for the most semantically relevant content.
4. **Augmented Response:** The retrieved context is injected into the LLM prompt, enabling accurate, domain-specific answers grounded in the uploaded documents — effectively reducing hallucinations.

---

## 🛠️ Technical Stack

| Layer              | Technology                                           |
| ------------------ | ---------------------------------------------------- |
| Frontend Framework | React 19 + Vite                                      |
| Styling            | Tailwind CSS v4                                      |
| Frontend Hosting   | Cloudflare Pages                                     |
| Backend Runtime    | Cloudflare Workers                                   |
| Stateful Backend   | Cloudflare Durable Objects                           |
| Async Workflows    | Cloudflare Workflows                                 |
| Vector Database    | Cloudflare Vectorize                                 |
| LLM                | Llama 3.3 (`llama-3.3-70b-instruct-fp8-fast`) — Meta |
| Embedding Model    | BGE Base EN v1.5 (`bge-base-en-v1.5`) — BAAI         |

---

## 🚀 Run Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (developed with v24.14.1)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)

### Local Development

**Backend:**

```bash
cd backend
npm install
npx wrangler login
npx wrangler vectorize create doc-search-dev --dimensions=768 --metric=cosine
npx wrangler deploy
npx wrangler dev --env dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Production Deploy

Both the frontend (Cloudflare Pages) and the backend (Cloudflare Workers) deploy automatically on every push to the main branch via GitHub integration.

Before the first production deploy, create the production Vectorize index:

```bash
cd backend
npx wrangler login
npx wrangler vectorize create doc-search --dimensions=768 --metric=cosine
```

---

## 🧑‍💻 Development & Authorship

- **Backend:** Developed following official [Cloudflare Workers and Durable Objects documentation](https://developers.cloudflare.com/durable-objects/), adhering to the platform's best practices and architectural standards.
- **Frontend:** Built with React, drawing on experience from my academic thesis (**tbot**) over the past year. Parts of the UI were inspired by and adapted from my original thesis work.
- **AI Assistance:** Claude Sonnet 4.6 was used to accelerate the development, assist with documentation, and streamline debugging of Cloudflare build logs. Detailed interaction logs can be found in `PROMPTS.md`.

---

## 📚 References

### Cloudflare Documentation

- [Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Durable Objects — Get Started](https://developers.cloudflare.com/durable-objects/get-started/)
- [Workers AI — Get Started](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)
- [Model: llama-3.3-70b-instruct-fp8-fast](https://developers.cloudflare.com/ai/models/%40cf/meta/llama-3.3-70b-instruct-fp8-fast/)
- [Build a RAG AI with Workers](https://developers.cloudflare.com/workers-ai/guides/tutorials/build-a-retrieval-augmented-generation-ai/)
- [Workflows](https://developers.cloudflare.com/workflows/)
- [Workflows — Status Values](https://developers.cloudflare.com/agents/api-reference/run-workflows/#status-values)
- [Vectorize — Get Started](https://developers.cloudflare.com/vectorize/get-started/intro/)
- [Model: bge-base-en-v1.5](https://developers.cloudflare.com/ai/models/%40cf/baai/bge-base-en-v1.5/)

### Design & Assets

- Chat UI inspired by ChatGPT and [Desktop Chat App — Figma Community](https://www.figma.com/design/LF8jQPwosW9eVoZBbDHbv3/)
- Knowledge backoffice UI inspired by the Windows filesystem explorer
- Icons: [SVG Repo](https://www.svgrepo.com/), [Free Icons](https://freeicons.io/)
