import os
import sys
from pathlib import Path

# Fix Windows console encoding for Unicode/emojis
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

# Ensure backend directory or root .env is loaded
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Try reading from Windows User environment if not propagated to process
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment")
        api_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")
        os.environ["GEMINI_API_KEY"] = api_key
    except Exception:
        pass

if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in environment or .env file.")
    sys.exit(1)

print(f"🔑 GEMINI_API_KEY detected: {api_key[:6]}...{api_key[-4:]}")

try:
    from google import genai
    from google.genai import types
except ImportError as e:
    print(f"❌ ERROR: google-genai is not installed: {e}")
    sys.exit(1)

client = genai.Client(api_key=api_key)

TARGET_MODEL = "gemma-4-26b-a4b-it"
FALLBACK_MODEL = "gemma-4-31b-it"

print(f"📡 Testing connection with target model '{TARGET_MODEL}'...")

try:
    response = client.models.generate_content(
        model=TARGET_MODEL,
        contents="Hello Gemma! Wire2React is connecting to you. Please reply with a brief confirmation.",
    )
    print("\n✅ [SUCCESS] Connected to Gemma 4 successfully!")
    print(f"Model used: {TARGET_MODEL}")
    print(f"Response:\n{response.text}\n")
    sys.exit(0)
except Exception as e:
    print(f"\n⚠️ Encountered issue with {TARGET_MODEL}: {e}")
    print(f"📡 Attempting fallback model '{FALLBACK_MODEL}'...")
    try:
        response = client.models.generate_content(
            model=FALLBACK_MODEL,
            contents="Hello Gemma! Wire2React is connecting to you. Please reply with a brief confirmation.",
        )
        print(f"\n✅ [SUCCESS] Connected to fallback model '{FALLBACK_MODEL}' successfully!")
        print(f"Response:\n{response.text}\n")
        sys.exit(0)
    except Exception as e2:
        print(f"\n❌ [ERROR] Both target and fallback failed: {e2}")
        sys.exit(1)
