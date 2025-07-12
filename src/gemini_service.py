"""
This module provides a wrapper for interacting with the Google Gemini API.
It embodies the "Pure LLM-Cognition" model by using a single, comprehensive
prompt to delegate all cognitive tasks to the LLM.
"""

import os
import json
from typing import List, Dict, Any
import google.generativeai as genai

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
    prompt = f"""
    You are the brain of an AI-powered MCQ practice coach. Your task is to analyze the full context of a user's session and decide the application's next step.

    **1. CONTEXT**

    *   **Full Conversation History (with timestamps):**
        {json.dumps(chat_history, indent=2)}

    *   **Full Question Bank (for your reference):**
        {json.dumps(all_questions, indent=2)}

    *   **Current State:** The user is currently on question index `{current_question_index}`. The question object is in the history.

    **2. YOUR COGNITIVE TASKS**

    *   **A. Intent Classification:** Analyze the LAST user message in the history. What is their intent?
        - Is it the very first turn (`chat_history` is empty)? The intent is `START_SESSION`.
        - Are they greeting or asking to start (e.g., "Let's Begin!")? The intent is `START_QUIZ`.
        - Are they trying to answer the current question? The intent is `SUBMIT_ANSWER`.
        - Are they asking for the next question? The intent is `REQUEST_NEXT_QUESTION`.
        - Are they asking a clarifying question or making a comment? The intent is `ASK_CLARIFICATION`.

    *   **B. Performance Analysis (if applicable):** If the intent is `SUBMIT_ANSWER`, compare the user's answer with the `correct_answer` for the current question. Note the `explanation`. Also, analyze the timestamps between the question and the answer to gauge response time (though you don't need to show it to the user).

    *   **C. Action Selection & Response Generation:** Based on your analysis, choose ONE action and generate the response.

    **3. YOUR RESPONSE (MUST be a single, valid JSON object)**

    Based on the user's intent, choose ONE of the following JSON structures for your response:

    *   **If intent is `START_SESSION`:**
        ```json
        {{
          "action": "GREET_USER",
          "coach_response": "A friendly, encouraging welcome message.",
          "options": {{ "begin": "Let's Begin!" }}
        }}
        ```

    *   **If intent is `START_QUIZ` or `REQUEST_NEXT_QUESTION`:**
        (Select the appropriate question from the question bank. If the quiz is over, use END_QUIZ instead).
        ```json
        {{
          "action": "ASK_QUESTION",
          "coach_response": "A brief transition phrase like 'Great, here's the first one:' or 'Here is the next question.'",
          "question_index": <index_of_the_next_question>,
          "question": {{ ... a full question object from the bank ... }}
        }}
        ```

    *   **If intent is `SUBMIT_ANSWER`:**
        ```json
        {{
          "action": "EVALUATE_ANSWER",
          "coach_response": "Your feedback. If correct, be encouraging. If incorrect, be gentle and provide the explanation.",
          "is_correct": true_or_false,
          "options": {{ "next": "Next Question" }}
        }}
        ```
    
    *   **If the user has finished the last question:**
        ```json
        {{
          "action": "END_QUIZ",
          "coach_response": "A final, encouraging message congratulating the user on completing the quiz."
        }}
        ```

    *   **If intent is `ASK_CLARIFICATION`:**
        ```json
        {{
          "action": "ANSWER_CLARIFICATION",
          "coach_response": "A helpful, concise answer to the user's question. Keep it brief and relevant to the quiz topic.",
          "options": {{ "continue": "Continue Quiz" }}
        }}
        ```
    """

    print("--- Gemini Service: Requesting decision from LLM with master prompt. ---")
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"--- Gemini API Error: {e} ---")
        # Return a structured error to be handled by the frontend
        return {
            "action": "ERROR",
            "coach_response": f"Sorry, I encountered a problem trying to understand that. Please try again. (Details: {e})",
        }
