"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import io from "socket.io-client"
import { chatNotifications } from "../../Notification/notification"
import { useTranslation } from 'react-i18next'
import { getCurrentUser, chatApi } from "../../utils/auth"

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
  
  // Modern features
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Refs
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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
    try {
      setIsConnecting(true)
      
      // Get current user from cookies/storage
      const user = getCurrentUser()
      if (!user) {
        setConnectionError("Please login to use chat")
        setIsConnecting(false)
        return
      }

      // Connect to chat
      const response = await chatApi.connect(user.userName || user.email)
      if (response.success) {
        setCurrentUser(response.user)
        setConnectionError(null)
        initializeSocket(response.user)
        await fetchConversations(response.user.userId)
      } else {
        setConnectionError(response.message)
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionError("Failed to connect to chat")
    } finally {
      setIsConnecting(false)
    }
  }

  const initializeSocket = useCallback((user) => {
    if (socket) {
      socket.disconnect()
    }

    // Get access token from cookies
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const accessToken = getCookie('accessToken');
    if (!accessToken) {
      setConnectionError("Authentication required")
      return
    }

    const newSocket = io("http://localhost:8080", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      auth: {
        token: accessToken
      }
    })

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

    newSocket.on("new-message", (data) => {
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

    setSocket(newSocket)
  }, [selectedConversation, isWindowFocused])

  const fetchConversations = async (userIdentifier) => {
    if (!userIdentifier) return
    try {
      const response = await chatApi.getConversations(userIdentifier)
      if (response.success) {
        setConversations(response.conversations)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const startConversation = async (targetUsername) => {
    if (!currentUser) return alert("Please wait, connecting to chat...")

    try {
      const response = await chatApi.createConversation([currentUser.userId, targetUsername])
      if (response.success) {
        await selectConversation(response.conversation)
        await fetchConversations(currentUser.userId)
      } else {
        alert(response.message)
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

    socket.emit("join-conversation", conversation._id)

    setUnreadCounts((prev) => ({
      ...prev,
      [conversation._id]: 0,
    }))

    try {
      const response = await chatApi.getMessages(conversation._id)
      if (response.success) {
        setMessages(response.messages)

        setTimeout(() => {
          const unreadMessages = response.messages
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
      const response = await chatApi.sendMessage({
        conversationId: selectedConversation._id,
        text: messageText,
        replyTo: replyToMessage?._id,
      })

      if (response.success) {
        const message = response.message

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
        alert("Failed to send message: " + response.message)
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

      const response = await chatApi.uploadFile(formData)
      if (response.success) {
        const message = response.message

        setMessages((prev) => [...prev, message])

        socket.emit("send-message", {
          conversationId: selectedConversation._id,
          message: message,
        })

        fetchConversations(currentUser.userId)
      } else {
        alert(response.message)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file")
    } finally {
      setIsUploading(false)
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

  const renderMessageContent = (message) => {
    const deliveryStatus = messageDeliveryStatus[message._id]
    const isOwn = message.senderId === currentUser?.userId

    return (
      <div className="relative">
        {message.replyTo && (
          <div className={`mb-2 p-2 rounded-lg text-xs ${
            isOwn ? 'bg-blue-400 bg-opacity-30' : 'bg-gray-100'
          }`}>
            <p className="font-medium">Replying to message</p>
            <p className="truncate">{message.replyTo.text}</p>
          </div>
        )}
        
        {message.messageType === "image" ? (
          <div>
            <img
              src={`http://localhost:8080${message.fileUrl}`}
              alt="Shared image"
              className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer hover:opacity-80 transition"
              onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
            />
            {message.text && <p className="mt-2">{message.text}</p>}
          </div>
        ) : message.messageType === "document" ? (
          <div
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
          >
            <span className="text-2xl">📄</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.fileName}</p>
              <p className="text-xs text-gray-500">{(message.fileSize / 1024).toFixed(1)} KB</p>
            </div>
            <span className="text-gray-400">⬇️</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {isOwn && (
            <span className="text-[10px] opacity-70">
              {deliveryStatus === "sending" && "⏳"}
              {deliveryStatus === "delivered" && "✓"}
              {deliveryStatus === "read" && "✓✓"}
              {!deliveryStatus && "✓"}
            </span>
          )}
        </div>
      </div>
    )
  }

  const getConnectionStatus = () => {
    if (isConnecting) return <div className="text-sm text-green-200">Connecting...</div>
    if (connectionError) return <div className="text-sm text-red-200">{connectionError}</div>
    if (currentUser && socket?.connected) return <div className="text-sm text-green-200">● Connected</div>
    return <div className="text-sm text-yellow-200">● Reconnecting...</div>
  }

  const typingText = Array.from(typingUsers).join(", ")

  return (
    <div className="h-screen bg-gradient-to-br from-green-400 to-blue-500 flex">
      {/* Hidden file input */}
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

      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold tracking-tight">💬 Modern Chat</h1>
            <div className="flex items-center gap-2">
              {getConnectionStatus()}
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-full transition ${
                  notificationsEnabled ? "text-green-200 hover:bg-green-400" : "text-gray-200 hover:bg-green-400"
                }`}
              >
                {notificationsEnabled ? "🔔" : "🔕"}
              </button>
            </div>
          </div>

          {currentUser && (
            <div className="bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {currentUser.userName?.[0] || "U"}
                </div>
                <div>
                  <p className="font-semibold text-white">{currentUser.userName}</p>
                  <p className="text-xs text-green-100 truncate">{currentUser.userId}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search or start new chat..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                disabled={!currentUser}
                className="w-full pl-10 pr-4 py-3 border border-white border-opacity-30 rounded-xl text-sm bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-green-100 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-100">🔍</span>
            </div>
            <button
              disabled={!currentUser}
              onClick={() => {
                if (searchUsername.trim() && currentUser) {
                  startConversation(searchUsername.trim())
                  setSearchUsername("")
                }
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 rounded-xl text-sm font-medium transition disabled:opacity-50 border border-white border-opacity-30"
            >
              Chat
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {conversations.map((conversation) => {
            const otherUser = conversation.participants.find((p) => p.userId !== currentUser?.userId)
            const isSelected = selectedConversation?._id === conversation._id
            const unreadCount = unreadCounts[conversation._id] || 0
            const isOnline = onlineUsers.has(otherUser?.userId)

            return (
              <div
                key={conversation._id}
                onClick={() => currentUser && selectConversation(conversation)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all relative ${
                  isSelected ? "bg-green-50 border-l-4 border-green-500" : "hover:bg-gray-100"
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold">
                    {otherUser?.userName?.[0] || "?"}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {otherUser?.userName || "Unknown User"}
                    </p>
                    {conversation.lastMessageTime && (
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
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
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold">
                    {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName?.[0] || "?"}
                  </div>
                  {onlineUsers.has(
                    selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId,
                  ) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">
                    {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {onlineUsers.has(
                      selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId,
                    ) ? (
                      <span className="text-green-500">● Online</span>
                    ) : (
                      <span className="text-gray-400">● Offline</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-gray-100 transition">📞</button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition">📹</button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition">⋮</button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
                        className={`max-w-xs sm:max-w-sm p-3 rounded-2xl text-sm shadow-sm ${
                          isOwn
                            ? "bg-green-500 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                        }`}
                      >
                        {renderMessageContent(message)}
                      </div>
                      
                      {/* Message Actions */}
                      <div className={`absolute top-0 ${isOwn ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                        <button
                          onClick={() => setReplyToMessage(message)}
                          className="p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
                        >
                          ↩️
                        </button>
                        <button
                          onClick={() => {/* Handle forward */}}
                          className="p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
                        >
                          ↪️
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => {/* Handle delete */}}
                            className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            🗑️
                          </button>
                        )}
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

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="px-6 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Replying to message</p>
                    <p className="text-sm text-gray-700 truncate">{replyToMessage.text}</p>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="p-1 rounded-full hover:bg-gray-200 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                  >
                    📎
                  </button>
                  
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click()
                          setShowAttachmentMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        📷 Photo
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click()
                          setShowAttachmentMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        📄 Document
                      </button>
                      <button
                        onClick={() => setShowAttachmentMenu(false)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        🎤 Audio
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={currentUser ? "Type a message..." : "Connecting..."}
                    disabled={!currentUser}
                    rows={1}
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 resize-none"
                    style={{ minHeight: "42px", maxHeight: "120px" }}
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition"
                  >
                    😊
                  </button>
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!currentUser || !newMessage.trim()}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition disabled:opacity-50"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-600">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              💬
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {currentUser ? "Select a conversation" : "Connecting to chat..."}
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              {currentUser
                ? "Choose a conversation from the list to start messaging"
                : "Please wait while we connect you to the chat system"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}