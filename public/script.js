document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    // Auth Elements
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const displayName = document.getElementById('display-name');
    const authStatus = document.getElementById('auth-status');

    // Generate a guest ID if not logged in
    let sessionId = localStorage.getItem('guestId') || 'guest_' + Math.random().toString(36).substring(7);
    localStorage.setItem('guestId', sessionId);

    // Check for existing token
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (token && savedUsername) {
        showLoggedIn(savedUsername);
    }

    function showLoggedIn(username) {
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        displayName.textContent = username;
        sessionId = username; // Bind session to username
    }

    function showLoggedOut() {
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        sessionId = localStorage.getItem('guestId');
        usernameInput.value = '';
        passwordInput.value = '';
        authStatus.textContent = "Playing as Guest";
    }

    // Auth Handlers
    registerBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        if(!username || !password) return alert('Fill all fields');
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if(res.ok) authStatus.textContent = "Registered! Now login.";
            else alert(data.error);
        } catch(e) { console.error(e); }
    });

    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        if(!username || !password) return;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if(res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                showLoggedIn(data.username);
            } else alert(data.error);
        } catch(e) { console.error(e); }
    });

    logoutBtn.addEventListener('click', showLoggedOut);

    // Markdown to HTML parser
    function parseMarkdown(text) {
        return text
            // Escape HTML to prevent XSS
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Headers: ### h3, ## h2, # h1
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold: **text**
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic: *text*
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Horizontal rule: ---
            .replace(/^---$/gm, '<hr>')
            // Unordered list items: * item or - item (but not **bold**)
            .replace(/^\* (?!\*)(.+)$/gm, '<li>$1</li>')
            .replace(/^- (?!-)(.+)$/gm, '<li>$1</li>')
            // Numbered list items: 1. item
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            // Wrap consecutive <li> items in <ul>
            .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
            // Line breaks: double newline = paragraph break
            .replace(/\n{2,}/g, '</p><p>')
            // Single newlines (not already converted)
            .replace(/\n/g, '<br>')
            // Wrap everything in a paragraph if not already block-level
            .replace(/^(?!<h[1-6]|<ul|<hr|<p)(.+)/gm, '$1');
    }

    // Chat Handlers
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('bubble');

        if (sender === 'bot') {
            bubbleDiv.innerHTML = parseMarkdown(text);
        } else {
            bubbleDiv.textContent = text;
        }
        
        msgDiv.appendChild(bubbleDiv);
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, sessionId })
            });
            const data = await response.json();
            addMessage(data.reply, 'bot');
        } catch (error) {
            addMessage("Error connecting to server.", 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});