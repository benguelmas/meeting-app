# 📞 Meeting Application

This is a simple video conferencing application built using **WebRTC**, **Socket.IO**, and **Node.js**.  
Users can join rooms to communicate via real-time audio/video and send messages.

## 🚀 Features

- ✅ Real-time video/audio communication (WebRTC)  
- ✅ User login and room joining  
- ✅ Participant list and count  
- ✅ Instant messaging (chat)  
- ✅ Public access via Ngrok tunnel

---

## ⚙️ Installation and Running the Project

### ⬇️ 1.Clone the Repository

bash
git clone https://github.com/benguelmas/meeting-app.git
cd meeting-app


### ✅ 2.Install Dependencies

npm install

### 🖥️ 3.Start the Server

node server.js

Now, the application will be running at http://localhost:3000.

### 🌐 4.Make It Public with Ngrok
Ngrok allows you to make your local server temporarily accessible from the internet.

### 🔧 5.Install Ngrok
Download the appropriate version from: https://ngrok.com/download

Unzip the file and place ngrok.exe in your project folder.

Then run the following command to add your token (only once):

ngrok config add-authtoken <ngrok_auth_token>

You can find your token here: https://dashboard.ngrok.com/get-started/setup

### 🌍6. Start Ngrok Tunnel
While the application is running, open a new terminal and run:

ngrok http 3000

Ngrok will provide you with an HTTPS link. Share this link with others to allow them to join the meeting.

### 📁 Project Structure

meeting-app/
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── server.js
├── package.json
└── README.md

## 📸 Screenshots
Below are some screenshots from the application:

![Login Page](image.png)
![Left Panel](image-1.png)
![Meeting Interface](image-2.png)

### 📝 Notes
Ngrok links are temporary. A new link is generated every time you start it.

To share the app, make sure to run node server.js and get a public link using ngrok http 3000.

Advanced features such as security and authentication are not included in this basic version.



##👩‍💻 Developer
Bengü Elmas
GitHub: @benguelmas


