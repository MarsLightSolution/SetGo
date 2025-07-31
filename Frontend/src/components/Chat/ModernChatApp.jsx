"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import io from "socket.io-client"
import { chatNotifications } from "../../Notification/notification"
import { useTranslation } from 'react-i18next'
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  MoreVertical, 
  Search, 
  Phone, 
  Video, 
  Image, 
  File, 
  Download,
  Check,
  CheckCheck,
  Clock,
  Reply,
  Trash2,
  Edit,
  Copy,
  Heart,
  ThumbsUp,
  MessageCircle
} from 'lucide-react'
import EmojiPicker from './EmojiPicker'

export default function ModernChatApp() {
  const { t } = useTranslation()

  // State management
  const [currentUser, setCurrentUser] = useState(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState(null)
  const [searchUsername, setSearchUsername] = useState("")
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isUploading, setIsUploading] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState({})
  
  // New modern features
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [messageReactions, setMessageReactions] = useState({})
  const [showMessageMenu, setShowMessageMenu] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMessages, setFilteredMessages] = useState([])
  const [showVoiceMessage, setShowVoiceMessage] = useState(false)
  const [voiceMessageBlob, setVoiceMessageBlob] = useState(null)

  // Refs
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const messageInputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Track window focus for notifications
  useEffect(() => {
    const handleFocus = () => {
      setIsWindowFocused(true)
      if (selectedConversation && messages.length > 0) {
        markMessagesAsRead()
      }
    }
    const handleBlur = () => setIsWindowFocused(false)

    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [selectedConversation, messages])

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
      await chatNotifications.init()
      setNotificationsEnabled(chatNotifications.isEnabled())
    }
    initNotifications()
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    handleAutoConnect()

    return () => {
      if (socket) {
        socket.disconnect()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const handleAutoConnect = async () => {
    const storedUserId =
      localStorage.getItem("userId") || localStorage.getItem("userName") || localStorage.getItem("userEmail")

    let userFromStorage = null
    try {
      const userData = localStorage.getItem("userData")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        userFromStorage = parsedUser.email || parsedUser.username || parsedUser._id
      }
    } catch (e) {
      console.error("Error parsing userData:", e)
    }

    const userIdentifier = storedUserId || userFromStorage

    if (!userIdentifier) {
      setConnectionError(t("chatApp.noUserIdFound"))
      setIsConnecting(false)
      return
    }

    try {
      setIsConnecting(true)
      const response = await fetch("http://localhost:8080/api/chat/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userIdentifier.trim() }),
      })

      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
        setConnectionError(null)
        initializeSocket(data.user)
        await fetchConversations(data.user.userId)
      } else {
        setConnectionError(data.message)
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionError(t("chatApp.failedToConnect"))
    } finally {
      setIsConnecting(false)
    }
  }

  const initializeSocket = useCallback(
    (user) => {
      if (socket) {
        socket.disconnect()
      }

      const newSocket = io("http://localhost:8080", {
        withCredentials: true,
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      })

      // Connection events
      newSocket.on("connect", () => {
        console.log("Connected to Socket.IO")
        newSocket.emit("join-user", user.userId)
      })

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO:", reason)
        if (reason === "io server disconnect") {
          reconnectTimeoutRef.current = setTimeout(() => {
            newSocket.connect()
          }, 1000)
        }
      })

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        setConnectionError("Connection lost. Trying to reconnect...")
      })

      // User events
      newSocket.on("user-joined", (data) => {
        if (data.success) {
          console.log("Successfully joined as user:", data.userId)
          setConnectionError(null)
        } else {
          setConnectionError(data.message)
        }
      })

      newSocket.on("user-status-changed", (data) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          if (data.isOnline) {
            newSet.add(data.userId)
          } else {
            newSet.delete(data.userId)
          }
          return newSet
        })

        if (user) {
          fetchConversations(user.userId)
        }
      })

      // Message events
      newSocket.on("new-message", (data) => {
        console.log("Received new message:", data)
        const { conversationId, message } = data

        const isFromOtherUser = message.senderId !== user.userId

        if (selectedConversation && conversationId === selectedConversation._id) {
          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg._id === message._id)
            if (messageExists) return prev

            const newMessages = [...prev, message]

            if (isWindowFocused && isFromOtherUser) {
              setTimeout(() => markMessagesAsRead([message._id]), 100)
            }

            return newMessages
          })

          if (!isWindowFocused && isFromOtherUser) {
            const senderName = message.senderName || "Someone"
            chatNotifications.showMessageNotification(senderName, message.text, message.messageType, conversationId)
          }
        } else if (isFromOtherUser) {
          setUnreadCounts((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || 0) + 1,
          }))

          const senderName = message.senderName || "Someone"
          chatNotifications.showMessageNotification(senderName, message.text, message.messageType, conversationId)
        }

        if (user) {
          fetchConversations(user.userId)
        }
      })

      newSocket.on("message-delivered", (data) => {
        setMessageDeliveryStatus((prev) => ({
          ...prev,
          [data.messageId]: "delivered",
        }))
      })

      newSocket.on("messages-read", (data) => {
        const { messageIds } = data
        setMessageDeliveryStatus((prev) => {
          const updated = { ...prev }
          messageIds.forEach((id) => {
            updated[id] = "read"
          })
          return updated
        })
      })

      newSocket.on("message-error", (data) => {
        console.error("Message error:", data.error)
        alert("Failed to send message: " + data.error)
      })

      // Typing events
      newSocket.on("user-typing", (data) => {
        if (data.userId !== user.userId && data.conversationId === selectedConversation?._id) {
          setTypingUsers((prev) => {
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
              setTypingUsers((prev) => {
                const newSet = new Set(prev)
                newSet.delete(data.userName)
                return newSet
              })
            }, 3000)
          }
        }
      })

      // Conversation events
      newSocket.on("conversation-joined", (data) => {
        if (data.success) {
          console.log("Successfully joined conversation:", data.conversationId)
        } else {
          console.error("Failed to join conversation:", data.error)
        }
      })

      newSocket.on("user-joined-conversation", (data) => {
        console.log("User joined conversation:", data)
      })

      newSocket.on("user-left-conversation", (data) => {
        console.log("User left conversation:", data)
      })

      setSocket(newSocket)
    },
    [selectedConversation, isWindowFocused],
  )

  const fetchConversations = async (userIdentifier) => {
    if (!userIdentifier) return
    try {
      const response = await fetch(`http://localhost:8080/api/chat/conversations/${userIdentifier}`)
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const startConversation = async (targetUsername) => {
    if (!currentUser) return alert(t("chatApp.connectingToChatWait"))

    try {
      const response = await fetch("http://localhost:8080/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: [currentUser.userId, targetUsername],
        }),
      })

      const data = await response.json()
      if (data.success) {
        await selectConversation(data.conversation)
        await fetchConversations(currentUser.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  const selectConversation = async (conversation) => {
    if (!currentUser || !socket) return

    if (selectedConversation) {
      socket.emit("leave-conversation", selectedConversation._id)
    }

    setSelectedConversation(conversation)
    setMessages([])
    setTypingUsers(new Set())
    setReplyToMessage(null)
    setShowMessageMenu(null)

    socket.emit("join-conversation", conversation._id)

    setUnreadCounts((prev) => ({
      ...prev,
      [conversation._id]: 0,
    }))

    try {
      const response = await fetch(`http://localhost:8080/api/chat/messages/${conversation._id}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)

        setTimeout(() => {
          const unreadMessages = data.messages
            .filter((msg) => msg.senderId !== currentUser.userId && !msg.isRead)
            .map((msg) => msg._id)

          if (unreadMessages.length > 0) {
            markMessagesAsRead(unreadMessages)
          }
        }, 500)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const markMessagesAsRead = (messageIds = null) => {
    if (!socket || !selectedConversation || !currentUser) return

    const messagesToMark =
      messageIds || messages.filter((msg) => msg.senderId !== currentUser.userId && !msg.isRead).map((msg) => msg._id)

    if (messagesToMark.length > 0) {
      socket.emit("mark-messages-read", {
        conversationId: selectedConversation._id,
        messageIds: messagesToMark,
      })
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser || !socket) return

    const messageText = newMessage.trim()
    setNewMessage("")

    try {
      const response = await fetch("http://localhost:8080/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderId: currentUser.userId,
          text: messageText,
          replyTo: replyToMessage?._id,
        }),
      })

      const data = await response.json()
      if (data.success) {
        const message = data.message

        setMessages((prev) => [...prev, message])

        setMessageDeliveryStatus((prev) => ({
          ...prev,
          [message._id]: "sending",
        }))

        socket.emit("send-message", {
          conversationId: selectedConversation._id,
          message: message,
        })

        fetchConversations(currentUser.userId)
        setReplyToMessage(null)
      } else {
        alert("Failed to send message: " + data.message)
        setNewMessage(messageText)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
      setNewMessage(messageText)
    }
  }

  const handleFileUpload = async (file) => {
    if (!selectedConversation || !currentUser || !socket) {
      alert("Please select a conversation first")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", selectedConversation._id)
      formData.append("senderId", currentUser.userId)

      const response = await fetch("http://localhost:8080/api/chat/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        const message = data.message

        setMessages((prev) => [...prev, message])

        socket.emit("send-message", {
          conversationId: selectedConversation._id,
          message: message,
        })

        fetchConversations(currentUser.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert(t("chatApp.failedToUploadFile"))
    } finally {
      setIsUploading(false)
    }
  }

  // Voice message functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setVoiceMessageBlob(blob)
        setShowVoiceMessage(true)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }

  const sendVoiceMessage = async () => {
    if (!voiceMessageBlob || !selectedConversation || !currentUser) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("audio", voiceMessageBlob, "voice-message.webm")
      formData.append("conversationId", selectedConversation._id)
      formData.append("senderId", currentUser.userId)

      const response = await fetch("http://localhost:8080/api/chat/upload-voice", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        const message = data.message
        setMessages((prev) => [...prev, message])
        socket.emit("send-message", {
          conversationId: selectedConversation._id,
          message: message,
        })
        fetchConversations(currentUser.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error sending voice message:", error)
      alert("Failed to send voice message")
    } finally {
      setIsUploading(false)
      setShowVoiceMessage(false)
      setVoiceMessageBlob(null)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTyping = () => {
    if (socket && selectedConversation && currentUser) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        isTyping: true,
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          conversationId: selectedConversation._id,
          isTyping: false,
        })
      }, 1000)
    }
  }

  const handleReaction = (messageId, reaction) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), { user: currentUser.userId, reaction }]
    }))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getConnectionStatus = () => {
    if (isConnecting) return <div className="text-sm text-gray-500 mb-2">Connecting...</div>
    if (connectionError) return <div className="text-sm text-red-500 mb-2">{connectionError}</div>
    if (currentUser && socket?.connected) return <div className="text-sm text-green-600 mb-2">● Connected</div>
    return <div className="text-sm text-yellow-600 mb-2">● Reconnecting...</div>
  }

  const renderMessageContent = (message) => {
    const deliveryStatus = messageDeliveryStatus[message._id]
    const isOwn = message.senderId === currentUser?.userId
    const reactions = messageReactions[message._id] || []

    return (
      <div className="relative group">
        {replyToMessage && message.replyTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500">
            <p className="text-xs text-gray-600">Replying to {message.replyTo.senderName}</p>
            <p className="text-sm">{message.replyTo.text}</p>
          </div>
        )}
        
        {message.messageType === "image" ? (
          <div>
            <img
              src={`http://localhost:8080${message.fileUrl}`}
              alt="Shared image"
              className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer mb-1"
              onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
            />
            <p>{message.text}</p>
          </div>
        ) : message.messageType === "audio" ? (
          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
            <button className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
              ▶️
            </button>
            <div className="flex-1">
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">0:30 / 1:45</p>
            </div>
          </div>
        ) : message.messageType === "document" ? (
          <div
            className="flex items-center gap-2 p-2 bg-gray-100 rounded cursor-pointer"
            onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
          >
            <File className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{message.fileName}</p>
              <p className="text-xs opacity-70">{(message.fileSize / 1024).toFixed(1)} KB</p>
            </div>
            <Download className="w-4 h-4 text-gray-500" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}

        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {isOwn && (
            <span className="text-[10px] opacity-70">
              {deliveryStatus === "sending" && <Clock className="w-3 h-3" />}
              {deliveryStatus === "delivered" && <Check className="w-3 h-3" />}
              {deliveryStatus === "read" && <CheckCheck className="w-3 h-3 text-blue-500" />}
              {!deliveryStatus && <Check className="w-3 h-3" />}
            </span>
          )}
        </div>

        {reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {reactions.map((r, i) => (
              <span key={i} className="text-xs bg-gray-200 px-1 rounded">
                {r.reaction}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const typingText = Array.from(typingUsers).join(", ")

  return (
    <div className="mt-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        onChange={(e) => {
          if (e.target.files[0]) {
            handleFileUpload(e.target.files[0])
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-2 flex h-[calc(100vh-160px)] font-sans rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* Sidebar */}
        <div className="w-[380px] border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Chats</h2>
              <div className="flex items-center gap-2">
                {getConnectionStatus()}
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`p-2 rounded-full transition ${
                    notificationsEnabled ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
                  }`}
                >
                  {notificationsEnabled ? "🔔" : "🔕"}
                </button>
              </div>
            </div>

            {currentUser && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm text-gray-700">
                  Logged in as{" "}
                  <span className="font-semibold text-gray-800">{currentUser.userName}</span>
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser.userId}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search or start new chat..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  disabled={!currentUser}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                />
              </div>
              <button
                disabled={!currentUser}
                onClick={() => {
                  if (searchUsername.trim() && currentUser) {
                    startConversation(searchUsername.trim())
                    setSearchUsername("")
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                Chat
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const otherUser = conversation.participants.find((p) => p.userId !== currentUser?.userId)
              const isSelected = selectedConversation?._id === conversation._id
              const unreadCount = unreadCounts[conversation._id] || 0
              const isOnline = onlineUsers.has(otherUser?.userId)

              return (
                <div
                  key={conversation._id}
                  onClick={() => currentUser && selectConversation(conversation)}
                  className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-all relative ${
                    isSelected ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {otherUser?.userName?.[0] || "?"}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{otherUser?.userName || "Unknown User"}</p>
                    <p className="text-xs text-gray-500 truncate">{conversation.lastMessage || "No messages yet"}</p>
                  </div>
                  {unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </div>
              )
            })}
            {!isConnecting && conversations.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                {currentUser ? "No conversations yet" : "Connecting..."}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full flex items-center justify-center text-base font-semibold">
                      {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName?.[0] || "?"}
                    </div>
                    {onlineUsers.has(
                      selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId,
                    ) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-lg">
                      {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName || "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {onlineUsers.has(
                        selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId,
                      ) ? (
                        <span className="text-green-500 text-xs">● Online</span>
                      ) : (
                        <span className="text-gray-400 text-xs">● Offline</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Search className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
                {messages.map((message) => {
                  const isOwn = message.senderId === currentUser?.userId
                  return (
                    <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end group`}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 mr-2">
                          {selectedConversation.participants.find((p) => p.userId === message.senderId)?.userName?.[0] || "?"}
                        </div>
                      )}
                      <div className="relative">
                        <div
                          className={`max-w-xs sm:max-w-sm p-4 rounded-2xl text-sm shadow-sm ${
                            isOwn
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                          }`}
                        >
                          {renderMessageContent(message)}
                        </div>
                        
                        {/* Message actions */}
                        <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleReaction(message._id, '❤️')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              ❤️
                            </button>
                            <button 
                              onClick={() => setReplyToMessage(message)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {typingUsers.size > 0 && (
                  <div className="text-sm text-gray-400 italic">
                    {typingText} {typingUsers.size === 1 ? "is" : "are"} typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply preview */}
              {replyToMessage && (
                <div className="px-6 py-2 bg-gray-100 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Replying to {replyToMessage.senderName}</p>
                      <p className="text-sm text-gray-800 truncate">{replyToMessage.text}</p>
                    </div>
                    <button 
                      onClick={() => setReplyToMessage(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!currentUser || isUploading}
                    className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                      title="Emoji"
                    >
                      <Smile className="w-5 h-5 text-gray-600" />
                    </button>
                    <EmojiPicker
                      isVisible={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      onEmojiSelect={(emoji) => {
                        setNewMessage(prev => prev + emoji)
                        messageInputRef.current?.focus()
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 relative">
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
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 resize-none"
                      style={{ minHeight: "44px", maxHeight: "120px" }}
                    />
                  </div>
                  
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                    >
                      <div className="w-5 h-5 bg-white rounded-full animate-pulse"></div>
                    </button>
                  ) : (
                    <button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      disabled={!currentUser}
                      className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                      title="Hold to record voice message"
                    >
                      <Mic className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentUser || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {isRecording && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-red-500">Recording... {formatTime(recordingTime)}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-600">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {currentUser ? "Select a conversation" : "Connecting to chat..."}
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                {currentUser
                  ? "Choose a conversation from the sidebar to start messaging"
                  : "Please wait while we connect you to the chat system"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voice message preview modal */}
      {showVoiceMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Voice Message</h3>
            <div className="mb-4">
              <audio controls className="w-full">
                <source src={URL.createObjectURL(voiceMessageBlob)} type="audio/webm" />
              </audio>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowVoiceMessage(false)
                  setVoiceMessageBlob(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendVoiceMessage}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isUploading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}