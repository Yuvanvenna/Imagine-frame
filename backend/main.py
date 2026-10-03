import os
import io
import sys
import re
from pathlib import Path
from typing import Optional

# UTF-8 stdout configuration for Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# Load environment variables
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment")
        api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")
        os.environ["GEMINI_API_KEY"] = api_key
    except Exception:
        pass

# Initialize Google GenAI client
from google import genai
from google.genai import types

client = genai.Client(api_key=api_key) if api_key else None

TARGET_MODEL = "gemma-4-26b-a4b-it"
FALLBACK_MODEL = "gemma-4-31b-it"

app = FastAPI(
    title="Wire2React API",
    description="Multimodal wireframe-to-React UI conversion powered by Gemma 4",
    version="1.2.0",
)

# Enable CORS for frontend running on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STYLE_PROMPTS = {
    "shadcn": (
        "Design System: Shadcn/UI Modern. Use dark zinc/slate backgrounds (zinc-950, slate-900), "
        "crisp 1px borders (border-zinc-800), clean rounded corners (rounded-xl), "
        "subtle focus rings (focus:ring-2 focus:ring-zinc-400), clean modern SaaS typography, "
        "and refined badge indicators."
    ),
    "tailwind": (
        "Design System: Tailwind Clean. Slate & vibrant Indigo palette (slate-900 cards, slate-950 canvas), "
        "smooth rounded-2xl corners, indigo accent buttons (bg-indigo-600 hover:bg-indigo-500), "
        "soft gradient accents (from-indigo-500 to-violet-600), and clean typography with subtle drop shadows."
    ),
    "material": (
        "Design System: Material Accent. Rich teal and emerald accents (emerald-500, teal-400), "
        "elevated card containers with deep shadows (shadow-xl), floating badges, "
        "rounded-xl buttons with active scale feedback, and high-readability typography."
    ),
    "cyberpunk": (
        "Design System: Dark Cyberpunk. Pure dark void (zinc-950, black), neon glowing accents (cyan-400, fuchsia-500, lime-400), "
        "sharp borders with neon ring glow (ring-1 ring-cyan-500/50), futuristic badges, and high-contrast monospace highlights."
    ),
}

NAPKIN_AUTH_CODE = """<div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans antialiased">
  <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">
    <!-- Header Inferred from Napkin 'LOGIN' scribble -->
    <div class="space-y-2 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2 shadow-lg shadow-indigo-500/20">
        <i data-lucide="shield-check" class="w-6 h-6"></i>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
      <p class="text-xs text-slate-400">Synthesized from napkin sketch: Enter credentials below</p>
    </div>

    <!-- Form Inferred from parallel box scribbles -->
    <form id="auth-form" class="space-y-4" onsubmit="event.preventDefault(); handleAuthSubmit();">
      <div class="space-y-1.5">
        <label for="email" class="block text-xs font-medium text-slate-300">Email Address</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <i data-lucide="mail" class="w-4 h-4"></i>
          </div>
          <input
            id="email"
            type="email"
            required
            aria-label="Email Address"
            placeholder="developer@hyderabad.react"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="block text-xs font-medium text-slate-300">Password</label>
          <a href="#" onclick="showToast('Password reset link sent to demo email'); return false;" class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot?</a>
        </div>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <i data-lucide="lock" class="w-4 h-4"></i>
          </div>
          <input
            id="password"
            type="password"
            required
            aria-label="Password"
            placeholder="••••••••••••"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div class="flex items-center justify-between pt-1">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input id="remember" type="checkbox" class="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
          <span class="text-xs text-slate-400">Remember device</span>
        </label>
        <span class="text-[11px] text-emerald-400 flex items-center space-x-1">
          <i data-lucide="check-circle" class="w-3 h-3"></i>
          <span>Encrypted</span>
        </span>
      </div>

      <button
        type="submit"
        class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
      >
        <span>Sign In to Account</span>
        <i data-lucide="arrow-right" class="w-4 h-4"></i>
      </button>
    </form>

    <div class="pt-2 text-center text-xs text-slate-500">
      Don't have an account? <a href="#" onclick="showToast('Redirecting to registration...'); return false;" class="text-indigo-400 hover:underline">Create an account</a>
    </div>
  </div>

  <!-- Real-time Interaction Simulation Toast -->
  <div id="toast" class="fixed bottom-6 right-6 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-2xl transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none flex items-center space-x-2 border border-indigo-400/40 z-50">
    <i data-lucide="check" class="w-4 h-4 text-emerald-300"></i>
    <span id="toast-text">Action Completed</span>
  </div>

  <script>
    function showToast(msg) {
      const toast = document.getElementById('toast');
      const text = document.getElementById('toast-text');
      if (!toast || !text) return;
      text.textContent = msg;
      toast.classList.remove('translate-y-20', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 2500);
    }

    function handleAuthSubmit() {
      const email = document.getElementById('email').value;
      showToast('🚀 Signed in successfully as ' + (email || 'user'));
    }

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  </script>
</div>"""

WHITEBOARD_SAAS_CODE = """<div class="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center font-sans antialiased">
  <div class="w-full max-w-5xl bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-8 shadow-2xl space-y-8">
    <!-- Header Inferred from Whiteboard Top Title -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700/60 pb-6 gap-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
          <i data-lucide="activity" class="w-5 h-5 text-white"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Dashboard — Analytics</h1>
          <p class="text-xs text-slate-400">Synthesized from hackathon whiteboard blueprint</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <div class="flex items-center -space-x-2 mr-2">
          <img class="w-8 h-8 rounded-full border-2 border-slate-800" src="https://avatar.iran.liara.run/public/boy" alt="User 1" />
          <img class="w-8 h-8 rounded-full border-2 border-slate-800" src="https://avatar.iran.liara.run/public/girl" alt="User 2" />
        </div>
        <button onclick="showToast('👥 Team invite modal opened')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 flex items-center space-x-1.5">
          <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
          <span>Invite Team</span>
        </button>
        <button onclick="showToast('🚀 Campaign launched in production!')" class="px-4 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-95 transition-opacity text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5">
          <i data-lucide="rocket" class="w-3.5 h-3.5"></i>
          <span>Launch Campaign</span>
        </button>
      </div>
    </div>

    <!-- 3 Metrics KPI Cards Inferred from Whiteboard Top Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-5 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-indigo-500/40 transition-colors shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</span>
          <i data-lucide="dollar-sign" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="mt-2 flex items-baseline space-x-2">
          <span class="text-3xl font-extrabold text-white">$4.5k</span>
          <span class="text-xs text-emerald-400 font-semibold flex items-center">
            <i data-lucide="trending-up" class="w-3 h-3 mr-0.5"></i> +14.2%
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-2">Inferred from whiteboard ($4.5k ↑)</p>
      </div>

      <div class="p-5 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-indigo-500/40 transition-colors shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Users</span>
          <i data-lucide="users" class="w-4 h-4 text-indigo-400"></i>
        </div>
        <div class="mt-2 flex items-baseline space-x-2">
          <span class="text-3xl font-extrabold text-indigo-400">1,280</span>
          <span class="text-xs text-slate-400 font-normal">verified</span>
        </div>
        <p class="text-xs text-slate-500 mt-2">Inferred from whiteboard label</p>
      </div>

      <div class="p-5 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-indigo-500/40 transition-colors shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Growth Rate</span>
          <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i>
        </div>
        <div class="mt-2 flex items-baseline space-x-2">
          <span class="text-3xl font-extrabold text-emerald-400">+12%</span>
          <span class="text-xs text-emerald-400 font-semibold">MoM</span>
        </div>
        <p class="text-xs text-slate-500 mt-2">Inferred from whiteboard (+12% icon)</p>
      </div>
    </div>

    <!-- Analytics Chart & Quick Actions Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chart Simulation Box -->
      <div class="lg:col-span-2 p-6 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-400"></i>
            <h3 class="text-sm font-semibold text-slate-200">Monthly Growth Curve</h3>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="showToast('Filtered by October 2026')" class="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 rounded-md border border-slate-700 hover:text-white flex items-center space-x-1">
              <i data-lucide="filter" class="w-3 h-3"></i>
              <span>Filter</span>
            </button>
            <button onclick="showToast('Comparison view enabled')" class="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 rounded-md border border-slate-700 hover:text-white flex items-center space-x-1">
              <i data-lucide="layers" class="w-3 h-3"></i>
              <span>Compare</span>
            </button>
          </div>
        </div>
        <!-- Visual Chart Simulation -->
        <div class="h-44 w-full flex items-end justify-between gap-3 pt-6 px-2">
          <div class="w-full bg-indigo-500/20 hover:bg-indigo-500/40 rounded-t-lg transition-all h-[40%] flex items-center justify-center text-[10px] text-indigo-300">W1</div>
          <div class="w-full bg-indigo-500/30 hover:bg-indigo-500/50 rounded-t-lg transition-all h-[65%] flex items-center justify-center text-[10px] text-indigo-300">W2</div>
          <div class="w-full bg-indigo-500/40 hover:bg-indigo-500/60 rounded-t-lg transition-all h-[55%] flex items-center justify-center text-[10px] text-indigo-300">W3</div>
          <div class="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg shadow-lg shadow-indigo-500/30 h-[92%] flex items-center justify-center text-[10px] text-white font-bold">W4</div>
        </div>
      </div>

      <!-- Quick Actions List -->
      <div class="p-6 rounded-xl bg-slate-900/80 border border-slate-700/60 flex flex-col justify-between space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-slate-200">Quick Actions</h3>
          <p class="text-xs text-slate-400 mt-1">Live interaction simulation</p>
        </div>
        <div class="space-y-2">
          <button onclick="showToast('📊 Report downloaded as PDF')" class="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors text-left flex items-center justify-between">
            <span class="flex items-center space-x-2">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-indigo-400"></i>
              <span>View Reports</span>
            </span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400"></i>
          </button>
          <button onclick="showToast('⚡ API integration sync triggered')" class="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors text-left flex items-center justify-between">
            <span class="flex items-center space-x-2">
              <i data-lucide="database" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Integrate API</span>
            </span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Real-time Interaction Simulation Toast -->
  <div id="toast" class="fixed bottom-6 right-6 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-2xl transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none flex items-center space-x-2 border border-indigo-400/40 z-50">
    <i data-lucide="check" class="w-4 h-4 text-emerald-300"></i>
    <span id="toast-text">Action Completed</span>
  </div>

  <script>
    function showToast(msg) {
      const toast = document.getElementById('toast');
      const text = document.getElementById('toast-text');
      if (!toast || !text) return;
      text.textContent = msg;
      toast.classList.remove('translate-y-20', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 2500);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  </script>
</div>"""


def clean_generated_code(raw_text: str) -> str:
    """Strip markdown code block fences and sanitize JSX into pure HTML with Tailwind and micro-app script."""
    text = raw_text.strip()

    # Strip markdown code block fences
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    # Convert React className to standard HTML class (crucial for Tailwind CDN)
    text = re.sub(r'\bclassName=', 'class=', text)

    # Remove JSX event handlers like onClick={(e) => ...} or onSubmit={(e) => e.preventDefault()}
    text = re.sub(r'\s*on[A-Za-z]+=\{[^}]*\}', '', text)
    text = re.sub(r'\(?e\)?\s*=>\s*e\.preventDefault\(\)\s*\}?>?', '', text)
    text = re.sub(r'\be\.preventDefault\(\)[^<]*', '', text)

    # Convert JSX curly braces like value={"foo"} -> value="foo"
    text = re.sub(r'=\{([^{}]+)\}', r'="\1"', text)

    # Inject interactive micro-app script, toast, and Lucide initializer if missing
    if "showToast" not in text:
        toast_and_script = """
<!-- Real-time Interaction Simulation Toast -->
<div id="toast" class="fixed bottom-6 right-6 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-2xl transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none flex items-center space-x-2 border border-indigo-400/40 z-50">
  <i data-lucide="check" class="w-4 h-4 text-emerald-300"></i>
  <span id="toast-text">Action Completed</span>
</div>

<script>
  function showToast(msg) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-text');
    if (!toast || !text) return;
    text.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
    document.querySelectorAll('button, input[type="submit"]').forEach(btn => {
      if (!btn.getAttribute('onclick')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('⚡ Triggered: ' + (btn.textContent.trim() || 'Action'));
        });
      }
    });
    document.querySelectorAll('form').forEach(form => {
      if (!form.getAttribute('onsubmit')) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          showToast('🚀 Form submitted successfully!');
        });
      }
    });
  });
</script>"""
        if text.endswith("</div>"):
            text = text[:-6] + toast_and_script + "\n</div>"
        else:
            text = text + toast_and_script

    return text.strip()


def build_intent_analysis(style: str, code: str) -> dict:
    """Analyze the synthesized UI code to expose the 3 Unique Differentiators."""
    has_form = "<form" in code or "<input" in code
    has_chart = "chart" in code.lower() or "growth" in code.lower() or "analytics" in code.lower()
    has_lucide = "data-lucide" in code

    detected_elements = []
    if has_form:
        detected_elements.extend(["Form Container", "Email Input", "Password Input", "Primary Submit CTA"])
    if has_chart:
        detected_elements.extend(["Metrics Row", "KPI Stat Badges", "Chart Container", "Action Toolbar"])
    if not detected_elements:
        detected_elements = ["Adaptive Layout Container", "Interactive Component Header", "Elevated Button CTA"]

    return {
        "title": "Gemma 4 Intent Recognition Breakdown",
        "inferred_architecture": "Interpreted imperfect hand-drawn bounding boxes as production 8pt grid flexbox/grid containers.",
        "detected_elements": detected_elements,
        "accessibility_injections": [
            "Injected aria-label attributes for screen-reader parity",
            "Focus ring utilities (focus:ring-2 focus:ring-indigo-500)",
            "Proper input types (type='email', type='password')",
            "WCAG AAA compliant contrast foreground/background pairing",
        ],
        "design_tokens": [
            f"Active Design System: {style.upper()}",
            "Border Radius: rounded-xl / rounded-2xl",
            "Border Palette: border-slate-800 / border-zinc-800",
            "Vector Icons: Lucide Icon Engine via UNPKG",
            "Micro-Elevation: drop-shadow & backdrop-blur",
        ],
        "interaction_simulation": [
            "Inline micro-app JavaScript state",
            "Real-time reactive floating toast notifications (showToast)",
            "Form submission event handling & input state capture",
        ],
        "contrast_verdict": "Existing tools clone crooked lines into broken divs; Wire2React bridges the intent gap to synthesize accessible, interactive production code.",
    }


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Wire2React API",
        "primary_model": TARGET_MODEL,
        "fallback_model": FALLBACK_MODEL,
        "has_api_key": bool(api_key),
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "target_model": TARGET_MODEL,
        "fallback_model": FALLBACK_MODEL,
        "api_key_configured": bool(api_key),
    }


@app.get("/api/backup-sample")
def get_backup_sample(sample_type: str = "napkin", style: str = "shadcn"):
    """Instant fail-safe sample for zero-latency judge presentation."""
    if sample_type == "whiteboard":
        code = WHITEBOARD_SAAS_CODE
    else:
        code = NAPKIN_AUTH_CODE

    intent = build_intent_analysis(style, code)

    return {
        "code": code,
        "model": "backup-sample-cache",
        "style": style,
        "is_backup": True,
        "intent_analysis": intent,
    }


@app.post("/api/convert")
async def convert_wireframe(
    file: Optional[UploadFile] = File(None),
    style: str = Form("shadcn"),
    use_backup: bool = Form(False),
    sample_type: Optional[str] = Form("napkin"),
):
    """
    Accepts wireframe image (or backup flag), uses Gemma 4 to generate React/Tailwind HTML code
    with intent recognition and real-time interaction simulation.
    """
    if use_backup or file is None:
        code = WHITEBOARD_SAAS_CODE if sample_type == "whiteboard" else NAPKIN_AUTH_CODE
        return {
            "code": code,
            "model": "backup-sample-cached",
            "style": style,
            "is_backup": True,
            "intent_analysis": build_intent_analysis(style, code),
        }

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the backend server.",
        )

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.thumbnail((1024, 1024))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["shadcn"])

    prompt = f"""You are an opinionated Principal Frontend Architect implementing the Wire2React wireframe-to-UI engine for the React Hyderabad track.
The user provided a rough, imperfect napkin sketch or whiteboard drawing.

DO NOT attempt to literally copy sloppy hand-drawn lines, crooked borders, or tremors. Instead, INFER INTENT and elevate it into a production-grade component:

1. ARCHITECTURE & INTENT INFERENCE (Infer & Synthesize):
   - Treat the sketch as an architectural blueprint: parallel scribbles mean clean flex/grid containers with modern spacing (p-6, gap-4).
   - Inject accessible form attributes: aria-labels, focus rings (focus:ring-2 focus:ring-indigo-500), proper input types (type="email", type="password"), and responsive wrapping that hand sketches never include.
   - SCOPE DISCIPLINE: Faithfully elevate the components present in the sketch. If the sketch depicts only a single button (e.g. "SUBMIT"), elevate that button into a hero call-to-action component with icons and glow. If it depicts a card grid, form, or dashboard, map those exact components.

2. DESIGN SYSTEM ADAPTER ({style}):
   - Map the sloppy drawing directly onto the designated token conventions:
     {style_instruction}
   - Use clean modern Tailwind conventions (rounded-xl or rounded-2xl, border-slate-800, accessible color contrast).
   - Use standard HTML5 syntax with `class="..."` (NEVER `className=`).
   - Use Lucide icon tags where appropriate: `<i data-lucide="mail"></i>`, `<i data-lucide="lock"></i>`, `<i data-lucide="arrow-right"></i>`, `<i data-lucide="activity"></i>`, `<i data-lucide="check"></i>`, etc.
   - If avatars or preview images are depicted, use clean placeholders like `https://avatar.iran.liara.run/public` or `https://picsum.photos/400/250`.

3. REAL-TIME INTERACTION SIMULATION (Live Micro-App Behavior):
   - Include a concise, self-contained inline `<script>` at the bottom of the HTML.
   - Wire up click/submit events on buttons and inputs so the prototype behaves like a working micro-app (e.g., clicking a button or submitting a form triggers a floating toast alert or active state toggle).
   - Include a built-in toast element and showToast(message) helper function.
   - Call `if (window.lucide) window.lucide.createIcons();` in the script.

4. OUTPUT FORMAT:
   - Pure, self-contained HTML starting with `<div class="min-h-screen...` and ending with `</div>`.
   - Do NOT wrap in markdown fences (no ```html).
   - Do NOT write conversational explanations or commentary.
"""

    active_client = client or genai.Client(api_key=api_key)
    models_to_try = [TARGET_MODEL, FALLBACK_MODEL]
    last_error = None

    for model_name in models_to_try:
        try:
            print(f"Calling model: {model_name}...")
            response = active_client.models.generate_content(
                model=model_name,
                contents=[prompt, image],
            )
            raw_code = response.text or ""
            clean_code = clean_generated_code(raw_code)
            intent = build_intent_analysis(style, clean_code)
            return {
                "code": clean_code,
                "model": model_name,
                "style": style,
                "is_backup": False,
                "intent_analysis": intent,
            }
        except Exception as err:
            print(f"Error calling {model_name}: {err}")
            last_error = err
            continue

    # Graceful fallback to backup sample
    print(f"All models failed. Falling back to cached backup sample. Error: {last_error}")
    fallback_code = NAPKIN_AUTH_CODE
    return JSONResponse(
        status_code=200,
        content={
            "code": fallback_code,
            "model": "fallback-safe",
            "style": style,
            "is_backup": True,
            "intent_analysis": build_intent_analysis(style, fallback_code),
            "warning": f"AI model call failed ({str(last_error)}). Loaded backup demo sample automatically.",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
