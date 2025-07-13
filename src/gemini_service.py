"""
This module provides a wrapper for interacting with the Google Gemini API.
It embodies the "Pure LLM-Cognition" model by using a single, comprehensive
prompt to delegate all cognitive tasks to the LLM.
"""

import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from prompts import build_prompt2 as bp

# --- API Configuration ---
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not found.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    print("--- Gemini Service: Successfully configured and initialized. ---")
except Exception as e:
    print(f"--- Gemini Service Error: {e} ---")
    model = None


def get_llm_decision(
    chat_history: List[Dict[str, Any]],
    all_questions: List[Dict[str, Any]],
    current_question_index: int,
) -> Dict[str, Any]:
    """
    Gets a comprehensive decision from the LLM for the next step in the conversation.

    This function constructs a "master prompt" that provides the LLM with all
    necessary context and asks it to perform all cognitive tasks, including
    intent classification, performance analysis, action selection, and response generation.

    Args:
        chat_history: The full history of the conversation, including timestamps.
        all_questions: The entire list of available multiple-choice questions.
        current_question_index: The index of the question the user is currently on.

    Returns:
        A dictionary representing the LLM's structured JSON decision.
    """
    if not model:
        raise RuntimeError(
            "Gemini model is not initialized. Check API key and configuration."
        )

    # The Master Prompt
    prompt = bp(chat_history, all_questions, current_question_index)

    # --- DEVELOPMENT_ONLY_START ---
    # Print prompt for debugging purposes. This will be removed later.
    print("--- Gemini Service: Generated Prompt (DEVELOPMENT_ONLY) ---")
    print(prompt)
    print("----------------------------------------------------------")
    # --- DEVELOPMENT_ONLY_END ---

    print("--- Gemini Service: Requesting decision from LLM with master prompt. ---")
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            ),
        )
        # --- DEVELOPMENT_ONLY_START ---
        # Print raw LLM response for debugging. This will be removed later.
        print("--- Gemini Service: Raw LLM Response (DEVELOPMENT_ONLY) ---")
        print(response.text)
        print("----------------------------------------------------------")
        # --- DEVELOPMENT_ONLY_END ---

        llm_decision = json.loads(response.text)
        # --- DEVELOPMENT_ONLY_START ---
        # Add raw LLM response to the decision for UI display. This will be removed later.
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
