import json
import os
from typing import List, Dict, Any, Union

# Define a type alias for a single question, which is a dictionary.
Question = Dict[str, Union[str, int, List[str]]]


def load_questions(file_path: str = "mcq.json") -> List[Question]:
    """Loads multiple-choice questions from a JSON file.

    This function reads a JSON file containing a list of question objects.
    Each object should be a dictionary representing a single multiple-choice
    question with its options and correct answer.

    Args:
        file_path: The path to the JSON file containing the questions.
                   Defaults to "mcq.json".

    Returns:
        A list of question dictionaries. Each dictionary represents one
        question. Returns an empty list if the file is not found or is invalid.

    Raises:
        FileNotFoundError: If the specified file_path does not exist.
        json.JSONDecodeError: If the file content is not valid JSON.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            questions = json.load(f)
        # It's good practice to validate the structure of the loaded data,
        # but for this simple loader, we'll assume the format is correct.
        return questions
    except FileNotFoundError:
        print(f"Error: The file at {file_path} was not found.")
        raise
    except json.JSONDecodeError:
        print(f"Error: The file at {file_path} is not a valid JSON file.")
        raise


def get_available_banks() -> List[Dict[str, str]]:
    """
    Scans the 'question_banks' directory and returns a list of available JSON files.

    Returns:
        A list of dictionaries, where each dictionary contains the 'name' and 'file'
        of a question bank. Returns an empty list if the directory is not found.
    """
    try:
        # Determine the project root directory from the current file's location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, ".."))
        question_banks_dir = os.path.join(project_root, "question_banks")

        if not os.path.isdir(question_banks_dir):
            print("Warning: Question banks directory not found")
            return []

        available_banks = [f for f in os.listdir(question_banks_dir) if f.endswith('.json')]
        
        banks_data = []
        for bank_file in available_banks:
            name = os.path.splitext(bank_file)[0]
            formatted_name = ' '.join(word.capitalize() for word in name.replace('_', ' ').split())
            banks_data.append({"name": formatted_name, "file": bank_file})
            
        return banks_data
    except Exception as e:
        print(f"Error scanning question banks: {e}")
        return [] # Return empty list on error


# This block demonstrates how to use the load_questions function
# and verifies that the data is loaded correctly.
if __name__ == "__main__":
    print("Attempting to load questions from 'mcq.json'...")
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, ".."))
        question_banks_dir = os.path.join(project_root, "question_banks")
        mcq_file_path = os.path.join(question_banks_dir, "english.json")
        all_questions = load_questions(mcq_file_path)
        if all_questions:
            print(f"Successfully loaded {len(all_questions)} questions.")
            print("\n--- First Question Sample ---")
            first_question = all_questions[0]
            print(f"  ID: {first_question.get('id')}")
            print(f"  Question: {first_question.get('question')}")
            print(f"  Options: {first_question.get('options')}")
            print(f"  Correct Answer Index: {first_question.get('correct_answer')}")
            print("---------------------------\n")
        else:
            print("No questions were loaded. The file might be empty.")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(
            f"Failed to load questions. Please check the 'mcq.json' file. Details: {e}"
        )
