# Sonal Singh — Agent Knowledge

<!--
  This is the document the AI agent answers from. Edit it like a normal doc.
  Each "## " heading below becomes ONE retrievable chunk for the RAG, and the
  heading text is its title.

  Keep it work-only. Do NOT put contact details (email, phone, DMs) here — the
  agent redirects those to the Contact section via isContactIntent().

  One heading is special and referenced by slug in code — keep it as-is:
    "## Contact policy" -> contact-policy
-->

## Who Sonal is

Sonal Singh is a Software Engineer at PetroIT Software Solutions, based in Gurugram, India, with over two years of experience. She works on agentic AI and LLM systems and the backends underneath them — MCP servers, RAG pipelines, and multi-provider LLM routing, running on production Java and Spring Boot microservices she owns end to end. Her work centres on turning complex business requirements into clean, scalable systems that people actually depend on. Her own summary of her approach: understand the domain deeply, write clean and testable code, and ship solutions users genuinely rely on.

## Current focus

Sonal is focused on agentic AI systems: LLM orchestration, MCP tooling, retrieval-augmented generation, knowledge-based bots, prompt engineering, and the guardrails and reliability work that lets agents actually run in production — all built on top of real backends rather than as demos. She also works with spec-driven software development using AI tools, an approach she used to win a company hackathon. She is actively exploring agentic AI systems and distributed architectures. She describes her philosophy as writing code that scales, not just code that works.

## What Sonal builds at PetroIT

<!-- The first 2-3 sentences here are what the extractive fallback returns
     verbatim when the LLM is unavailable. Keep them as the direct answer. -->

Sonal builds backend and AI systems for PetroIT's enterprise platforms. She works primarily with Java and Spring Boot to build microservices, REST APIs, database-backed services, and multitenant SaaS capabilities. Her work has increasingly moved into agentic AI, where she builds AI-powered workflows and integrates agents with enterprise software. Alongside that she contributes to system architecture, PostgreSQL performance optimisation, and cloud-based deployments on AWS with Docker, Jenkins, and GitHub Actions. She works in an Agile team, translating business requirements into technical specs and providing production support and root-cause analysis for mission-critical APIs.

## Engineering outcomes at PetroIT

Sonal has achieved measurable, quantified results at PetroIT — these are her main engineering achievements and the impact she has delivered. She engineered a role-based access control framework with Spring Security that cut security-related support tickets by 25% and met enterprise audit compliance. She optimised PostgreSQL schemas and indexed and tuned over 20 queries for a 40% reduction in response times. She built a real-time push notification system on the Web Push API that lifted user engagement by 35%. She holds SonarQube code quality at 95% across multi-tenant services, and she deployed knowledge-based bots using LLMs and retrieval-augmented generation that cut manual support lookups and sped up user self-service. The enterprise platform she works on serves over 5,000 users.

## Career progression at PetroIT

Sonal's current job title is Software Engineer at PetroIT Software Solutions in Gurugram, and she has been promoted twice. She joined as a Software Developer Intern in February 2024, became an Associate Developer in August 2024, and progressed into her current Software Engineer role. That's two promotions in roughly two years at the same company, and her scope grew with it — from building UI components as an intern to owning the architecture of a multitenant SaaS platform and its agentic AI layer. PetroIT is where she has spent her whole career so far.

## Software Developer Intern at PetroIT Software Solutions

Sonal started at PetroIT Software Solutions as a Software Developer Intern in Gurugram from February 2024 to July 2024. She integrated ApexCharts for interactive data visualisation — bar, line, pie, and area charts — replacing static CSV exports and improving stakeholder decision-making. She optimised over 20 SQL queries and backend data workflows using indexing strategies, cutting retrieval time by 40%. She built over 20 responsive, accessible UI components alongside UI/UX designers, ensuring pixel-perfect rendering across mobile, tablet, and web. She maintained a 95%-plus code quality score in SonarQube through daily stand-ups, sprint planning, and bi-weekly code reviews.

## Kalp — production MCP server

Kalp is a production MCP (Model Context Protocol) server Sonal designed and built, embedded inside Mozaic. It publishes 15 tools across six specialised agents — reporting, analysis, form-fill, document-linking, LOV management, and extraction — with tool-calling, persisted chat memory, and streaming responses. She implemented multi-provider LLM routing through a custom ModelRouter covering Claude, GPT, Ollama, DeepSeek, NVIDIA NIM, and OpenRouter, plus a pgvector-backed RAG and document-fingerprinting pipeline. It ships through Docker and Jenkins across dev, QA, and alpha environments, with JWT and OAuth2-secured endpoints serving external clients. Kalp is the clearest example of her production agentic AI work.

## Mozaic — multitenant SaaS platform

Mozaic is the multitenant SaaS platform Sonal owns the architecture and buildout of at PetroIT. It is built in Java with Spring Boot, microservices, and PostgreSQL, and handles over a million requests while keeping a modular architecture. She implemented Spring Security RBAC across multi-tenant services, handling permission edge cases and auth failures, and holds SonarQube quality at 95%. She indexed and tuned over 20 PostgreSQL queries to cut response times by 40%, and scripted build and deploy automation on GitHub Actions and AWS EC2 and S3. She tracks and triages issues through SIT, UAT, and performance testing in an Agile team, and reviews the Angular components that consume the REST APIs. Kalp, her MCP server, lives inside Mozaic.

## Flight61 — aviation safety and pilot-training analytics

Flight61 is an aviation safety and pilot-training analytics platform Sonal built for Chimes Aviation Academy. She wrote a framework-free rules engine — around 19 independent rules, 319 JUnit tests, roughly 46,000 lines in Java 21 and Spring Boot 3.3.5 — to catch and grade safety events from per-second flight telemetry. She set up asynchronous ingestion pipelines on dedicated thread pools for flight telemetry, sortie logs, and nightly CRM syncs so none of it blocks live HTTP traffic, and wired MySQL with Hibernate for persistence. She integrated the Anthropic Claude API to turn structured safety data into plain-English debrief narratives, and built an admin AI chatbot answering natural-language questions against a read-only database view. It also has WhatsApp Cloud API and Zoho CRM webhook integrations for automated alerts and data sync.

## Anuvaad — AI-powered multilingual enterprise platform

Anuvaad is a multitenant AI-powered translation and multilingual enterprise platform Sonal has been building since 2026, in Java and Spring Boot. She built resilient multi-LLM job orchestration across Mistral, LLaMA, Gemma, and GPT-class models, with automatic retries, rollback, and idempotent re-processing so a partial failure never corrupts the output, plus a work-stealing batch pipeline. It exposes secure external REST APIs with webhook integrations, RBAC, governance-based approval flows built in from the start, and real-time SSE progress tracking.

## Knowledge-based bots — multi-agent architecture

Since 2026 Sonal has been designing a multi-agent knowledge-bot architecture at PetroIT, where each agent is scoped to its own domain, tools, and data, unified through a shared orchestration layer. Least-privilege tool access is enforced at the middleware layer, and a shared vector memory system enables secure cross-agent knowledge sharing. These bots use LLMs and retrieval-augmented generation to surface answers from internal documentation, cutting manual support lookups and speeding up user self-service.

## Reliability and AI governance work

Sonal owns agent reliability end to end: prompt design, tool-calling, guardrails, retries, timeouts, idempotent processing, and rollback handling, plus validation logic that keeps AI-generated output stable in a live system. She authored and presented an AI adoption roadmap and governance plan to engineering leadership, translating technical capability into a business-readable strategy with a 30/60/90-day rollout plan — an example of her translating technical work into plans non-technical stakeholders can act on.

## Education

Sonal holds a Bachelor of Engineering in Computer Science from Chandigarh University in Mohali, India, studying from August 2020 to July 2024, graduating with an 8.15 CGPA. She has a strong computer science foundation covering data structures, operating systems, and databases.

## AI Trailblazer Hackathon win — Receipt Slayer

Sonal won the AI Trailblazer Hackathon in 2026 with a project called Receipt Slayer, taking a first-place prize of ₹2 lakh. The hackathon was organised by PetroIT Software Solutions, her employer, so this is a company achievement rather than a personal side project, and Receipt Slayer was built by a team rather than solo. The team built it using spec-driven software development with AI tools — writing a rigorous specification first and driving the implementation from it, which is what let them ship something complete inside a hackathon window. Competing pushed her to architect under extreme constraints, collaborate across a team, and present a production-ready demo with confidence.

## Receipt Slayer — AI expense management app

Receipt Slayer is an AI-powered expense management app and the project that won the PetroIT-organised AI Trailblazer Hackathon in 2026, with a ₹2 lakh prize. It was a team build, not a solo one. It runs on a multi-model pipeline: a receipt image goes through OCR text extraction, then LLM categorisation, then a database insert, with monthly reporting and anomaly flagging on top. The Claude API provides natural-language financial insights. The team also produced a full business requirements document, pitch deck, and architecture diagrams. Built with React Native, Node.js, PostgreSQL, the Claude API, OpenAI, and OCR, using spec-driven development with AI tools.

## TaskFlow AI — personal project

TaskFlow AI is Sonal's own personal project, built outside work. It is a full-stack AI task manager with real-time multi-user collaboration over WebSocket using STOMP. It uses JWT authentication with short-lived access tokens, refresh-token rotation, and Redis token blacklisting. Spring AI with GPT-4o-mini powers intelligent task suggestions and automatic prioritisation, and Redis read-through caching relieves PostgreSQL under concurrent load. Built with Spring Boot, Next.js, TypeScript, PostgreSQL, and Redis. In development since 2024 and live at taskflowwithai.netlify.app. She also wrote a full business requirements document for it.

## Omnifood and DentalCare — early front-end projects

Before moving into backend and AI engineering, Sonal built two front-end projects to sharpen her craft. Omnifood is a responsive food delivery landing page in HTML, CSS, and vanilla JavaScript. DentalCare is a dental clinic site in React with appointment scheduling. Both are from 2023 to 2024 and live on her GitHub, but they are early pieces and not where her focus is now. For front-end skills, the stronger examples are the React in TaskFlow AI and the voice agent on this site.

## GID Supervision — field supervision and workforce management

GID Supervision is an end-to-end supervision platform Sonal built for managing field agents, assignments, and real-time status tracking. It provides role-based dashboards for supervisors and agents, attendance logging, task dispatch, and live reporting, with a responsive UI supporting both desktop supervisors and mobile field workers. Built with Java, jQuery, Node.js, PostgreSQL, REST APIs, ApexCharts, and the Web Push API. In development since April 2024 and live at gidsupervision.netlify.app.

## Portfolio voice agent — this agent

The agent you're talking to right now is a project in its own right, and Sonal built it. It's a retrieval-augmented voice agent running on her own curated knowledge base: speech-to-text and streaming text-to-speech proxied through her own serverless functions so no API key ever reaches the browser, semantic retrieval with an embedding cache invalidated by a content signature, keyword retrieval as a fallback, browser-side voice activity detection that ends a turn on silence, and hard guardrails that short-circuit sensitive questions before they ever reach the model. Every layer degrades gracefully — if the language model is unavailable it returns an extractive answer instead of an error. Built with React, the Web Audio API, MediaRecorder, MediaSource streaming, and Netlify Functions. The source is on her GitHub, and you can try it in the Ask Me Anything section of this site.

## Technical stack and skills

Sonal's stack and tech stack in short: Java with Spring Boot on the backend, React and Next.js on the front end, PostgreSQL for data, LLM and RAG tooling for the AI layer, and AWS with Docker for deployment. In full, her languages are Java, Python, JavaScript, TypeScript, SQL, HTML5, CSS3, and jQuery. Her frameworks are Spring Boot, Spring MVC, Spring Data JPA, Spring Security, Spring AI, Hibernate, Next.js, React, Bootstrap, and Maven. Her databases and data stores are PostgreSQL, MySQL, MongoDB, Redis, RabbitMQ, Firebase, and Supabase.

## Backend and architecture skills

On the backend Sonal works with RESTful APIs, MVC architecture, microservices, JWT and session authentication, WebSocket with STOMP, CRUD systems, JSON and API integration, data ingestion, debugging, and backend automation. Her tooling covers Git, GitHub, GitHub Actions, Docker, CI/CD pipelines, AWS EC2 and S3, cloud deployments, IntelliJ IDEA, VS Code, Postman, n8n, webhooks, Linux, and production support.

## AI and agentic engineering skills

Sonal's agentic AI stack is LangGraph, LangChain, MCP (Model Context Protocol), FastAPI, multi-agent orchestration, and multi-provider LLM routing across Claude, GPT, Gemini, Ollama, DeepSeek, NVIDIA NIM, and OpenRouter, plus prompt engineering and tool and function calling. On retrieval she does RAG pipeline design, pgvector, Qdrant, document fingerprinting, and retrieval optimisation. She also works with spec-driven development using AI tools, and uses Claude Code, Cursor, and GitHub Copilot day to day. She has shipped production agentic systems — Kalp, the knowledge-based bots, Anuvaad, and the Flight61 chatbot. The voice agent you're talking to right now is also hers: RAG over a curated knowledge base, with speech-to-text and text-to-speech wired through her own serverless proxies.

## Integrations and automation skills

Sonal builds REST and webhook API integrations end to end — authentication, data mapping, and error handling — connecting to third-party CRMs and messaging platforms. She has integrated Zoho CRM and the WhatsApp Cloud API in production, and works with n8n and JSON-based integrations. On the reliability side she handles retries, timeouts, idempotent processing, rollback handling, and guardrails and validation for AI outputs, with JWT, OAuth2, and RBAC for security.

## Certifications

Sonal holds three certifications: SQL Using MySQL; AWS Cloud Solutions Architect from Coursera; and a Full Stack Web Development Bootcamp certificate. She pursues certifications for the structured deep-dives they demand rather than the credential alone — from cloud architecture fundamentals to advanced Java frameworks. All three certificates are linked in the Journey section of this site.

## Availability, hiring, and what she is looking for

Yes, Sonal is available and actively open to new job opportunities right now. Her notice period is 30 days. She is currently based in Gurugram, also called Gurgaon, in India, and she is open to relocation — she is willing to relocate for the right role. She works in IST at UTC+5:30 and her typical response time is same day. She is open to a full-time role, a freelance project, or just a good conversation about tech, and she is interested in hiring conversations. She is especially interested in roles involving AI and LLM engineering, Java and Spring Boot, and scalable backend systems. If you are recruiting or want to hire her, the Contact section of this site is the place to start.

## Remote, hybrid, or onsite work

Sonal has not stated a preference between remote, hybrid, or onsite arrangements, so I don't want to speak for her on that — it's worth asking her directly through the Contact section. What I can confirm is that she is based in Gurugram, India, is open to relocating, and has a 30-day notice period.

## Track record in numbers

Across her career Sonal has over two years of professional experience, has shipped around 45 features, has impacted more than 5,000 users, and maintains seven active projects. She has been promoted twice at PetroIT, from intern to Associate Developer to Software Engineer, and won a ₹2 lakh company hackathon prize. Specific measured results include a 40% reduction in database query response times, a 25% drop in security-related support tickets, a 35% lift in user engagement from push notifications, a 40% decrease in data retrieval time, and a 95%-plus SonarQube code quality score.

## Resume

Sonal's resume is downloadable from the "resume" button in the top navigation of this site, and again from the Contact section at the bottom. It covers her work as a Software Engineer at PetroIT Software Solutions — Kalp and the MCP server work, multi-provider LLM routing, RAG pipelines, and the Java and Spring Boot backend underneath — along with Flight61 and Anuvaad, her education at Chandigarh University, and her full technical stack, in more detail than this conversation can.

## Contact policy

The best way to reach Sonal is through the Contact section at the bottom of this site — it has her email, LinkedIn, GitHub, and phone number all in one place. I won't read out personal contact details in this chat, but everything you need is right there on the page. She is based in Gurugram, India, works in IST, has a 30-day notice period, and usually replies the same day.
