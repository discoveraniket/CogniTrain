"""
This is the main application file for the AI-Powered MCQ Practice Coach.

It uses the Flask web framework and acts as a "data marshaller" according
to the "Pure LLM-Cognition" model. Its sole responsibility is to manage the
session, gather context, pass it to the Gemini service, and return the
LLM's decision to the frontend.
"""
from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
import os
import json
import question_bank
import gemini_service

# Initialize the Flask application
app = Flask(__name__)
# A secret key is required for Flask session management
app.secret_key = os.urandom(24) 

@app.route('/')
def index():
    """
    Serves the main HTML page and initializes the session.
    """
    # Clear session data for a new visit
    session.clear()
    session['chat_history'] = []
    session['current_question_index'] = 0
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handles all incoming chat messages from the user.
    This single endpoint orchestrates the entire conversation flow by
    delegating all decisions to the gemini_service.
    """
    # 1. Get current state from the session
    chat_history = session.get('chat_history', [])
    current_question_index = session.get('current_question_index', 0)
    
    # 2. Get user message and add it to history with a timestamp
    user_message = request.json.get('message')
    if not user_message:
        # On the first load, the frontend sends an empty message to get the greeting
        print("Initial call from frontend to get greeting.")
    else:
        chat_history.append({
            "role": "user", 
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })

    # 3. Load the full question bank
    try:
        all_questions = question_bank.load_questions()
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return jsonify({"error": f"Could not load question bank: {e}"}), 500

    # 4. Delegate all cognitive tasks to the LLM
    try:
        llm_decision = gemini_service.get_llm_decision(
            chat_history=chat_history,
            all_questions=all_questions,
            current_question_index=current_question_index
        )
    except Exception as e:
        return jsonify({"error": f"An error occurred with the AI service: {e}"}), 500

    # 5. Update session state based on LLM's decision
    if llm_decision.get('action') == 'ASK_QUESTION':
        session['current_question_index'] = llm_decision.get('question_index', 0)

    # 6. Add AI response to history and save back to session
    chat_history.append({
        "role": "model",
        "content": llm_decision.get("coach_response"),
        "timestamp": datetime.now().isoformat()
    })
    session['chat_history'] = chat_history
    
    # 7. Return the LLM's decision to the frontend
    return jsonify(llm_decision)

if __name__ == '__main__':
    # The host '0.0.0.0' makes it accessible on your local network.
    app.run(host='0.0.0.0', port=5000, debug=True)
