document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-input-form');
    const userInput = document.getElementById('user-input');
    const tutorMessageTemplate = document.getElementById('tutor-message-template');
    const userMessageTemplate = document.getElementById('user-message-template');
    
    // --- About Modal Elements ---
    const infoButton = document.getElementById('info-button');
    const aboutModal = document.getElementById('about-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const startOverButton = document.getElementById('start-over-button');

    // --- Client-side State ---
    let currentQuestionIndex = 0;
    let chatHistory = []; // Holds the structured chat history for the backend
    const SESSION_KEY = 'cogniTrainSession';

    function saveSession() {
        const sessionData = {
            chatHTML: chatBox.innerHTML,
            userInputEnabled: !userInput.disabled,
            userInputPlaceholder: userInput.placeholder,
            currentQuestionIndex: currentQuestionIndex,
            chatHistory: chatHistory
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }

    function loadSession() {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            chatBox.innerHTML = sessionData.chatHTML;
            setInputState(!sessionData.userInputEnabled, sessionData.userInputPlaceholder);
            currentQuestionIndex = sessionData.currentQuestionIndex || 0;
            chatHistory = sessionData.chatHistory || [];
            
            const lastOptionsContainer = chatBox.querySelector('.options-container-in-chat:last-of-type');
            if (lastOptionsContainer) {
                lastOptionsContainer.querySelectorAll('.quick-reply').forEach(btn => {
                    if (!btn.disabled) {
                        btn.disabled = false;
                    }
                });
            }
            scrollToBottom();
            return true;
        }
        return false;
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        currentQuestionIndex = 0;
        chatHistory = [];
    }

    // --- About Modal Logic ---
    if (infoButton && aboutModal && closeModalButton) {
        infoButton.addEventListener('click', () => {
            aboutModal.classList.remove('hidden');
        });
        closeModalButton.addEventListener('click', () => {
            aboutModal.classList.add('hidden');
        });
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.add('hidden');
            }
        });
    }

    // --- Start Over Logic ---
    if (startOverButton) {
        startOverButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to start over? Your current progress will be lost.')) {
                clearSession();
                chatBox.innerHTML = ''; // Visually clear the chat
                sendMessage(''); // Start a new conversation
            }
        });
    }

    // --- Core Functions ---
    function setupDevInfoToggle() {
        const devContainer = document.getElementById('development-info-container');
        const toggle = document.getElementById('dev-info-toggle');
        if (devContainer && toggle) {
            devContainer.classList.add('minimized');
            toggle.textContent = '+';
            toggle.addEventListener('click', () => {
                const isMinimized = devContainer.classList.contains('minimized');
                devContainer.classList.toggle('minimized');
                toggle.textContent = isMinimized ? '-' : '+';
            });
        }
    }

    function updateDevelopmentInfo(response) {
        const devContainer = document.getElementById('development-info-container');
        const rationaleEl = document.getElementById('dev-rationale');
        const studentModelEl = document.getElementById('dev-student-model');

        if (devContainer && rationaleEl && studentModelEl) {
            rationaleEl.textContent = response.question_selection_rationale || 'N/A';
            if (response.student_model_analysis) {
                const studentModel = response.student_model_analysis;
                studentModelEl.textContent = JSON.stringify(studentModel, null, 2);
                saveStudentModel(studentModel); // Save the new model
            }
            devContainer.style.display = 'block';
        }
    }

    function saveStudentModel(studentModel) {
        localStorage.setItem('cogniTrainStudentModel', JSON.stringify(studentModel));
    }

    function loadStudentModel() {
        const savedModel = localStorage.getItem('cogniTrainStudentModel');
        if (savedModel) {
            const studentModel = JSON.parse(savedModel);
            const studentModelEl = document.getElementById('dev-student-model');
            if (studentModelEl) {
                studentModelEl.textContent = JSON.stringify(studentModel, null, 2);
                 document.getElementById('development-info-container').style.display = 'block';
            }
            return studentModel;
        }
        return null;
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addMessage(content, type, isHtml = false) {
        const template = type === 'tutor' ? tutorMessageTemplate : userMessageTemplate;
        const messageClone = template.content.cloneNode(true);
        const container = messageClone.querySelector(type === 'tutor' ? '.message-content' : '.message-bubble');
        
        if (isHtml) {
            container.innerHTML = content;
        } else {
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = content;
            if (type === 'tutor') {
                container.appendChild(bubble);
            } else {
                 container.textContent = content;
            }
        }
        
        chatBox.appendChild(messageClone);
        setTimeout(scrollToBottom, 50);
        return container;
    }

    function setInputState(disabled, placeholder = "Type your answer or ask a question...") {
        userInput.disabled = disabled;
        userInput.placeholder = placeholder;
        chatForm.querySelector('.send-btn').disabled = disabled;
    }

    function renderOptions(container, options, isQuestion = true) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container-in-chat';
        const optionsHtml = Object.entries(options)
            .map(([key, value]) => {
                const dataAttribute = isQuestion ? `data-key="${key}"` : `data-action="${key}"`;
                return `<button class="quick-reply" ${dataAttribute}>${value}</button>`;
            })
            .join('');
        optionsContainer.innerHTML = optionsHtml;
        container.appendChild(optionsContainer);
    }

    async function handleBackendResponse(response) {
        if (response.error) {
            addMessage(`Error: ${response.error}`, 'tutor');
            setInputState(false);
            return;
        }

        // Always update the question index if the backend provides it.
        if (response.question_index !== undefined) {
            currentQuestionIndex = response.question_index;
        }

        let fullCoachResponse = response.coach_response;

        // Render the UI based on the action
        if (response.action === 'GREET_USER' && response.options) {
            const tutorMessageContainer = addMessage(response.coach_response, 'tutor');
            renderOptions(tutorMessageContainer, response.options, false);
        } else if (response.action === 'ASK_QUESTION' && response.question) {
            // Combine the intro and the question for both UI and history
            fullCoachResponse += `\n\n${response.question.question}`;
            const messageHtml = `<div class="message-bubble">${response.coach_response}</div><div class="message-bubble">${response.question.question}</div>`;
            const tutorMessageContainer = addMessage(messageHtml, 'tutor', true);
            renderOptions(tutorMessageContainer, response.question.options, true);
        } else if (response.action === 'EVALUATE_ANSWER' && response.options) {
            const correctnessClass = response.is_correct ? 'correct-answer' : 'incorrect-answer';
            let feedbackHtml = `<div class="message-bubble ${correctnessClass}">${response.coach_response}</div>`;
            if (response.correct_statement) {
                // Also combine for history
                fullCoachResponse += `

Answer: ${response.correct_statement}`;
                feedbackHtml += `<div class="message-bubble correct-statement"><strong>Answer:</strong> ${response.correct_statement}</div>`;
            }
            const tutorMessageContainer = addMessage(feedbackHtml, 'tutor', true);
            renderOptions(tutorMessageContainer, response.options, false);
        } else if (response.action === 'END_QUIZ') {
            addMessage(response.coach_response, 'tutor');
            setInputState(true, "Quiz finished. Refresh to start again.");
            clearSession(); // This also resets the index
        } else {
            addMessage(response.coach_response || "Sorry, something went wrong.", 'tutor');
        }

        // Add the complete, accurate AI response to the history array
        chatHistory.push({ 
            role: 'model', 
            content: fullCoachResponse, 
            timestamp: new Date().toISOString() 
        });

        // Enable input unless the quiz is over
        if (response.action !== 'END_QUIZ') {
            setInputState(false);
        }
        
        // Update debug info and save the final, correct state to localStorage
        updateDevelopmentInfo(response);
        saveSession();
    }

    async function sendMessage(messageText) {
        // If the user sends a non-empty message, add it to the UI and the history.
        if (messageText) {
            addMessage(messageText, 'user');
            chatHistory.push({ 
                role: 'user', 
                content: messageText, 
                timestamp: new Date().toISOString() 
            });
        }
        
        setInputState(true, "Coach is thinking...");
        saveSession(); // Save state immediately
        
        try {
            // The payload is always the current state of the history and index.
            // An empty history array signals the backend to start the conversation.
            const payload = {
                chat_history: chatHistory,
                current_question_index: currentQuestionIndex
            };

            // This handles the very first message to start the chat.
            if (!messageText && chatHistory.length === 0) {
                payload.chat_history = []; // Ensure it's an empty array for the initial call
            }

            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            await handleBackendResponse(data);

        } catch (error) {
            console.error("Error sending message:", error);
            addMessage("Sorry, I'm having trouble connecting. Please try again.", 'tutor');
            setInputState(false);
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = userInput.value.trim();
        if (userText && !userInput.disabled) {
            sendMessage(userText);
            userInput.value = '';
        }
    });

    chatBox.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply')) {
            const button = e.target;
            button.closest('.options-container-in-chat').querySelectorAll('.quick-reply').forEach(btn => btn.disabled = true);
            const choiceText = button.textContent;
            sendMessage(choiceText);
        }
    });

    // --- Start the conversation ---
    loadStudentModel();
    if (!loadSession()) {
        sendMessage('');
    }
    
    setupDevInfoToggle();
});