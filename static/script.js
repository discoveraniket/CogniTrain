document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-input-form');
    const userInput = document.getElementById('user-input');
    const tutorMessageTemplate = document.getElementById('tutor-message-template');
    const userMessageTemplate = document.getElementById('user-message-template');

    // --- Core Functions ---

    // --- DEVELOPMENT_ONLY_START ---
    function setupDevInfoToggle() {
        const toggle = document.getElementById('dev-info-toggle');
        const content = document.getElementById('dev-info-content');
        if (toggle && content) {
            toggle.addEventListener('click', () => {
                const isVisible = content.style.display !== 'none';
                content.style.display = isVisible ? 'none' : 'block';
                toggle.textContent = isVisible ? '+' : '-';
            });
        }
    }

    function updateDevelopmentInfo(response) {
        // This key is added by the backend for development purposes.
        if (!response._development_info) {
            return;
        }

        const devContainer = document.getElementById('development-info-container');
        const rationaleEl = document.getElementById('dev-rationale');
        const studentModelEl = document.getElementById('dev-student-model');
        const rawResponseEl = document.getElementById('dev-raw-response');

        if (devContainer && rationaleEl && studentModelEl && rawResponseEl) {
            rationaleEl.textContent = response.question_selection_rationale || 'N/A';
            studentModelEl.textContent = JSON.stringify(response.student_model_analysis, null, 2) || 'N/A';
            rawResponseEl.textContent = response._development_info;

            devContainer.style.display = 'block';
        }
    }
    // --- DEVELOPMENT_ONLY_END ---

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
            if (type === 'tutor') {
                const bubble = document.createElement('div');
                bubble.className = 'message-bubble';
                bubble.textContent = content;
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
                // If it's a question, the data-key is the option letter (a, b, c).
                // If it's a greeting, the data-key is the action (begin).
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

        // Action: GREET_USER -> Render "Let's Begin" button
        if (response.action === 'GREET_USER' && response.options) {
            const tutorMessageContainer = addMessage(response.coach_response, 'tutor');
            renderOptions(tutorMessageContainer, response.options, false);
            setInputState(false, "Type your answer or ask a question...");
        } 
        // Action: ASK_QUESTION -> Render the question and its options
        else if (response.action === 'ASK_QUESTION' && response.question) {
            const messageHtml = `
                <div class="message-bubble">${response.coach_response}</div>
                <div class="message-bubble">${response.question.question}</div>
            `;
            const tutorMessageContainer = addMessage(messageHtml, 'tutor', true);
            renderOptions(tutorMessageContainer, response.question.options, true);
            setInputState(false, "Type your answer or ask a question...");
        }
        // Action: EVALUATE_ANSWER -> Render feedback and "Next Question" button
        else if (response.action === 'EVALUATE_ANSWER' && response.options) {
            const tutorMessageContainer = addMessage(response.coach_response, 'tutor');
            renderOptions(tutorMessageContainer, response.options, false);
            setInputState(false, "Type your answer or ask a question...");
        }
        // Action: END_QUIZ -> Display final message
        else if (response.action === 'END_QUIZ') {
            addMessage(response.coach_response, 'tutor');
            setInputState(false, "Quiz finished. Refresh to start again.");
        }
        // Fallback for any other case
        else {
            addMessage(response.coach_response || "Sorry, something went wrong.", 'tutor');
            setInputState(false);
        }
        // --- DEVELOPMENT_ONLY_START ---
        updateDevelopmentInfo(response);
        // --- DEVELOPMENT_ONLY_END ---
    }

    async function sendMessage(messageText) {
        console.log('sendMessage called with:', messageText);
        if (messageText) {
            addMessage(messageText, 'user');
        }
        setInputState(true, "Coach is thinking...");
        
        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            console.log('Received backend response:', data);
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
            // Disable all buttons in the same group
            button.closest('.options-container-in-chat').querySelectorAll('.quick-reply').forEach(btn => btn.disabled = true);
            
            const choiceText = button.textContent;
            sendMessage(choiceText);
        }
    });

    // --- Start the conversation ---
    sendMessage('');
    // --- DEVELOPMENT_ONLY_START ---
    setupDevInfoToggle();
    // --- DEVELOPMENT_ONLY_END ---
});