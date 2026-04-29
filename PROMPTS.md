# Prompt Guide — cf_ai_tbot_lite

A collection of prompts used during development, organized by topic and layer.

---

## 🧠 General Development

### Syntax & Language Help

- "What is the correct syntax for X? For example, how do I use `onChange` on an input in React?"
- "How do I format a date into a specific format like `DD/MM/YYYY HH:mm`?"
- "How do I check if a callback returns true for at least one element in an array?"
- "How do I send a request with FormData in the body using axios?"

### Code Organization

- "Help me organize this component — extract repeated logic into helper functions and group related code."
- "Help me generate a `PROMPTS.md` with the prompts I used, organized by topic and layer."
- "Help me generate a `README.md` for this project."

---

## 🖥️ Frontend

### React & TypeScript

- "What is the correct syntax for X in React/TypeScript? For example, `onChange` on a file input."
- "How do I handle drag and drop for file uploads in React?"
- "How do I make this column width behave correctly in a table?"
- "My document polling stops working after the first request on Cloudflare Pages — what is the reason and how do I fix it?"
- "Review this frontend implementation that tracks pending upload and delete actions. Does it cover all edge cases? Point out any bugs and explain why."
- "When documents are returned from the API, I want to keep locally added 'processing' entries that haven't arrived yet, and preserve the 'deleting' status for documents pending deletion to avoid stale server state. How do I implement this?"

### Tailwind CSS

- "How do I do X in Tailwind? For example, how do I set a fixed column width or control text overflow?"
- "Something is not visually in the right place — can you help me identify the issue from the code?"
- "How do I correctly render markdown received from an LLM response?"

---

## ⚙️ Backend

### Routing & Middleware

- "Help me with the correct path syntax for routing requests to the right handler in Hono."
- "Help me configure CORS for local development and production."
- "How do I automatically define different API base URLs for dev and production environments?"

### Durable Objects

- "Explain with simple examples how to use a Durable Object to store, retrieve, and delete objects."
- "Why is there a race condition inside a Durable Object? I expected it to be sequential."
    - _Answer: During external I/O awaits (e.g. AI API calls), the DO releases the executor and can accept new calls — use `ctx.blockConcurrencyWhile()` to guarantee atomicity._
- "Does it make sense for each WebSocket chat interaction to create a new Workflow instance on every incoming message?"

### Cloudflare AI & Vectorize

- "How can I list all vectors stored in a Vectorize index?"
- "Generate a logic to add a search tool description per document that can later be removed by filename. Each line should contain the document name and its summary."
- "The chatbot is not identifying the tools correctly — how can I improve the tool descriptions and prompts for the LLM?"
- "The tool result is not being acted upon by the model — how should I structure the message array so the model follows through on tool calls?"

### Chunking Strategy

- "What is a good character count per chunk and a good overlap value to avoid losing context between chunks when splitting documents for RAG ingestion?"

### File Handling

- "Write a script to verify if an uploaded file contains only plain text."
- "How do I handle multipart FormData file uploads on the backend?"

### Debugging

- "I'm getting this error: [paste error]. What is happening and how do I fix it?"
- "My feature works locally but not on Cloudflare — what could be different?"
