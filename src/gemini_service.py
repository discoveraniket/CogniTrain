"""
This module provides a wrapper for interacting with the Google Gemini API.
It uses a system instruction to guide the model's behavior and requests
structured JSON output for reliable application logic, using the genai.Client pattern.
"""

import os
import json
from google import genai
from google.genai import types
from typing import List, Dict, Any
from prompts import SYSTEM_INSTRUCTION, build_user_prompt

# --- API Configuration ---
client = None
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not found.")

    # Initialize the client
    client = genai.Client(api_key=api_key)
    print("--- Gemini Service: Successfully configured and client initialized. ---")
except Exception as e:
    print(f"--- Gemini Service Error: {e} ---")


def get_llm_decision(
    chat_history: List[Dict[str, Any]],
    all_questions: List[Dict[str, Any]],
    current_question_index: int,
) -> Dict[str, Any]:
    """
    Gets a comprehensive decision from the LLM for the next step in the conversation.

    This function sends the dynamic user context to the model via the client,
    which is guided by the system instruction. It requests a JSON object as a response.

    Args:
        chat_history: The full history of the conversation.
        all_questions: The entire list of available multiple-choice questions.
        current_question_index: The index of the current question.

    Returns:
        A dictionary representing the LLM's structured JSON decision.
    """
    if not client:
        raise RuntimeError(
            "Gemini client is not initialized. Check API key and configuration."
        )

    # Build the user prompt with the dynamic context
    user_prompt = build_user_prompt(chat_history, all_questions, current_question_index)

    print(
        "--- Gemini Service: Requesting decision from LLM with user prompt via client. ---"
    )
    try:
        # Request structured JSON output using the client
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
            ),
        )

        # --- DEVELOPMENT_ONLY_START ---
        # Print raw LLM response for debugging
        print("--- Gemini Service: Raw LLM Response (DEVELOPMENT_ONLY) ---")
        print(response.text)
        print("----------------------------------------------------------")
        # --- DEVELOPMENT_ONLY_END ---

        llm_decision = json.loads(response.text)

        # --- DEVELOPMENT_ONLY_START ---
        # Add raw LLM response to the decision for UI display
        llm_decision["_development_info"] = response.text
        # --- DEVELOPMENT_ONLY_END ---

        return llm_decision
    except Exception as e:
        print(f"--- Gemini API Error: {e} ---")
        # Return a structured error to be handled by the frontend
        return {
            "action": "ERROR",
            "coach_response": f"Sorry, I encountered a problem trying to understand that. Please try again. (Details: {e})",
        }
