// STATE MANAGEMENT
const state = {
    isLoggedIn: false,
    isRegistering: false,
    isAnonymous: false,
    currentUser: null,
    currentGroup: null,
    ws: null,
};

// DOM ELEMENTS
let pages, authForm, formTitle, submitButton, toggleAuthLink, errorMessage,
    usernameInput, passwordInput, groupsList, createGroupForm, groupNameInput,
    logoutButton, backToGroupsButton, chatGroupName, chatMessages, messageForm,
    messageInput, anonymousToggleButton, anonymousBanner,
    manageRequestsButton, requestsModal, closeButton, requestsList,
    profilePictureSection, profilePictureInput, profilePreviewImg, profilePreviewPlaceholder;

// UI NAVIGATION
function showPage(pageName) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    pages[pageName].classList.add('active');
}

function updateAuthFormUI() {
    formTitle.textContent = state.isRegistering ? 'Register' : 'Login';
    submitButton.textContent = state.isRegistering ? 'Register' : 'Login';
    toggleAuthLink.textContent = state.isRegistering ? 'Already have an account? Login' : 'Don\'t have an account? Register';
    errorMessage.textContent = '';
    authForm.reset();

    // Show/hide profile picture section based on registration mode
    if (profilePictureSection) {
        profilePictureSection.classList.toggle('hidden', !state.isRegistering);
    }
}

// PROFILE PICTURE HELPERS
function handleProfilePicturePreview() {
    const file = profilePictureInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePreviewImg.src = e.target.result;
            profilePreviewImg.classList.remove('hidden');
            profilePreviewPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        profilePreviewImg.classList.add('hidden');
        profilePreviewPlaceholder.classList.remove('hidden');
    }
}

async function uploadProfilePicture(userId, file) {
    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('userId', userId);

    try {
        const response = await fetch('/api/upload-profile-picture', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');
        return data.profilePictureUrl;
    } catch (error) {
        console.error('Profile picture upload failed:', error);
        throw error;
    }
}

// API HELPERS
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    try {
        const response = await fetch(`/api${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'An error occurred');
        return data;
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        errorMessage.textContent = error.message;
        throw error;
    }
}

// WEBSOCKETS
function connectWebSocket() {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    state.ws = new WebSocket(`${protocol}//${window.location.host}`);
    state.ws.onopen = () => console.log('WebSocket connected');
    state.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && state.currentGroup && data.groupId === state.currentGroup.id) {
            renderMessage(data);
        }
    };
    state.ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };
    state.ws.onerror = (error) => console.error('WebSocket error:', error);
}

// RENDERING
function renderMessage(message) {
    const isMine = message.userId === state.currentUser.id;
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isMine ? 'mine' : 'theirs'}`;

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isMine ? 'mine' : 'theirs'}`;

    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = message.content;

    if (!isMine) {
        // Add avatar for others' messages
        const avatar = document.createElement('img');
        if (message.isAnonymous) {
            // For anonymous messages, use a generic anonymous avatar
            avatar.src = 'https://placehold.co/32x32/666666/FFFFFF?text=?';
        } else if (message.profile_picture_url) {
            avatar.src = message.profile_picture_url;
        } else {
            // For non-anonymous messages without profile picture, use username initial
            avatar.src = `https://placehold.co/32x32/EAEAEA/333?text=${message.username.charAt(0).toUpperCase()}`;
        }
        avatar.alt = 'avatar';
        avatar.className = 'avatar';
        avatar.onerror = () => {
            // Fallback to default avatar if profile picture fails to load
            if (message.isAnonymous) {
                avatar.src = 'https://placehold.co/32x32/666666/FFFFFF?text=?';
            } else {
                avatar.src = `https://placehold.co/32x32/EAEAEA/333?text=${message.username.charAt(0).toUpperCase()}`;
            }
        };
        wrapper.appendChild(avatar);

        const sender = document.createElement('p');
        sender.className = 'message-sender';
        sender.textContent = message.isAnonymous ? 'Anonymous' : message.username;
        bubble.appendChild(sender);
    }

    bubble.appendChild(content);

    // Timestamp and status
    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.appendChild(timestamp);

    bubble.appendChild(meta);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight; // Auto-scroll
}

async function renderGroups() {
    try {
        const { groups, memberships } = await apiCall('/groups');
        groupsList.innerHTML = '';
        groups.forEach(group => {
            const li = document.createElement('li');
            li.className = 'group-item';
            li.innerHTML = `<span>${group.name}</span>`;
            const userMembership = memberships.find(m => m.group_id === group.id && m.user_id === state.currentUser.id);

            const joinButton = document.createElement('button');
            if (userMembership?.status === 'approved') {
                joinButton.textContent = 'Enter';
                joinButton.onclick = () => enterGroup(group);
            } else if (userMembership?.status === 'pending') {
                joinButton.textContent = 'Pending';
                joinButton.disabled = true;
            } else {
                joinButton.textContent = 'Join';
                joinButton.onclick = () => joinGroup(group.id);
            }
            li.appendChild(joinButton);
            groupsList.appendChild(li);
        });
    } catch (error) {
        console.error('Failed to render groups:', error);
    }
}


// EVENT HANDLERS

async function joinGroup(groupId) {
    try {
        await apiCall(`/groups/${groupId}/join`, 'POST', { userId: state.currentUser.id });
        await renderGroups();
    } catch (error) { /* Handled by apiCall */ }
}

async function enterGroup(group) {
    state.currentGroup = group;
    chatGroupName.textContent = group.name;
    manageRequestsButton.classList.toggle('hidden', state.currentUser.id !== group.creator_id);
    chatMessages.innerHTML = '';
    const messages = await apiCall(`/groups/${group.id}/messages`);
    messages.forEach(renderMessage);
    showPage('chat');
}


// INITIALIZATION
async function initializeApp() {
    if (state.isLoggedIn) {
        connectWebSocket();
        await renderGroups();
        showPage('groups');
    } else {
        showPage('auth');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ASSIGN DOM ELEMENTS
    pages = {
        auth: document.getElementById('auth-screen'),
        groups: document.getElementById('groups-screen'),
        chat: document.getElementById('chat-screen'),
    };
    authForm = document.getElementById('auth-form');
    formTitle = document.getElementById('form-title');
    submitButton = document.getElementById('submit-button');
    toggleAuthLink = document.getElementById('toggle-auth');
    errorMessage = document.getElementById('error-message');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    groupsList = document.getElementById('groups-list');
    createGroupForm = document.getElementById('create-group-form');
    groupNameInput = document.getElementById('group-name');
    logoutButton = document.getElementById('logout-button');
    backToGroupsButton = document.getElementById('back-to-groups');
    chatGroupName = document.getElementById('chat-group-name');
    chatMessages = document.getElementById('chat-messages');
    messageForm = document.getElementById('message-form');
    messageInput = document.getElementById('message-input');
    anonymousToggleButton = document.getElementById('anonymous-toggle-button');
    anonymousBanner = document.getElementById('anonymous-banner');
    manageRequestsButton = document.getElementById('manage-requests-button');
    requestsModal = document.getElementById('requests-modal');
    closeButton = document.querySelector('.close-button');
    requestsList = document.getElementById('requests-list');
    profilePictureSection = document.getElementById('profile-picture-section');
    profilePictureInput = document.getElementById('profile-picture');
    profilePreviewImg = document.getElementById('profile-preview-img');
    profilePreviewPlaceholder = document.getElementById('profile-preview-placeholder');

    // ATTACH EVENT LISTENERS

    // Authentication
    toggleAuthLink.addEventListener('click', () => {
        state.isRegistering = !state.isRegistering;
        updateAuthFormUI();
    });

    // Profile picture preview
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', handleProfilePicturePreview);
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const endpoint = state.isRegistering ? '/register' : '/login';
        const body = { username: usernameInput.value, password: passwordInput.value };
        try {
            const data = await apiCall(endpoint, 'POST', body);
            state.currentUser = data.user;
            state.isLoggedIn = true;

            // Handle profile picture upload for registration
            if (state.isRegistering && profilePictureInput.files[0]) {
                try {
                    const profilePictureUrl = await uploadProfilePicture(data.user.id, profilePictureInput.files[0]);
                    state.currentUser.profile_picture_url = profilePictureUrl;
                } catch (uploadError) {
                    console.error('Profile picture upload failed:', uploadError);
                    // Continue with registration even if profile picture upload fails
                }
            }

            sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            initializeApp();
        } catch (error) { /* Handled by apiCall */ }
    });

    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.reload();
    });

    // Groups
    createGroupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/groups', 'POST', { name: groupNameInput.value, creatorId: state.currentUser.id });
            groupNameInput.value = '';
            await renderGroups();
        } catch (error) { /* Handled by apiCall */ }
    });

    // Chat
    backToGroupsButton.addEventListener('click', async () => {
        state.currentGroup = null;
        await renderGroups();
        showPage('groups');
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (content && state.ws?.readyState === WebSocket.OPEN) {
            state.ws.send(JSON.stringify({
                type: 'message',
                content,
                userId: state.currentUser.id,
                groupId: state.currentGroup.id,
                isAnonymous: state.isAnonymous,
            }));
            messageInput.value = '';
        }
    });

    anonymousToggleButton.addEventListener('click', () => {
        state.isAnonymous = !state.isAnonymous;
        anonymousBanner.classList.toggle('hidden', !state.isAnonymous);

        const iconCircle = anonymousToggleButton.querySelector('circle');
        const iconPath = anonymousToggleButton.querySelectorAll('path')[2];

        if (state.isAnonymous) {
            iconCircle.style.fill = '#D9534F';
            iconPath.style.fill = '#FFFFFF';
        } else {
            iconCircle.style.fill = '#FFFFFF';
            iconPath.style.fill = '#D9534F';
        }
    });

    // Modal Logic
    manageRequestsButton.addEventListener('click', async () => {
        try {
            const requests = await apiCall(`/groups/${state.currentGroup.id}/requests`);
            requestsList.innerHTML = requests.length ? '' : '<li>No pending requests.</li>';
            requests.forEach(req => {
                const li = document.createElement('li');
                li.className = 'request-item';
                li.innerHTML = `<span>${req.username}</span><button data-user-id="${req.user_id}">Approve</button>`;
                requestsList.appendChild(li);
            });
            requestsModal.classList.remove('hidden');
        } catch (error) { console.error('Failed to fetch join requests:', error); }
    });

    requestsList.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON') {
            try {
                await apiCall(`/groups/${state.currentGroup.id}/approve`, 'POST', { userId: e.target.dataset.userId });
                e.target.textContent = 'Approved';
                e.target.disabled = true;
            } catch (error) { console.error('Failed to approve request:', error); }
        }
    });

    closeButton.addEventListener('click', () => requestsModal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === requestsModal) requestsModal.classList.add('hidden');
    });

    // Set current date
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const today = new Date();
        currentDateElement.textContent = today.toLocaleDateString();
    }

    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        state.isLoggedIn = true;
    }
    initializeApp();
});


