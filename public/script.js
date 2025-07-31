const socket = io();
const videoGrid = document.getElementById('video-grid');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const cameraBtn = document.getElementById('cameraBtn');
const micBtn = document.getElementById('micBtn');
const screenShareBtn = document.getElementById('screenShareBtn');
const timerDiv = document.getElementById('timer');
const themeBtn = document.getElementById("theme-btn");

let myStream;
let peers = {};
let screenStream;
let screenVideoContainer;

const params = new URLSearchParams(window.location.search);
const username = params.get('username');
const roomId = params.get('room');
const password = params.get('password');

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeBtn.innerText = theme === "dark" ? "☀️ Açık Mod" : "🌙 Koyu Mod";
}

themeBtn.addEventListener("click", () => {
    const current = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    applyTheme(current);
});

if (localStorage.getItem("theme") === "dark") {
    applyTheme("dark");
} else {
    applyTheme("light");
}

if (!username || !roomId || !password) {
    window.location.href = "login.html";
}

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        myStream = stream;
        addVideoStream(stream, username, true);

        socket.emit('join-room', { roomId, username, password });

        socket.on('chat-history', (messages) => {
            messages.forEach(data => {
                appendChatMessage(data);
            });
        });

        socket.on('user-connected', ({ userId, username }) => {
            connectToNewUser(userId, stream, username);
        });

        socket.on('signal', (data) => {
            if (peers[data.userId]) {
                peers[data.userId].signal(data.signal);
            } else {
                const peer = new SimplePeer({
                    initiator: false,
                    trickle: false,
                    stream: myStream
                });

                peer.on('signal', signal => {
                    socket.emit('signal', { userId: data.userId, signal });
                });

                peer.on('stream', userVideoStream => {
                    addVideoStream(userVideoStream, data.username || "Katılımcı");
                });

                peers[data.userId] = peer;
                peer.signal(data.signal);
            }
        });

        socket.on('user-disconnected', userId => {
            if (peers[userId]) {
                peers[userId].destroy();
                delete peers[userId];
            }
        });

        socket.on('update-user-list', (users) => {
            userList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.innerText = user;
                userList.appendChild(li);
            });
            userCount.innerText = users.length;
        });

        socket.on('createMessage', (data) => {
            appendChatMessage(data);
        });

        socket.on('update-timer', (data) => {
            const remaining = data.remaining;
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerDiv.innerText = `Süre: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        });

        socket.on('wrong-password', () => {
            alert("Şifre yanlış!");
            window.location.href = "login.html";
        });

        socket.on('session-ended', () => {
            alert("Oturum süresi sona erdi!");
            window.location.href = "login.html";
        });
    });

function connectToNewUser(userId, stream, username) {
    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream
    });

    peer.on('signal', signal => {
        socket.emit('signal', { userId, signal });
    });

    peer.on('stream', userVideoStream => {
        addVideoStream(userVideoStream, username || "Katılımcı");
    });

    peers[userId] = peer;
}

function addVideoStream(stream, label, isLocal = false) {
    const videoContainer = document.createElement('div');
    videoContainer.classList.add('video-container');

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';

    const userLabel = document.createElement('div');
    userLabel.innerText = label;
    userLabel.classList.add('user-label');

    const statusIcons = document.createElement('div');
    statusIcons.classList.add('status-icons');

    const camIcon = document.createElement('span');
    camIcon.classList.add('icon');
    camIcon.innerText = '📷';

    const micIcon = document.createElement('span');
    micIcon.classList.add('icon');
    micIcon.innerText = '🎤';

    statusIcons.appendChild(camIcon);
    statusIcons.appendChild(micIcon);

    videoContainer.appendChild(video);
    videoContainer.appendChild(userLabel);
    videoContainer.appendChild(statusIcons);
    videoGrid.appendChild(videoContainer);

    updateGridLayout();

    function updateIcons() {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (!videoTrack || !videoTrack.enabled) {
            camIcon.innerText = '🚫📷';
            camIcon.classList.add('cam-off');
        } else {
            camIcon.innerText = '📷';
            camIcon.classList.remove('cam-off');
        }

        if (!audioTrack || !audioTrack.enabled) {
            micIcon.innerText = '🚫🎤';
            micIcon.classList.add('mic-off');
        } else {
            micIcon.innerText = '🎤';
            micIcon.classList.remove('mic-off');
        }
    }

    updateIcons();

    if (isLocal) {
        // Yerel stream değişikliklerini izle
        stream.getVideoTracks()[0].addEventListener('enabled', updateIcons);
        stream.getVideoTracks()[0].addEventListener('disabled', updateIcons);
        stream.getAudioTracks()[0].addEventListener('enabled', updateIcons);
        stream.getAudioTracks()[0].addEventListener('disabled', updateIcons);
    }

    return videoContainer;
}

function updateGridLayout() {
    const count = videoGrid.children.length;
    videoGrid.className = "video-grid";
    if (count === 1) videoGrid.classList.add("grid-1");
    else if (count === 2) videoGrid.classList.add("grid-2");
    else if (count <= 4) videoGrid.classList.add("grid-2");
    else if (count <= 6) videoGrid.classList.add("grid-3");
    else videoGrid.classList.add("grid-4");
}

function appendChatMessage(data) {
    const div = document.createElement('div');
    div.innerHTML = `<strong style="color: var(--primary);">${data.username}</strong>: <span style="color: var(--text);">${data.message}</span>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value;
    if (message.trim()) {
        socket.emit('message', message);
        chatInput.value = '';
    }
});

cameraBtn.addEventListener('click', () => {
    const videoTrack = myStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    cameraBtn.innerText = videoTrack.enabled ? "Kamerayı Kapat" : "Kamerayı Aç";
});

micBtn.addEventListener('click', () => {
    const audioTrack = myStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    micBtn.innerText = audioTrack.enabled ? "Mikrofonu Kapat" : "Mikrofonu Aç";
});

screenShareBtn.addEventListener('click', async () => {
    if (!screenStream) {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            screenVideoContainer = addVideoStream(screenStream, username + " (Ekran)");
            screenShareBtn.innerText = "Paylaşımı Durdur";

            Object.values(peers).forEach(peer => {
                screenStream.getTracks().forEach(track => {
                    peer.addTrack(track, screenStream);
                });
            });

            screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                stopScreenShare();
            });
        } catch (err) {
            console.error("Ekran paylaşımı başlatılamadı: ", err);
        }
    } else {
        stopScreenShare();
    }
});

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
        screenShareBtn.innerText = "Ekranı Paylaş";

        if (screenVideoContainer) {
            videoGrid.removeChild(screenVideoContainer);
            screenVideoContainer = null;
            updateGridLayout();
        }
    }
}
