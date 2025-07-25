"""
This is the main application file for the AI-Powered MCQ Practice Coach.

It uses the Flask web framework and acts as a "data marshaller" according
to the "Pure LLM-Cognition" model. Its sole responsibility is to manage the
session, gather context, pass it to the Gemini service, and return the
LLM's decision to the frontend.
"""

import sys
import os
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json

# Add the project root to the sys.path to allow absolute imports from 'src'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src import question_bank
from src import gemini_service

# Initialize the Flask application
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
template_dir = os.path.join(project_root, "templates")
static_dir = os.path.join(project_root, "static")

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.secret_key = os.urandom(24)


@app.route("/")
def index():
    """
    Serves the main HTML page. State is managed entirely on the client-side.
    """
    return render_template("index.html")


@app.route("/question-banks", methods=["GET"])
def get_question_banks():
    """
    Returns a list of available question banks.
    """
    try:
        banks_data = question_bank.get_available_banks()
        return jsonify(banks_data)
    except Exception as e:
        print(f"Error getting question banks: {e}")
        return jsonify({"error": "Could not retrieve question banks"}), 500


@app.route("/chat", methods=["POST"])
def chat():
    """
    Handles all incoming chat messages from the user.
    This endpoint is now stateless, relying on the client to send the full context.
    """
    data = request.json

    # --- START DEBUG LOGGING ---
    try:
        # Construct the absolute path for the debug logs directory
        debug_log_dir = os.path.join(project_root, "debug_logs")
        # Create the directory if it doesn't exist
        os.makedirs(debug_log_dir, exist_ok=True)
        
        # Define the single JSON log file path
        log_file_path = os.path.join(debug_log_dir, "chat_log.json")
        
        # Write the new data to the file, overwriting it
        with open(log_file_path, "w") as f:
            json.dump(data, f, indent=4)
            
    except Exception as e:
        # Print an error to the console if logging fails, but don't crash the app
        print(f"--- Failed to log request: {e} ---")
    # --- END DEBUG LOGGING ---

    # Get state from the client request
    chat_history = data.get("chat_history", [])
    current_question_index = data.get("current_question_index", 0)
    question_bank_file = data.get("question_bank", "english.json") # Default to english.json

    # Load the full question bank
    try:
        # Security check: Ensure the file name is simple and does not contain path traversal characters.
        if ".." in question_bank_file or "/" in question_bank_file:
            return jsonify({"error": "Invalid question bank file name."}), 400
            
        question_banks_dir = os.path.join(project_root, "question_banks")
        mcq_file_path = os.path.join(question_banks_dir, question_bank_file)
        
        all_questions = question_bank.load_questions(file_path=mcq_file_path)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return jsonify({"error": f"Could not load question bank: {e}"}), 500

    # Delegate all cognitive tasks to the LLM
    try:
        # The history from the client is now complete and can be used directly
        llm_decision = gemini_service.get_llm_decision(
            chat_history=chat_history,
            all_questions=all_questions,
            current_question_index=current_question_index,
        )
    except Exception as e:
        # Log the full error for debugging
        print(f"Error calling Gemini service: {e}")
        return jsonify({"error": f"An error occurred with the AI service: {e}"}), 500

    # Return the LLM's decision directly to the frontend
    # -----------Development code starts------------
    try:
        # Construct the absolute path for the debug logs directory
        debug_log_dir = os.path.join(project_root, "debug_logs")
        # Create the directory if it doesn't exist
        os.makedirs(debug_log_dir, exist_ok=True)
        
        # Define the single JSON log file path
        log_file_path = os.path.join(debug_log_dir, "llm_response_log.json")
        
        # Write the new data to the file, overwriting it
        with open(log_file_path, "w") as f:
            json.dump(llm_decision, f, indent=4)
            
    except Exception as e:
        # Print an error to the console if logging fails, but don't crash the app
        print(f"--- Failed to log LLM response: {e} ---")
    # -----------Development code Ends------------
    return jsonify(llm_decision)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)