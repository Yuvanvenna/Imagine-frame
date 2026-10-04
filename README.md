#RUN commands
1.git clone <this repo url>
2.cd Imagine-frame
3.open two terminals in the same directory
terminal 1:
1.cd backend
2.python -m venv venv
3..\venv\Scripts\activate
4.pip install -r requirements.txt
5.uvicorn main:app --reload --port 8000

terminal 2:
1.cd frontend
2.npm install
3.npm run dev


**for developer**
backend: .\backend\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
frontend: npm run dev

# ImagineFrame (Wire2React)

> **Transform rough sketches, paper napkins, and whiteboard wireframes into live, interactive, and beautifully styled React + Tailwind CSS components in seconds.**

ImagineFrame is an AI-powered visual engineering workspace powered by **Gemma 4**. It bridges the intent gap between messy hand-drawn ideas and production-ready frontend code—interpreting design hierarchy, recognizing brand logos and layouts, and generating accessible, responsive UI code rendered in an isolated sandbox.

---

## Key Features

### 1. Multi-Modal Wireframe Input
* **Interactive Whiteboard & Drawing Board**:
  * High-resolution canvas with fine, medium, and bold brushes.
  * Ink color palette (Charcoal, Blue, Purple, Red, Emerald) and eraser.
  * Shape tools for freehand pen, straight lines, rectangles, and circles.
  * Engineering dot-grid overlay and complete Undo / Redo history.
* **Wireframe Stencil & Stamp Library**:
  * 1-click UI wireframe primitives to quickly mock up interfaces without freehand drawing:
    * `+ Navbar`: Top navigation bar with logo placeholder, navigation links, and action button.
    * `+ Card`: Structured feature card with preview frame, title, description lines, and button.
    * `+ Button`: Call-to-action button with border and icon placeholder.
    * `+ Input`: Form input box with field label and placeholder text.
    * `+ Avatar`: User avatar silhouette with circular framing.
    * `+ Metric`: KPI stat card with value, delta percentage badge, and trend indicator.
* **Camera Snap Mode**:
  * Capture physical napkin sketches, notebook drawings, or dry-erase whiteboards directly using your webcam.
* **Drag-and-Drop & File Upload**:
  * Upload PNG, JPG, or WEBP wireframes and design mockups.
* **Instant Benchmark Demo Samples**:
  * Built-in samples (e.g. Napkin Auth, Whiteboard SaaS) for immediate testing.

---

### 2. Gemma 4 Vision & Intent Synthesis
* **Intent Inference over Literal Copying**:
  * Rather than copying crooked lines or hand tremors, the engine interprets lines as semantic flexbox/grid containers.
  * Automatically injects accessible form attributes (`aria-label`, `type="email"`, `type="password"`, focus rings, and responsive wrapping).
* **Brand & Domain Recognition**:
  * Strictly transcribes handwritten text without hallucinating or converting brand names into generic software jargon (e.g., recognizing `AUDI` as the automotive brand, not generic text).
  * Recognizes iconic logos and marks (e.g., 4 interlocking rings for Audi, 3-pointed star for Mercedes, swoosh marks).
  * Automatically adapts to the identified domain (e.g., automotive showcases, e-commerce storefronts, personal portfolios, SaaS platforms).
* **Live Streaming Token Generation (SSE)**:
  * Server-Sent Events (SSE) stream tokens progressively with a steady, flicker-free generation HUD.

---

### 3. Design System Adaptation
Instantly apply curated design system presets with a single click:
* **Shadcn/UI Modern**: Dark zinc backgrounds (`zinc-950`), crisp 1px borders, subtle focus rings, and clean SaaS typography.
* **Tailwind Clean**: Slate canvas (`slate-900`/`slate-950`), soft gradients (`indigo-500` to `violet-600`), and rounded-2xl containers.
* **Material Accent**: Elevated cards with deep shadows, rich emerald & teal accents, and floating badges.
* **Dark Cyberpunk**: High-contrast void backgrounds (`zinc-950`, black) with neon cyan, lime, and fuchsia glowing accents.

---

### 4. Interactive Live Sandbox
* **Real-Time Component Execution**:
  * Sandbox runs inside an isolated iframe powered by the Tailwind CSS CDN and the Lucide Icon Engine.
* **Micro-App Interaction Simulation**:
  * Buttons, inputs, and forms include working click handlers, event state management, and real-time floating toast notifications.
* **Viewport Switcher**:
  * Test responsiveness across **Desktop** (fluid 100%), **Tablet** (768px), and **Mobile** (375px) device frames.
* **Backdrop Theme Switcher**:
  * Toggle between dark (`slate-950`) and light (`slate-50`) backgrounds to preview contrast.
* **Fullscreen Presentation Mode**:
  * Expand the sandbox to full screen for presentations and reviews.
* **State Reset & External Popout**:
  * 1-click reload resets micro-app states and form fields; open sandbox in a dedicated browser tab anytime.

---

### 5. Multi-Turn UI Refinement ("Chat to Edit")
* **Conversational Modifications**:
  * Refine the generated UI iteratively without re-uploading or redrawing from scratch.
  * Example prompt: *"Add a search bar to the navigation and make the submit button emerald with an arrow icon."*
* **1-Click Quick Tweak Suggestions**:
  * Pre-built refinement chips: `+ Add Search Bar`, `🎨 Emerald Accent Palette`, `📱 Responsive Mobile Menu`, `✨ Add 3-Column Metrics`, `⚡ Dark Cyber Glow`.
* **Version History & Revert**:
  * Undo stack allows you to revert back to previous iterations or the original sketch version at any time.

---

### 6. Developer Code Export
* **Production React (TSX) Component**:
  * Converts markup into a typed, exported functional React component (`export default function WireframeComponent() { ... }`).
  * Replaces HTML `class` with `className` and `for` with `htmlFor`.
  * Detects all Lucide icons used (`data-lucide="..."`) and generates proper top-level imports (`import { Mail, Lock, ArrowRight } from 'lucide-react'`).
* **HTML Sandbox Markup**:
  * Export pure self-contained HTML ready to drop into any vanilla web project.
* **1-Click Copy & File Download**:
  * One-click clipboard copy and file export (`.tsx` or `.html`).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Backend API** | FastAPI, Uvicorn, Pillow (PIL), Python-dotenv, Requests |
| **AI Model** | Google GenAI SDK (`google-genai`), Gemma 4 (`gemma-4-26b-a4b-it` / `gemma-4-31b-it`) |
| **Live Sandbox** | Sandboxed HTML5 iframe, Tailwind CSS CDN, Lucide Engine (UNPKG) |

---




## License

This project is licensed under the [MIT License](LICENSE).
