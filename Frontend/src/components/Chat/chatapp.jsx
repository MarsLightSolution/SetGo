import { useState, useEffect, useRef, useCallback } from 'react'
import io from 'socket.io-client'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image, 
  Download,
  Check,
  CheckCheck,
  Clock,
  X,
  Phone,
  Video,
  Search,
  MoreVertical,
  MessageCircle
} from 'lucide-react'

const ChatApp = () => {
  // Core state
  const [currentUser, setCurrentUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // UI state
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState({ src: '', alt: '' })
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [messageStatus, setMessageStatus] = useState({})
  
  // Refs
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messageInputRef = useRef(null)

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-connect user
  useEffect(() => {
    initializeChat()
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const initializeChat = async () => {
    try {
      setIsConnecting(true)
      
      // Get user from localStorage
      const userData = localStorage.getItem('userData')
      const userId = localStorage.getItem('userId') || localStorage.getItem('userEmail')
      
      let userIdentifier = userId
      if (userData) {
        const parsedUser = JSON.parse(userData)
        userIdentifier = parsedUser.email || parsedUser.username || parsedUser._id
      }

      if (!userIdentifier) {
        setConnectionError('Please log in to use chat')
        setIsConnecting(false)
        return
      }

      // Connect to chat
      const response = await fetch('http://localhost:8080/api/chat/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userIdentifier })
      })

      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
        await connectSocket(data.user)
        await loadConversations(data.user.userId)
        setConnectionError(null)
      } else {
        setConnectionError(data.message)
      }
    } catch (error) {
      console.error('Chat initialization error:', error)
      setConnectionError('Failed to connect to chat')
    } finally {
      setIsConnecting(false)
    }
  }

  const connectSocket = async (user) => {
    const newSocket = io('http://localhost:8080', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to chat server')
      newSocket.emit('join-user', user.userId)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server')
    })

    // User events
    newSocket.on('user-joined', (data) => {
      if (data.success) {
        console.log('Successfully joined chat')
      }
    })

    newSocket.on('user-status-changed', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        if (data.isOnline) {
          newSet.add(data.userId)
        } else {
          newSet.delete(data.userId)
        }
        return newSet
      })
    })

    // Message events
    newSocket.on('new-message', (data) => {
      const { conversationId, message } = data
      
      if (selectedConversation && conversationId === selectedConversation._id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id)
          return exists ? prev : [...prev, message]
        })
      }
      
      // Update conversations list
      loadConversations(user.userId)
    })

    newSocket.on('message-delivered', (data) => {
      setMessageStatus(prev => ({
        ...prev,
        [data.messageId]: 'delivered'
      }))
    })

    newSocket.on('messages-read', (data) => {
      data.messageIds.forEach(id => {
        setMessageStatus(prev => ({
          ...prev,
          [id]: 'read'
        }))
      })
    })

    // Typing events
    newSocket.on('user-typing', (data) => {
      if (data.conversationId === selectedConversation?._id && data.userId !== user.userId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          if (data.isTyping) {
            newSet.add(data.userName)
          } else {
            newSet.delete(data.userName)
          }
          return newSet
        })

        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.userName)
              return newSet
            })
          }, 3000)
        }
      }
    })

    setSocket(newSocket)
  }

  const loadConversations = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/chat/conversations/${userId}`)
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const startNewConversation = async () => {
    if (!currentUser || !searchQuery.trim()) return

    try {
      const response = await fetch('http://localhost:8080/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: [currentUser.userId, searchQuery.trim()]
        })
      })

      const data = await response.json()
      if (data.success) {
        await selectConversation(data.conversation)
        setSearchQuery('')
        await loadConversations(currentUser.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation')
    }
  }

  const selectConversation = async (conversation) => {
    if (!currentUser || !socket) return

    // Leave previous conversation
    if (selectedConversation) {
      socket.emit('leave-conversation', selectedConversation._id)
    }

    setSelectedConversation(conversation)
    setMessages([])
    setTypingUsers(new Set())

    // Join new conversation
    socket.emit('join-conversation', conversation._id)

    // Load messages
    try {
      const response = await fetch(`http://localhost:8080/api/chat/messages/${conversation._id}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser || !socket) return

    const messageText = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('http://localhost:8080/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderId: currentUser.userId,
          text: messageText
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, data.message])
        setMessageStatus(prev => ({
          ...prev,
          [data.message._id]: 'sending'
        }))

        socket.emit('send-message', {
          conversationId: selectedConversation._id,
          message: data.message
        })

        loadConversations(currentUser.userId)
      } else {
        alert('Failed to send message')
        setNewMessage(messageText)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
      setNewMessage(messageText)
    }
  }

  const handleFileUpload = async (file) => {
    if (!selectedConversation || !currentUser || !socket) {
      alert('Please select a conversation first')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', selectedConversation._id)
      formData.append('senderId', currentUser.userId)

      const response = await fetch('http://localhost:8080/api/chat/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, data.message])
        socket.emit('send-message', {
          conversationId: selectedConversation._id,
          message: data.message
        })
        loadConversations(currentUser.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTyping = () => {
    if (socket && selectedConversation && currentUser) {
      socket.emit('typing', {
        conversationId: selectedConversation._id,
        isTyping: true
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        })
      }, 1000)
    }
  }

  const openImageModal = (src, alt) => {
    setModalImage({ src, alt })
    setShowImageModal(true)
  }

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a')
    link.href = `http://localhost:8080${fileUrl}`
    link.download = fileName || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType, fileName) => {
    if (mimeType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')) {
      return '📄'
    } else if (mimeType?.includes('word') || fileName?.toLowerCase().endsWith('.docx')) {
      return '📝'
    } else if (mimeType?.includes('sheet') || fileName?.toLowerCase().endsWith('.xlsx')) {
      return '📊'
    } else if (mimeType?.startsWith('image/')) {
      return '🖼️'
    }
    return '📎'
  }

  const renderMessage = (message) => {
    const isOwn = message.senderId === currentUser?.userId
    const status = messageStatus[message._id]

    return (
      <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isOwn 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : 'bg-gray-200 text-gray-800 rounded-bl-md'
        }`}>
          {message.messageType === 'image' ? (
            <div>
              <img
                src={`http://localhost:8080${message.fileUrl}`}
                alt="Shared image"
                className="max-w-full h-auto rounded-lg cursor-pointer mb-2"
                onClick={() => openImageModal(`http://localhost:8080${message.fileUrl}`, message.fileName)}
              />
              <div className="flex gap-2 text-xs opacity-75">
                <button onClick={() => openImageModal(`http://localhost:8080${message.fileUrl}`, message.fileName)}>
                  View
                </button>
                <button onClick={() => downloadFile(message.fileUrl, message.fileName)}>
                  Download
                </button>
              </div>
            </div>
          ) : message.messageType === 'document' ? (
            <div className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded">
              <div className="text-lg">{getFileIcon(message.mimeType, message.fileName)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                <p className="text-xs opacity-75">{formatFileSize(message.fileSize)}</p>
              </div>
              <button 
                onClick={() => downloadFile(message.fileUrl, message.fileName)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-75">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className="text-xs opacity-75">
                {status === 'sending' && <Clock className="w-3 h-3" />}
                {status === 'delivered' && <Check className="w-3 h-3" />}
                {status === 'read' && <CheckCheck className="w-3 h-3" />}
                {!status && <Check className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const getConnectionStatus = () => {
    if (isConnecting) return <span className="text-yellow-500">Connecting...</span>
    if (connectionError) return <span className="text-red-500">⚠️ {connectionError}</span>
    if (currentUser && socket?.connected) return <span className="text-green-500">● Online</span>
    return <span className="text-gray-500">○ Offline</span>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/jpg,image/png,.pdf,.doc,.docx"
        onChange={(e) => {
          if (e.target.files[0]) {
            handleFileUpload(e.target.files[0])
          }
        }}
      />

      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Chat</h1>
            {getConnectionStatus()}
          </div>
          
          {currentUser && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Logged in as <span className="font-semibold">{currentUser.userName}</span>
              </p>
            </div>
          )}

          {/* Search/New Chat */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter username to start chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!currentUser}
            />
            <button
              onClick={startNewConversation}
              disabled={!currentUser || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Chat
            </button>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const otherUser = conversation.participants.find(p => p.userId !== currentUser?.userId)
            const isSelected = selectedConversation?._id === conversation._id
            const isOnline = onlineUsers.has(otherUser?.userId)

            return (
              <div
                key={conversation._id}
                onClick={() => selectConversation(conversation)}
                className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {otherUser?.userName?.[0] || '?'}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {otherUser?.userName || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          
          {conversations.length === 0 && !isConnecting && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat above</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {selectedConversation.participants.find(p => p.userId !== currentUser?.userId)?.userName?.[0] || '?'}
                  </div>
                  {onlineUsers.has(selectedConversation.participants.find(p => p.userId !== currentUser?.userId)?.userId) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation.participants.find(p => p.userId !== currentUser?.userId)?.userName || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {onlineUsers.has(selectedConversation.participants.find(p => p.userId !== currentUser?.userId)?.userId) 
                      ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {messages.map(renderMessage)}
              
              {typingUsers.size > 0 && (
                <div className="text-sm text-gray-500 italic">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!currentUser || isUploading}
                  className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
                  title="Attach file"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={!currentUser}
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!currentUser || !newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {currentUser ? 'Select a conversation' : 'Connecting...'}
              </h2>
              <p className="text-gray-500">
                {currentUser 
                  ? 'Choose a conversation from the sidebar to start messaging'
                  : 'Please wait while we connect you to the chat system'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={modalImage.src}
              alt={modalImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white p-3 rounded">
              <p className="text-sm truncate mb-2">{modalImage.alt}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadFile(modalImage.src.replace('http://localhost:8080', ''), modalImage.alt)}
                  className="text-xs bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
                <button
                  onClick={() => window.open(modalImage.src, '_blank')}
                  className="text-xs bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => setShowImageModal(false)}
          />
        </div>
      )}
    </div>
  )
}

export default ChatApp