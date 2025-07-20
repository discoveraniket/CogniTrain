document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-input-form');
    const userInput = document.getElementById('user-input');
    const tutorMessageTemplate = document.getElementById('tutor-message-template');
    const userMessageTemplate = document.getElementById('user-message-template');
    
    // --- Sidebar Elements ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
    const sidebarCloseButton = document.getElementById('sidebar-close-button');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- About Modal Elements ---
    const infoButton = document.getElementById('info-button');
    const aboutModal = document.getElementById('about-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const startOverButton = document.getElementById('start-over-button');

    // --- AI Info Modal Elements ---
    const aiInfoButton = document.getElementById('ai-info-button');
    const aiInfoModal = document.getElementById('ai-info-modal');
    const closeAiInfoModalButton = document.getElementById('close-ai-info-modal-button');

    // --- Question Bank Elements ---
    const questionBankToggle = document.getElementById('question-bank-toggle');
    const questionBankDropdown = document.getElementById('question-bank-dropdown');

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

    // --- Sidebar Logic ---
    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
    }

    if (sidebarToggleButton && sidebarCloseButton && sidebarOverlay) {
        sidebarToggleButton.addEventListener('click', openSidebar);
        sidebarCloseButton.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // --- Question Bank Logic ---
    if (questionBankToggle && questionBankDropdown) {
        questionBankToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the click from closing the sidebar immediately
            questionBankDropdown.classList.toggle('show');
            questionBankToggle.parentElement.classList.toggle('open');
        });
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

    // --- AI Info Modal Logic ---
    if (aiInfoButton && aiInfoModal && closeAiInfoModalButton) {
        aiInfoButton.addEventListener('click', () => {
            closeSidebar(); // Close the sidebar first
            aiInfoModal.classList.remove('hidden');
        });
        closeAiInfoModalButton.addEventListener('click', () => {
            aiInfoModal.classList.add('hidden');
        });
        aiInfoModal.addEventListener('click', (e) => {
            if (e.target === aiInfoModal) {
                aiInfoModal.classList.add('hidden');
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
                closeSidebar(); // Close sidebar after action
            }
        });
    }

    // --- Core Functions ---
    function updateDevelopmentInfo(response) {
        const rationaleEl = document.getElementById('dev-rationale');
        const studentModelEl = document.getElementById('dev-student-model');

        if (!rationaleEl || !studentModelEl) return;

        const hasRationale = !!response.question_selection_rationale;
        const hasModel = !!response.student_model_analysis;

        if (hasRationale) {
            rationaleEl.textContent = response.question_selection_rationale;
        }
        else {
            rationaleEl.textContent = "N/A"
        }

        if (hasModel) {
            const studentModel = response.student_model_analysis;
            studentModelEl.textContent = JSON.stringify(studentModel, null, 2);
            saveStudentModel(studentModel); // Save the new model
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

        // Update question index if present
        if (response.question_index !== null && response.question_index !== undefined) {
            currentQuestionIndex = response.question_index;
        }

        let messageHtml = '';

        // 1. Main AI response (feedback, greeting, etc.)
        if (response.ai_response) {
            const correctnessClass = (response.is_correct !== null && response.is_correct !== undefined)
                ? (response.is_correct ? 'correct-answer' : 'incorrect-answer')
                : '';
            messageHtml += `<div class="message-bubble ${correctnessClass}">${response.ai_response}</div>`;
        }

        // 2. Question text
        if (response.question) {
            messageHtml += `<div class="message-bubble">${response.question}</div>`;
        }

        // 3. Correct answer statement
        if (response.correct_answer) {
            messageHtml += `<div class="message-bubble correct-statement"><strong>Answer:</strong> ${response.correct_answer}</div>`;
        }

        // Render the message bubbles if there's any HTML to render
        let tutorMessageContainer;
        if (messageHtml) {
            tutorMessageContainer = addMessage(messageHtml, 'tutor', true);
        }

        // 4. Options
        if (response.options) {
            const isQuestion = !!response.question;
            // Append options to the last message container, or create a new one if none exists
            const targetContainer = tutorMessageContainer || addMessage('', 'tutor');
            renderOptions(targetContainer, response.options, isQuestion);
        }

        // Add the full response object to history for the backend
        chatHistory.push({
            role: 'model',
            content: JSON.stringify(response),
            timestamp: new Date().toISOString()
        });

        // Update dev info panel
        updateDevelopmentInfo(response);

        // Enable user input for the next turn
        setInputState(false);

        // Save the session state
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
        
        setInputState(true, "CogniTrain is thinking...");
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
    
    populateQuestionBanks();
    setupDevInfoToggle();
});

function populateQuestionBanks() {
    const questionBankDropdown = document.getElementById('question-bank-dropdown');
    if (!questionBankDropdown) return;

    fetch('/question-banks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load question banks');
            }
            return response.json();
        })
        .then(banks => {
            questionBankDropdown.innerHTML = ''; // Clear existing options
            banks.forEach(bank => {
                const link = document.createElement('a');
                link.href = '#';
                link.className = 'dropdown-item';
                link.textContent = bank.name;
                link.dataset.bank = bank.file;
                questionBankDropdown.appendChild(link);
            });
        })
        .catch(error => {
            console.error('Error fetching question banks:', error);
            questionBankDropdown.innerHTML = '<a href="#" class="dropdown-item">Error loading banks</a>';
        });
}