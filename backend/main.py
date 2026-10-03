import os
import io
import sys
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
from pydantic import BaseModel
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
    version="1.0.0",
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
    "modern": (
        "Style: Modern Clean (Slate / Indigo theme). Use soft neutral backgrounds (e.g. slate-50/slate-900), "
        "subtle borders (slate-200), smooth rounded corners (rounded-xl), indigo accent buttons, "
        "and clean modern typography with subtle drop shadows."
    ),
    "cyberpunk": (
        "Style: Dark Cyberpunk. Use dark backgrounds (zinc-950, black), neon glowing accents (cyan-400, fuchsia-500, lime-400), "
        "sharp/semi-sharp borders with neon glow (ring-1 ring-cyan-500/50), futuristic badges, and high-contrast typography."
    ),
    "minimalist": (
        "Style: Ultra Minimalist. Monochrome grayscale palette (pure white, gray-50, black), subtle hairline borders (zinc-200), "
        "spacious padding, stark contrast, elegant tracking, and zero unnecessary visual clutter."
    ),
}

BACKUP_SAMPLE_CODE = """<div class="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center font-sans antialiased">
  <div class="w-full max-w-4xl bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-700/60 pb-6">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
          W
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Wire2React Dashboard</h1>
          <p class="text-xs text-slate-400">Gemma 4 Multimodal Synthesis Engine</p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span class="w-2 h-2 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Wireframe Active
        </span>
        <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-all text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/30">
          Export Code
        </button>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-5 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 transition-colors">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Visual Fidelity</span>
        <div class="mt-2 flex items-baseline space-x-2">
          <span class="text-3xl font-extrabold text-white">99.4%</span>
          <span class="text-xs text-emerald-400 font-semibold">+4.2%</span>
        </div>
        <p class="text-xs text-slate-500 mt-2">Zero hallucinations detected</p>
      </div>

      <div class="p-5 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 transition-colors">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Inference Speed</span>
        <div class="mt-2 flex items-baseline space-x-2">
          <span class="text-3xl font-extrabold text-indigo-400">840ms</span>
          <span class="text-xs text-slate-400 font-normal">Gemma 4 26B</span>
        </div>
        <p class="text-xs text-slate-500 mt-2">Streaming via Gemini API</p>
      </div>

      <div class="p-5 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 transition-colors">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Tailwind Rules</span>
        <div class="mt-2 flex items-baseline space-x-2">
          <span class="text-3xl font-extrabold text-violet-400">100%</span>
          <span class="text-xs text-violet-400 font-medium">Responsive</span>
        </div>
        <p class="text-xs text-slate-500 mt-2">No external css needed</p>
      </div>
    </div>

    <!-- Interactive Component Preview Area -->
    <div class="bg-slate-900/60 rounded-xl border border-slate-700/60 p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-200">Interactive Controls</h3>
        <span class="text-xs text-indigo-400 font-mono">React 18 Component</span>
      </div>
      <div class="flex flex-wrap gap-4 items-center">
        <input type="text" placeholder="Search components..." class="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        <button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors">Filter</button>
        <button class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-lg shadow-md hover:opacity-95 transition-opacity">Deploy Live</button>
      </div>
    </div>
  </div>
</div>"""


def clean_generated_code(raw_text: str) -> str:
    """Strip markdown code block fences if Gemma wraps the response."""
    text = raw_text.strip()
    if text.startswith("```html"):
        text = text[7:]
    elif text.startswith("```jsx"):
        text = text[6:]
    elif text.startswith("```tsx"):
        text = text[6:]
    elif text.startswith("```xml"):
        text = text[6:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


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
def get_backup_sample(style: str = "modern"):
    """Instant fail-safe sample for zero-latency demo presentation."""
    return {
        "code": BACKUP_SAMPLE_CODE,
        "model": "backup-sample-cache",
        "style": style,
        "is_backup": True,
    }


@app.post("/api/convert")
async def convert_wireframe(
    file: Optional[UploadFile] = File(None),
    style: str = Form("modern"),
    use_backup: bool = Form(False),
):
    """
    Accepts wireframe image (or backup flag), uses Gemma 4 to generate React/Tailwind HTML code.
    """
    if use_backup or file is None:
        return {
            "code": BACKUP_SAMPLE_CODE,
            "model": "backup-sample-cached",
            "style": style,
            "is_backup": True,
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

    style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["modern"])

    prompt = f"""You are an elite React and Tailwind CSS UI Engineer.
Analyze this wireframe / hand-drawn UI sketch carefully and transform it into a stunning, production-ready, interactive web UI component.

Requirements:
1. Recreate all sections, buttons, inputs, labels, navigation, and cards depicted in the wireframe.
2. Apply this styling aesthetic: {style_instruction}
3. Use Tailwind CSS utility classes exclusively for all styling and layout.
4. Make it fully responsive (grid/flexbox).
5. Add realistic placeholder text, realistic data, and interactive hover/focus states to all buttons and inputs.
6. Return ONLY the HTML/JSX container markup (e.g. `<div class="...">...</div>`) with inline Tailwind classes.
7. Do NOT include markdown code blocks, do NOT write explanations, do NOT write ```html or ``` fences. Just pure markup ready to render inside an iframe or React container.
"""

    # Try target model first, then fallback model
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
            return {
                "code": clean_code,
                "model": model_name,
                "style": style,
                "is_backup": False,
            }
        except Exception as err:
            print(f"Error calling {model_name}: {err}")
            last_error = err
            continue

    # If both models fail, fallback to backup sample gracefully with error info
    print(f"All models failed. Falling back to cached backup sample. Error: {last_error}")
    return JSONResponse(
        status_code=200,
        content={
            "code": BACKUP_SAMPLE_CODE,
            "model": "fallback-safe",
            "style": style,
            "is_backup": True,
            "warning": f"AI model call failed ({str(last_error)}). Loaded backup demo sample automatically.",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
