const socket = io('http://localhost:3000');

let username = '';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'reset-password.html') {
            window.location.href = "login.html";
        }
    } else {
        const payload = JSON.parse(atob(token.split('.')[1]));
        username = payload.user.username;
        document.getElementById('userProfile').textContent = `Logged in as: ${username}`;
        
        socket.emit('join', { username });
    }
});

async function login(event) {
    event.preventDefault(); // Prevent form from submitting the default way

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid JSON response');
        }

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username); // Store the username if needed

            window.location.href = "chat.html";
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
}




async function register(event) {
    event.preventDefault(); // Prevent form from submitting the default way

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful. You can now log in.');
            window.location.href = "login.html";
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
}


async function requestPasswordReset(event) {
    event.preventDefault();
    console.log('Request password reset initiated');

    const email = document.getElementById('email').value;
    console.log(`Email: ${email}`);

    try {
        const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            alert('Password reset email sent. Please check your inbox.');
            window.location.href = "login.html";
        } else {
            alert(data.message || 'Password reset request failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
}



async function resetPassword(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Password reset successful');
            window.location.href = "login.html";
        } else {
            alert(data.message || 'Password reset failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
}


async function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const content = messageInput.value;

            socket.emit('sendMessage', { username, content });

            messageInput.value = '';
            stopTyping();
        }

        function typing() {
            socket.emit('typing', { username });
        }

        function stopTyping() {
            socket.emit('stopTyping');
        }

        function logout() {
            localStorage.removeItem('token');
            window.location.href = "login.html";
        }

        socket.on('message', (message) => {
            const messagesDiv = document.getElementById('messages');
            const messageElement = document.createElement('div');

            // Determine if the message sender is the current user
            const isCurrentUser = message.username === username;

            // Set the display name based on whether it's the current user or not
            const displayName = isCurrentUser ? 'me' : message.username;

            messageElement.textContent = `${displayName}: ${message.content}`;
            messageElement.classList.add(isCurrentUser ? 'own-message' : 'other-message');
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        socket.on('typing', (data) => {
            const typingDiv = document.getElementById('typing');
            typingDiv.style.display = 'block';
            typingDiv.textContent = `${data.username} is typing...`;
        });

        socket.on('stopTyping', () => {
            const typingDiv = document.getElementById('typing');
            typingDiv.style.display = 'none';
        });

        socket.on('userConnected', (user) => {
            const messagesDiv = document.getElementById('messages');
            const userElement = document.createElement('div');
            userElement.textContent = `${user.username} joined the chat`;
            userElement.style.color = 'green';
            messagesDiv.appendChild(userElement);
        });

        socket.on('userDisconnected', (user) => {
            const messagesDiv = document.getElementById('messages');
            const userElement = document.createElement('div');
            userElement.textContent = `${user.username} left the chat`;
            userElement.style.color = 'red';
            messagesDiv.appendChild(userElement);
        });