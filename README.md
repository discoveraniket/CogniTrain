# AI-Powered MCQ Practice Coach

## Your Personal LLM-Driven Exam Preparation Companion

---

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Architecture: "Pure LLM-Cognition" Model](#architecture-pure-llm-cognition-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Google Gemini API Key](#google-gemini-api-key)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Introduction

The AI-Powered MCQ Practice Coach is an innovative web-based learning tool designed to transform the traditional quiz experience into a dynamic, one-to-one coaching session. This project serves as an **experimental platform** to rigorously test the cognitive capabilities of a Large Language Model (LLM) in a real-time, interactive coaching environment.

Built with Flask for the backend and a minimalist HTML/CSS/JavaScript frontend, the application's core philosophy is to delegate almost all complex decision-making and conversational logic directly to the Google Gemini LLM. This approach aims to explore the limits and potential of LLMs as central cognitive engines in intelligent applications.

## Features

### Conversational Interface
The entire user experience is meticulously crafted to mimic a modern messaging application, providing a natural and intuitive interaction flow.

### LLM-Driven Coaching
The Gemini LLM acts as the central brain, handling intent classification, performance analysis, action selection, and response generation, ensuring a highly personalized coaching experience.

### Dynamic Questioning
The coach dynamically presents Multiple Choice Questions (MCQs) and guides the user through the practice session with clickable options and prompts.

### User Flexibility
While guided, the application also provides a standard text input field, allowing users to ask clarifying questions or type free-form commands, fostering a more flexible learning environment.

### Real-time Performance Analysis
The LLM analyzes the full chat history, including message timestamps, to assess user accuracy, response speed, and identify areas of strength or weakness, providing tailored feedback.

### Structured Output
The LLM is engineered to deliver its decisions in a reliable JSON format, enabling seamless integration with the backend and frontend.

## Architecture: "Pure LLM-Cognition" Model

This project is a direct implementation of the **"LLM-as-the-Brain"** strategy. The core principle is that the LLM is the central cognitive engine, with the Python backend primarily serving as a "data marshaller." It gathers all relevant context, sends it to the LLM, and executes the LLM's returned commands.

### LLM's Cognitive Tasks
The Gemini LLM is responsible for:
1.  **Intent Classification:** Determining the user's goal from their latest message (e.g., answering a question, asking for a hint, starting the quiz).
2.  **Performance Analysis:** Analyzing the entire chat history, including message timestamps, to dynamically assess user accuracy, response speed, and potential areas for improvement.
3.  **Action Selection:** Choosing the next appropriate action for the application from a predefined list (e.g., `EVALUATE_ANSWER`, `ASK_QUESTION`, `END_QUIZ`).
4.  **Response Generation:** Crafting a user-facing message that aligns with a helpful, encouraging coaching philosophy.

### Stateless `generate_content()`
The backend utilizes the stateless `generate_content()` method of the Gemini API. This provides maximum control, allowing the application to construct a detailed "master prompt" on every turn, containing all the necessary context for the LLM to perform its cognitive tasks effectively.

### Modular Backend Design
The Python backend is kept lean and organized into three main components:
-   `src/app.py`: The API Gateway, managing user sessions (chat history with timestamps) and orchestrating the data flow between the frontend and the Gemini service.
-   `src/question_bank.py`: A simple data loader responsible for reading and providing multiple-choice questions from `mcq.json`.
-   `src/gemini_service.py`: The wrapper for the Google Gemini API, responsible for constructing the master prompt and handling communication with the LLM.

## Project Structure

```
.
├── .gitignore
├── README.md
├── basic.txt
├── src/
│   ├── __init__.py
│   ├── app.py
│   ├── gemini_service.py
│   ├── mcq.json
│   └── question_bank.py
├── static/
│   ├── script.js
│   └── style.css
└── templates/
    └── index.html
```

## Getting Started

Follow these instructions to set up and run the AI-Powered MCQ Practice Coach on your local machine.

### Prerequisites
-   Python 3.8+
-   `pip` (Python package installer)
-   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/discoveraniket/CogniTrain.git
    cd CogniTrain
    ```

2.  **Set up a Python virtual environment (recommended):**
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Google Gemini API Key

1.  Obtain a Google Gemini API Key from the [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Set your API key as an environment variable.
    **On Windows (Command Prompt):**
    ```cmd
    set GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    **On Windows (PowerShell):**
    ```powershell
    $env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    **On macOS/Linux:**
    ```bash
    export GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    Replace `YOUR_API_KEY_HERE` with your actual key. For persistent setup, consider adding this to your shell's profile file (e.g., `.bashrc`, `.zshrc`, `config.fish`, or Windows Environment Variables).

## Usage

Once the setup is complete, you can run the Flask application:

```bash
python src/app.py
```

The application will start a development server, typically accessible at `http://127.0.0.1:5000`. Open this URL in your web browser to interact with the AI Practice Coach.

## Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, please feel free to:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add YourFeature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

## License

This project is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact

For any questions or inquiries, please open an issue on the GitHub repository.
