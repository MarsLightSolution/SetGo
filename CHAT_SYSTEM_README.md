# WhatsApp-like Chat System

A modern, real-time chat application with features similar to WhatsApp, built with React, Node.js, and Socket.IO.

## 🚀 Features

### Core Messaging
- **Real-time messaging** with instant delivery
- **Typing indicators** showing when users are typing
- **Read receipts** with delivery status (sending, delivered, read)
- **Message timestamps** and delivery status indicators
- **Reply to messages** with threaded conversations

### Media & Files
- **Voice messages** with recording and playback
- **File sharing** (images, documents, PDFs)
- **Image preview** with click-to-open functionality
- **Document sharing** with file size and type information

### Modern UI/UX
- **WhatsApp-like interface** with clean, modern design
- **Responsive layout** that works on desktop and mobile
- **Smooth animations** and transitions
- **Dark/light theme** support
- **Gradient avatars** and modern styling

### Advanced Features
- **Emoji picker** with search functionality
- **Message reactions** (hearts, thumbs up, etc.)
- **Online/offline status** indicators
- **Unread message counters** with badges
- **Browser notifications** when app is not focused
- **Message search** functionality
- **File upload progress** indicators

## 📁 File Structure

```
Frontend/src/components/Chat/
├── ModernChatApp.jsx      # Main chat component
├── EmojiPicker.jsx        # Emoji picker component
├── ChatDemo.jsx           # Demo page
└── chatapp.jsx           # Original chat component

Backend/
├── Routes/
│   └── chatRoutes.js      # Enhanced chat API routes
├── uploads/               # File upload directory
└── index.js              # Main server file
```

## 🛠️ Installation & Setup

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:8080`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   App will run on `http://localhost:5173`

## 🎯 How to Use

### Basic Usage

1. **Connect to chat:**
   - Enter your username/email in the search box
   - Click "Chat" to start a conversation

2. **Send messages:**
   - Type in the message input
   - Press Enter or click the send button
   - Use Shift+Enter for new lines

3. **Voice messages:**
   - Click and hold the microphone button
   - Speak your message
   - Release to stop recording
   - Preview and send the voice message

4. **File sharing:**
   - Click the paperclip icon
   - Select files (images, documents, etc.)
   - Files will be uploaded and shared

5. **Emojis:**
   - Click the smiley face icon
   - Search and select emojis
   - Emojis are added to your message

### Advanced Features

1. **Message reactions:**
   - Hover over any message
   - Click the heart or reply icon
   - Add reactions or reply to messages

2. **Search messages:**
   - Use the search icon in chat header
   - Type your search query
   - View filtered results

3. **Notifications:**
   - Enable browser notifications
   - Receive alerts for new messages
   - Click notifications to focus the chat

## 🔧 API Endpoints

### Chat Routes (`/api/chat`)

- `POST /connect` - Connect user to chat system
- `GET /conversations/:userId` - Get user conversations
- `POST /conversations` - Create new conversation
- `GET /messages/:conversationId` - Get conversation messages
- `POST /messages` - Send new message
- `POST /upload` - Upload files (images, documents)
- `POST /upload-voice` - Upload voice messages
- `POST /messages/:messageId/reactions` - Add message reactions
- `POST /messages/read` - Mark messages as read
- `GET /messages/search/:conversationId` - Search messages

## 🎨 Customization

### Styling
The chat system uses Tailwind CSS for styling. You can customize:
- Colors and themes in `tailwind.config.js`
- Component styles in individual `.jsx` files
- Responsive breakpoints and layouts

### Features
Add new features by:
1. Extending the backend routes in `chatRoutes.js`
2. Adding new components in the Chat directory
3. Updating the ModernChatApp component

### Emojis
Customize the emoji picker by:
- Adding/removing emojis in `EmojiPicker.jsx`
- Changing the grid layout
- Adding emoji categories

## 🔒 Security Considerations

- File upload size limits (50MB for files, 10MB for voice)
- File type validation
- CORS configuration for cross-origin requests
- Input sanitization for messages

## 🚀 Deployment

### Backend
1. Set environment variables
2. Configure database (if using persistent storage)
3. Set up file upload directory
4. Deploy to your preferred hosting service

### Frontend
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Update API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

---

**Happy Chatting! 💬✨**