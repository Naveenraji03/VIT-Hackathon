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
        """Generate plain text response from prompt."""
        pass
        
    @abstractmethod
    def generate_structured_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """Generate validated JSON dictionary from prompt."""
        pass


class GeminiProvider(AIProvider):
    """Implementation of AIProvider using official Google GenAI SDK."""
    
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        if not self.api_key:
            # For development/demo without key, we log warning
            print("[WARN] GEMINI_API_KEY not set. GeminiProvider will operate in mock mode if key missing.")
            self.client = None
        else:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[ERROR] Failed to initialize google-genai Client: {e}")
                self.client = None

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.client:
            return "[Gemini Provider Offline: GEMINI_API_KEY missing or client failed to initialize]"
            
        from google.genai import types
        config = types.GenerateContentConfig()
        if system_instruction:
            config.system_instruction = system_instruction
            
        try:
            # Try primary model first, fallback to gemini-2.5-flash if needed
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text or ""
        except Exception as e:
            # Fallback model attempt if primary model throws error
            if "not found" in str(e).lower() or "permission" in str(e).lower():
                try:
                    fallback_model = "gemini-2.5-flash"
                    response = self.client.models.generate_content(
                        model=fallback_model,
                        contents=prompt,
                        config=config
                    )
                    return response.text or ""
                except Exception as fb_err:
                    raise RuntimeError(f"Gemini API Error (fallback failed): {fb_err}")
            raise RuntimeError(f"Gemini API Error: {e}")

    def generate_structured_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        full_instruction = (system_instruction or "") + "\nRespond STRICTLY with valid JSON. Do not include markdown code block backticks if possible, or format as ```json ... ```."
        
        raw_output = self.generate_text(prompt, system_instruction=full_instruction)
        
        # Clean JSON markdown formatting if present
        clean_text = raw_output.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()
        
        # Extract JSON using regex fallback if extra text exists
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            json_match = re.search(r"\{.*\}", clean_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError as err:
                    raise ValueError(f"Failed to parse extracted JSON: {err}. Raw output was: {raw_output}")
            raise ValueError(f"Model response was not valid JSON: {raw_output}")


class LocalModelProvider(AIProvider):
    """Placeholder implementation for local models (Qwen/Llama V2 support)."""
    
    def __init__(self, endpoint_url: str = "http://localhost:8000/v1"):
        self.endpoint_url = endpoint_url

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        # Future local model HTTP invocation
        raise NotImplementedError("LocalModelProvider is scheduled for FailForge V2.")

    def generate_structured_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        raise NotImplementedError("LocalModelProvider is scheduled for FailForge V2.")
