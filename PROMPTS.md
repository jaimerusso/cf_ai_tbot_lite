# PROMPTS.md

This document records the AI-assisted development process for the **tbot lite** project, as required by the Cloudflare AI app assignment. All interactions documented below were performed using **Claude 4.6 Sonnet**.

## 1. Project Setup & UI Architecture

- "Set up a standard React + Vite project structure optimized for Cloudflare Pages deployment."
- "How to handle dynamic background colors in Tailwind CSS v4 using the `@theme` directive directly in the CSS file?"
- "Implement a `group-hover` effect where the button background transitions to white and the text color flips to the original theme color."

## 2. Debugging (Cloudflare Workers&Pages)

- "Analyze this Cloudflare Workers build log: `...[build log]...`."
- "Analyze this Cloudflare Pages build log: `...[build log]...`."

## 3. Technical Logic & Documentation

- "Draft a professional 'About' section for my dashboard. Mention it is a 'lite' version of my tbot thesis project created for the Cloudflare Software Engineer Internship."
- "Help me structure a professional `README.md` that clearly separates my original work (Thesis/React) from AI-assisted tasks (Setup/Debugging)."

## 4. Problem Solving

- "The `items-center` class is not centering my elements in the browser inspector. Can you help me debug the Flexbox parent-child relationship in this specific React component?" -- (PS: found out what was written was 'item-center')
- "Explain why Tailwind CSS v4 might be ignoring my `tailwind.config.js` and how to migrate those settings to the new CSS-first configuration." -- (PS: CSS-first configuration. Tailwind CSS v4 doesn't use `tailwind.config.js`, it is configured in the CSS instead.)
