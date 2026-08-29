import os
import json
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class AIProvider(ABC):
    """Abstract Base Class for AI Model Providers in FailForge."""

    @abstractmethod
    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        pass

    @abstractmethod
    def generate_structured_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        pass


class GeminiProvider(AIProvider):
    """
    Implementation of AIProvider using official Google GenAI SDK.

    Fail-fast design: on first unrecoverable API error (e.g. deprecated model, invalid key),
    self.client is set to None so all subsequent calls skip the network entirely and
    execute the deterministic fallback path at full speed.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self._model_confirmed: Optional[str] = None  # set on first successful call

        if not self.api_key:
            print("[INFO] No GEMINI_API_KEY set. Running in deterministic engine mode.")
            self.client = None
            return

        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            print(f"[INFO] GeminiProvider initialised (model preference: {self.model_name})")
        except Exception as e:
            print(f"[WARN] Failed to initialise Gemini client: {e}. Deterministic mode active.")
            self.client = None

    # ------------------------------------------------------------------ #
    #  Model discovery with permanent fail-fast on bad / deprecated models
    # ------------------------------------------------------------------ #
    def _try_models(self) -> list[str]:
        """Return a prioritised list of models to attempt."""
        candidates = list(dict.fromkeys([
            self.model_name,
            "gemini-2.5-flash",
            "gemini-1.5-flash",
        ]))
        # If we already confirmed a working model, put it first and skip others
        if self._model_confirmed:
            candidates = [self._model_confirmed]
        return candidates

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.client:
            return ""

        try:
            from google.genai import types
        except ImportError:
            self.client = None
            return ""

        config = types.GenerateContentConfig()
        if system_instruction:
            config.system_instruction = system_instruction

        for model in self._try_models():
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                text = response.text or ""
                if text:
                    self._model_confirmed = model  # cache the working model
                    return text
            except Exception as e:
                err_str = str(e)
                # Permanent failures: disable client immediately so all future
                # calls skip the network entirely (fail-fast, no retries)
                if any(code in err_str for code in ["NOT_FOUND", "INVALID_ARGUMENT",
                                                     "PERMISSION_DENIED", "API_KEY_INVALID"]):
                    print(f"[WARN] Gemini model '{model}' unavailable ({e}). "
                          "Switching to deterministic engine for this session.")
                    self.client = None
                    return ""
                # Transient failures (rate limit, timeout) — just return empty
                print(f"[WARN] Gemini transient error on '{model}': {e}")
                return ""

        return ""

    def generate_structured_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        if not self.client:
            raise ValueError("Gemini client offline — use deterministic fallback.")

        full_instruction = (system_instruction or "") + \
            "\nRespond STRICTLY with valid JSON only, wrapped in ```json ... ```."

        raw = self.generate_text(prompt, system_instruction=full_instruction)
        if not raw:
            raise ValueError("Empty output from Gemini model.")

        clean = raw.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        elif clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            m = re.search(r"\{.*\}", clean, re.DOTALL)
            if m:
                try:
                    return json.loads(m.group(0))
                except json.JSONDecodeError as err:
                    raise ValueError(f"Failed to parse extracted JSON: {err}")
            raise ValueError(f"Model response was not valid JSON: {raw[:200]}")


class LocalModelProvider(AIProvider):
    """Placeholder for local Qwen/Llama support (FailForge V2)."""

    def __init__(self, endpoint_url: str = "http://localhost:11434/v1"):
        self.endpoint_url = endpoint_url

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        raise NotImplementedError("LocalModelProvider is scheduled for FailForge V2.")

    def generate_structured_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError("LocalModelProvider is scheduled for FailForge V2.")
