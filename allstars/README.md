# AuditAllstars

**An AI-powered audit workflow platform built by auditors, for auditors.**

AuditAllstars is a production-ready platform where audit professionals create, share, and execute visual workflow templates - with an AI copilot that runs each step against real data. Unlike general-purpose AI agents that demand open-ended system access, AuditAllstars is **secure and scoped**: the AI operates strictly within the boundaries of defined workflow steps, with no ability to modify source systems or take unsupervised action.

> Built entirely in [Claude Code](https://claude.ai/code) by a cross-industry team of auditors.

---

## The Problem

Auditors across every industry repeat the same manual processes -mapping controls, sampling transactions, verifying vendor details, reconciling accounts. Existing AI tools are either too generic (chatbots with no audit context) or too dangerous (autonomous agents with unrestricted system access). Audit teams need AI that understands their methodology **and** respects the boundaries their profession demands.

## The Solution

AuditAllstars delivers four integrated components that together form a complete audit execution platform:

### 1. Workflow Library

A marketplace of reusable, visual audit workflows built with React Flow. Each workflow is a directed graph of audit steps -from pre-planning through reporting -with dependencies, instructions, and expected deliverables defined at each node.

- **Browse, search, and filter** by audit phase (PrePlanning, Planning, Fieldwork, Reporting)
- **Create workflows visually** with drag-and-drop, or import from JSON
- **Export and share** templates across teams and organizations
- **Rate, favorite, and download** community-contributed workflows

The [`workflow_library/`](workflow_library/) folder contains a collection of workflow templates for a variety of different audits that the team built and tested over the course of the hackathon. These JSON files can be imported directly into the platform.

### 2. Multi-Agent AI Copilot (Orchestrator Architecture)

A Gemini-powered multi-agent system that executes audit workflows step-by-step:

- **Orchestrator** -The primary agent that manages workflow execution, tracks progress, and delegates specialized tasks to sub-agents
- **Wrangler** -A dedicated data agent that queries enterprise systems (via MCP) to pull transaction data, employee records, vendor details, and financial entries
- **Analyzer** -A code-execution agent that runs Python for statistical analysis, anomaly detection, pattern recognition, and data visualization
- **Step Executor** -Parallel execution engine that processes independent workflow steps concurrently, assembling upstream results as context for downstream steps

Critically, each agent is **scoped to its role** -the orchestrator cannot access raw data, the wrangler cannot modify workflows, and no agent can take action outside its defined tool set. This is not an open-ended AI assistant; it is a controlled execution pipeline.

### 3. LLM-as-a-Judge (Gamified Evaluation)

A novel two-phase evaluation system that scores audit findings objectively:

- **Phase 1: User-facing Judge** -Collects the auditor's submitted findings and presents results. This agent has **no access** to the answer key, preventing any leakage of known issues.
- **Phase 2: Isolated Matcher** -A separate LLM instance, created on-the-fly in its own context, compares findings against the known issues database and returns structured match results. It has the full answer key but **no conversation history**.

This architecture ensures fair, unbiased scoring while enabling a **leaderboard and gamification layer** that motivates audit teams to dig deeper and find more issues.

### 4. Bluth Company MCP Server (Mock Enterprise Data)

A SAP CAP-based OData v4 mock server that simulates a realistic enterprise environment with **embedded audit anomalies** -ghost employees, suspicious vendor relationships, unauthorized transactions, segregation-of-duties violations, and more.

- Serves as the data backbone for AI copilot demonstrations
- Exposes a Model Context Protocol (MCP) endpoint for seamless agent integration
- Contains 25+ entity types across HR, Finance, Procurement, and IT domains
- Deployed and accessible at [data.auditallstars.com](https://data.auditallstars.com)

---

## Why This Matters

### Secure and Scoped -Not Another Open Agent

Most AI agent frameworks give the model broad access and hope for the best. AuditAllstars takes the opposite approach:

- **Workflow-defined scope** -AI only executes the steps defined in the workflow template
- **Role-separated agents** -Each sub-agent has a strict tool set with no cross-access
- **Read-only data access** -Agents query enterprise data but cannot modify it
- **Isolated evaluation** -The judge system uses context separation to prevent answer-key leakage
- **Human-in-the-loop** -Auditors review and approve each step's output before proceeding

This design reflects how auditors actually work: within defined procedures, with clear boundaries, and with professional judgment at every decision point.

### Built by Auditors, for Auditors

Our team is composed of audit professionals from across industries -financial services, technology, healthcare, manufacturing, and the public sector. Every design decision reflects real audit methodology:

- Workflows mirror actual audit phases (pre-planning through reporting)
- Step instructions follow professional standards (ISA, IIA, SOX)
- The evaluation system mirrors the quality review process in audit practice
- Data anomalies in the mock server are based on real-world fraud and control failure patterns

### Works Today

This is not a concept or a slide deck. AuditAllstars is a **deployed, functional platform**:

- **[auditallstars.com](https://auditallstars.com)** -The main platform: workflow library, AI copilot, and gamified evaluation
- **[data.auditallstars.com](https://data.auditallstars.com)** -The Bluth Company MCP server providing mock enterprise data
- Full-stack application running on Google Cloud (Cloud Run, Cloud SQL, Redis)
- Real AI copilot executing workflows against live data
- Authentication, rate limiting, and session management in production

---

## Architecture

```
                         AuditAllstars Platform
    +---------------------------------------------------------+
    |                                                         |
    |  Workflow Library          AI Copilot (Multi-Agent)     |
    |  +------------------+     +-------------------------+   |
    |  | Browse & Search  |     |     Orchestrator        |   |
    |  | Create & Edit    |     |    /     |      \       |   |
    |  | Import & Export  |     | Wrangler | Analyzer     |   |
    |  | Rate & Favorite  |     |   (MCP)  | (Python)     |   |
    |  +------------------+     +-----+-------------------+   |
    |                                 |                       |
    |  Gamification                   |                       |
    |  +------------------+     +-----v-------------------+   |
    |  | LLM-as-a-Judge   |     | Bluth MCP Server        |   |
    |  | Leaderboard      |     | (SAP CAP / OData v4)    |   |
    |  | Score Tracking   |     | 25+ Entity Types        |   |
    |  +------------------+     +-------------------------+   |
    |                                                         |
    +---------------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, React Flow |
| Backend | Next.js API Routes, Prisma ORM, PostgreSQL |
| AI | Google Gemini (multi-agent), MCP integration |
| Auth | NextAuth.js (LinkedIn OAuth) |
| Infrastructure | GCP Cloud Run, Cloud SQL, Upstash Redis |
| Mock Data | SAP CAP, OData v4, SQLite |
| Development | Built with Claude Code |

---

## Industry Agnostic by Design

AuditAllstars is not tied to any single industry or audit type. The platform supports:

- **Financial audits** -Journal entry testing, bank reconciliation, vendor analysis
- **IT audits** -Access reviews, segregation of duties, change management
- **Compliance audits** -Regulatory requirement mapping, control testing, evidence collection
- **Operational audits** -Process efficiency analysis, risk assessment, benchmarking
- **Forensic investigations** -Anomaly detection, pattern analysis, transaction tracing

Any audit process that can be expressed as a sequence of steps with dependencies can be modeled, shared, and executed in AuditAllstars. The workflow library grows with every team that contributes -making the platform more valuable for all auditors, regardless of industry.

---

## Team

A cross-industry team of audit professionals who believe AI should augment auditor judgment, not replace it. We built AuditAllstars because we live the problem every day -and because we know that the best audit technology is the kind that respects how auditors actually work.
