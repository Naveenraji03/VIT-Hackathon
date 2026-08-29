# FAILFORGE - Autonomous AI Reliability & Vulnerability Testing Platform (V1 Hackathon MVP)

**FailForge** is an autonomous testing platform for AI applications. Its purpose is to systematically discover failure cases, hallucinations, security vulnerabilities, and logic flaws in AI systems rather than relying solely on predefined static benchmarks.

For V1, FailForge targets an **Enterprise Policy Assistant** RAG system operating over synthetic corporate policy documents.

---

## Key Features & End-to-End Loop

FailForge executes a complete autonomous testing loop:

```
TARGET RAG → TEST GENERATION → EXECUTION → STRUCTURAL EVALUATION → FAILURE DISCOVERY → ADAPTIVE exploration → RETESTING → FAILURE CLUSTERING → RELIABILITY REPORT
```

1. **Autonomous Test Generator**: Generates ~20-25 structured test cases across `EDGE_CASE`, `CONTEXT_SHIFT`, `CONTRADICTION`, `OUT_OF_SCOPE`, `PROMPT_INJECTION`, and `AMBIGUITY`.
2. **Real Test Executor**: Executes tests against the live RAG application, capturing prompt, retrieved document chunks, source document names, model response, and execution timestamp.
3. **Failure Evaluator**: Identifies unsupported claims, policy version contradictions, context failures, and prompt injection exploits using structured LLM-as-a-judge & rule-based checks.
4. **Adaptive Test Engine**: When a failure is discovered, FailForge generates targeted mutation variants to probe the boundaries of the failure region and evaluate reproduction rates.
5. **Failure Clustering**: Groups reproduced failures into semantic vulnerability clusters (e.g. *Policy Version Confusion*, *Prompt Injection Vulnerability*, *Ambiguous Allowance / Per-Diem Cap Conflict*).
6. **Transparent Reliability Report**: Computes an audited reliability percentage score with category breakdowns and actionable developer recommendations.

---

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI + Uvicorn
- **AI Abstraction Layer**: `backend/ai/provider.py` (`AIProvider` interface with `GeminiProvider` using official `google-genai` SDK and model fallback)
- **RAG Engine**: Document Chunking + TF-IDF/Term vector retrieval + RAG generation
- **Database**: SQLite via SQLAlchemy (`backend/db/database.py` and `backend/db/models.py`)

---

## Local Setup Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```ini
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
HOST=127.0.0.1
PORT=8000
```

*(Note: If `GEMINI_API_KEY` is omitted or unavailable, FailForge automatically runs in local offline rule-based fallback mode without throwing errors).*

### 2. Backend Setup & Run

In the project root directory:

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run backend automated pytest suite
python -m pytest backend/tests/test_backend.py

# Start FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```

The backend API will be running at `http://127.0.0.1:8000`. API documentation is accessible at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup & Run

In a separate terminal window:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 1-Click Demo Mode

For hackathon judges and quick testing:
1. Open `http://localhost:3000`.
2. Click the **`DEMO MODE (1-CLICK RUN)`** button in the top right corner.
3. FailForge will index the 10 synthetic policy documents, generate red-teaming tests, execute them against the target RAG, evaluate failure conditions (e.g. Leave Policy 2025 vs 2026 version conflict, IT Usage prompt injection payload), perform adaptive retesting, cluster failure modes, and present the final Reliability Report.

---

## Reliability Score Calculation

$$ \text{Reliability \%} = \left[ \frac{\text{Passed Tests} + 0.5 \times \text{Warnings}}{\text{Total Executed Tests}} \right] \times 100 $$

- **Passed Tests**: Model response accurately aligns with ground truth and active policy rules.
- **Warnings**: Minor formatting or ambiguity issues without safety violation.
- **Failures**: Contradiction of active policies, unsupported claims, or security prompt injection exploits.

---

## What is Implemented vs V2 Roadmap

### V1 Implemented (MVP)
- Replaceable AI Model Provider abstraction layer (`AIProvider` / `GeminiProvider`).
- Target RAG system with 10 synthetic corporate policy documents.
- Real test generator across 6 red-teaming categories.
- Failure Evaluator with structured JSON output & trigger detection.
- Adaptive Test Generator producing targeted mutation variants.
- Failure Clustering engine grouping related failure modes.
- Interactive React Dashboard (Target Setup, Test Run Progress, Failure Map, Failure Detail Modal, Reliability Report).
- Automated pytest suite for backend APIs and vector retrieval.

### V2 Roadmap
- `LocalModelProvider` integration for local open-source LLMs (Qwen/Llama) via Ollama/vLLM.
- Multi-target RAG benchmarking & historical trend comparison.
- Automated policy document patch generator recommendation engine.
