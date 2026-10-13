
document.addEventListener('DOMContentLoaded', function () {
    redirectIfNotAuth();

    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    loadPredictionsAndInsights();
});

function appendMessage(text, isUser = false) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    const msgDiv = document.createElement('div');
    msgDiv.className =
        'chat-message ' + (isUser ? 'user' : 'assistant') + ' mb-3';

    if (isUser) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;
        msgDiv.appendChild(bubble);
    } else {
        const avatar = document.createElement('div');
        avatar.className =
            'd-flex flex-shrink-0 align-items-center justify-content-center ' +
            'bg-primary text-white rounded-circle mt-1 me-2';
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        avatar.innerHTML = '<i class="bi bi-robot"></i>';

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';

        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            bubble.innerHTML = marked.parse(text);
        } else {
            bubble.textContent = text;
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
    }

    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv || document.getElementById('typingIndicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'chat-message assistant mb-3';
    indicator.textContent = 'Preparing your response...';
    messagesDiv.appendChild(indicator);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function handleChatSubmit(event) {
    event.preventDefault();

    const input = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    sendMessage(message);
}

function sendQuickMessage(message) {
    sendMessage(message);
}

async function sendMessage(message) {
    appendMessage(message, true);
    showTypingIndicator();

    try {
        const transactions = await apiRequest('/transactions');
        removeTypingIndicator();

        if (!Array.isArray(transactions)) {
            appendMessage(
                'I could not read your transactions. Please check your connection and try again.'
            );
            return;
        }

        appendMessage(buildFinanceReply(message, transactions));
    } catch (error) {
        console.error('Finance assistant error:', error);
        removeTypingIndicator();
        appendMessage(
            'I could not connect to the finance backend. Please make sure the backend is running and log in again.'
        );
    }
}

function buildFinanceReply(message, transactions) {
    const question = message.toLowerCase();

    const income = transactions
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expenses = transactions
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const balance = income - expenses;

    if (
        question.includes('income') ||
        question.includes('earned') ||
        question.includes('earning')
    ) {
        return 'Your recorded total income is ' + formatCurrency(income) + '.';
    }

    if (
        question.includes('expense') ||
        question.includes('spend') ||
        question.includes('spent')
    ) {
        return 'Your recorded total expenses are ' + formatCurrency(expenses) + '.';
    }

    if (
        question.includes('balance') ||
        question.includes('left') ||
        question.includes('remaining')
    ) {
        return 'Your recorded balance (income minus expenses) is ' +
            formatCurrency(balance) + '.';
    }

    if (question.includes('saving') || question.includes('save')) {
        const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        return 'Your calculated savings rate is ' + rate.toFixed(1) +
            '%. This is based on all recorded income and expenses.';
    }

    if (
        question.includes('how many') ||
        question.includes('number of transactions') ||
        question.includes('transaction count')
    ) {
        return 'You have ' + transactions.length +
            ' recorded transactions.';
    }

    return 'I can help with your recorded finances. Try asking: ' +
        '"What is my total income?", "How much did I spend?", ' +
        '"What is my balance?", "What is my savings rate?", or ' +
        '"How many transactions do I have?"';
}

async function loadPredictionsAndInsights() {
    const predictionContainer = document.getElementById('predictionContent');
    const recommendationContainer =
        document.getElementById('recommendationContent');

    if (predictionContainer) {
        predictionContainer.textContent =
            'Predictions are not available because the backend prediction endpoint has not been configured.';
    }

    if (!recommendationContainer) return;

    try {
        const data = await apiRequest('/insights');
        const tips = data && Array.isArray(data.tips) ? data.tips : [];

        if (tips.length === 0) {
            recommendationContainer.innerHTML =
                '<li class="text-muted">No recommendations available yet. Add transactions first.</li>';
            return;
        }

        recommendationContainer.innerHTML = '';

        tips.forEach(function (tip) {
            const item = document.createElement('li');
            item.className = 'mb-2';

            const icon = document.createElement('i');
            icon.className =
                'bi bi-arrow-right-short text-success';

            item.appendChild(icon);
            item.appendChild(document.createTextNode(' ' + String(tip)));
            recommendationContainer.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading financial insights:', error);
        recommendationContainer.innerHTML =
            '<li class="text-muted">Unable to load recommendations. Check the backend connection.</li>';
    }
}