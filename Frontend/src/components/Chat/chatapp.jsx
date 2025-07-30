"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import io from "socket.io-client"
import { chatNotifications } from "../../Notification/notification"

// i18n import
import { useTranslation } from 'react-i18next';

export default function ChatApp() {
  const { t } = useTranslation(); // Initialize useTranslation hook

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

  // Track window focus for notifications
  useEffect(() => {
    const handleFocus = () => {
      setIsWindowFocused(true)
      // Mark messages as read when window is focused
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

    // Cleanup on unmount
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
      setConnectionError(t("chatApp.noUserIdFound")) // Translated
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
      setConnectionError(t("chatApp.failedToConnect")) // Translated
    } finally {
      setIsConnecting(false)
    }
  }

  const initializeSocket = useCallback(
    (user) => {
      // Disconnect existing socket
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
          // Server disconnected, try to reconnect
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

        // Refresh conversations to update online status
        if (user) {
          fetchConversations(user.userId)
        }
      })

      // Message events
      newSocket.on("new-message", (data) => {
        console.log("Received new message:", data)
        const { conversationId, message } = data

        // Check if message is from another user
        const isFromOtherUser = message.senderId !== user.userId

        if (selectedConversation && conversationId === selectedConversation._id) {
          // Message for current conversation
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const messageExists = prev.some((msg) => msg._id === message._id)
            if (messageExists) return prev

            const newMessages = [...prev, message]

            // Mark as read if window is focused and from other user
            if (isWindowFocused && isFromOtherUser) {
              setTimeout(() => markMessagesAsRead([message._id]), 100)
            }

            return newMessages
          })

          // Show notification if window not focused and from other user
          if (!isWindowFocused && isFromOtherUser) {
            const senderName = message.senderName || "Someone"
            chatNotifications.showMessageNotification(senderName, message.text, message.messageType, conversationId)
          }
        } else if (isFromOtherUser) {
          // Message for different conversation - update unread count
          setUnreadCounts((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || 0) + 1,
          }))

          // Show notification
          const senderName = message.senderName || "Someone"
          chatNotifications.showMessageNotification(senderName, message.text, message.messageType, conversationId)
        }

        // Refresh conversations to update last message
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

          // Auto-remove typing indicator after 3 seconds
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
    if (!currentUser) return alert(t("chatApp.connectingToChatWait")) // Translated

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

    // Leave previous conversation
    if (selectedConversation) {
      socket.emit("leave-conversation", selectedConversation._id)
    }

    // Set new conversation
    setSelectedConversation(conversation)
    setMessages([])
    setTypingUsers(new Set())

    // Join new conversation
    socket.emit("join-conversation", conversation._id)

    // Clear unread count
    setUnreadCounts((prev) => ({
      ...prev,
      [conversation._id]: 0,
    }))

    // Fetch messages
    try {
      const response = await fetch(`http://localhost:8080/api/chat/messages/${conversation._id}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)

        // Mark messages as read
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
      // Send to server first
      const response = await fetch("http://localhost:8080/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderId: currentUser.userId,
          text: messageText,
        }),
      })

      const data = await response.json()
      if (data.success) {
        const message = data.message

        // Add message to local state immediately
        setMessages((prev) => [...prev, message])

        // Set delivery status
        setMessageDeliveryStatus((prev) => ({
          ...prev,
          [message._id]: "sending",
        }))

        // Emit through socket for real-time updates to other users
        socket.emit("send-message", {
          conversationId: selectedConversation._id,
          message: message,
        })

        // Update conversations
        fetchConversations(currentUser.userId)
      } else {
        alert("Failed to send message: " + data.message)
        setNewMessage(messageText) // Restore message on failure
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
      setNewMessage(messageText) // Restore message on failure
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

        // Add message to local state immediately
        setMessages((prev) => [...prev, message])

        // Emit through socket for real-time updates to other users
        socket.emit("send-message", {
          conversationId: selectedConversation._id,
          message: message,
        })

        // Update conversations
        fetchConversations(currentUser.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert(t("chatApp.failedToUploadFile")) // Translated
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

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          conversationId: selectedConversation._id,
          isTyping: false,
        })
      }, 1000)
    }
  }

  const startConversationFromExternal = async (targetUsername, productInfo = null) => {
    if (!currentUser) {
      if (isConnecting) {
        return setTimeout(() => startConversationFromExternal(targetUsername, productInfo), 1000)
      }
      return alert("Please wait, connecting to chat...")
    }

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

        if (productInfo) {
          setTimeout(() => {
            const productMessage = t("chatApp.productOfInterest", { title: productInfo.title, price: productInfo.price }) // Translated product message
            setNewMessage(productMessage)
          }, 500)
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  useEffect(() => {
    window.startChatConversation = startConversationFromExternal
    window.focusConversation = (conversationId) => {
      const conversation = conversations.find((c) => c._id === conversationId)
      if (conversation) {
        selectConversation(conversation)
      }
    }

    return () => {
      delete window.startChatConversation
      delete window.focusConversation
    }
  }, [currentUser, socket, conversations])

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      await chatNotifications.requestPermission()
      setNotificationsEnabled(chatNotifications.isEnabled())
    } else {
      alert("To disable notifications, please use your browser settings.")
    }
  }

  const renderMessageContent = (message) => {
    const deliveryStatus = messageDeliveryStatus[message._id]
    const isOwn = message.senderId === currentUser?.userId

    return (
      <div>
        {message.messageType === "image" ? (
          <div>
            <img
              src={`http://localhost:8080${message.fileUrl}`}
              alt={t("chatApp.sharedImageAlt")} // Translated
              className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer mb-1"
              onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
            />
            <p>{message.text}</p>
          </div>
        ) : message.messageType === "document" ? (
          <div
            className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded cursor-pointer"
            onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
          >
            <span>📄</span>
            <div>
              <p className="text-sm font-medium m-0">{message.fileName}</p>
              <p className="text-xs opacity-70 m-0">{t("chatApp.fileSize", { size: (message.fileSize / 1024).toFixed(1) })}</p> {/* Translated */}
            </div>
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
    if (isConnecting) return <div className="text-sm text-gray-500 mb-2">Connecting...</div>
    if (connectionError) return <div className="text-sm text-red-500 mb-2">{connectionError}</div>
    if (currentUser && socket?.connected) return <div className="text-sm text-green-600 mb-2">● Connected</div>
    return <div className="text-sm text-yellow-600 mb-2">● Reconnecting...</div>
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

      <div className="max-w-6xl mx-auto px-2 flex h-[calc(100vh-160px)] font-sans rounded-lg shadow">
        {/* Sidebar */}
        <div className="w-[320px] border-r border-gray-100 flex flex-col shadow-lg rounded-l-xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chat</h2>
              <div className="flex items-center gap-2">
                {getConnectionStatus()}
                <button
                  onClick={toggleNotifications}
                  className={`p-1 rounded text-xs ${
                    notificationsEnabled ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"
                  }`}
                  title={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
                >
                  {notificationsEnabled ? "🔔" : "🔕"}
                </button>
              </div>
            </div>

            {currentUser && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-4">
                <p className="text-sm text-gray-600">
                  {t("chatApp.loggedInAs")}{" "}
                  <span className="font-semibold text-gray-800">{currentUser.userName}</span>
                </p>
                <p className="text-xs text-gray-400 truncate">{currentUser.userId}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t("chatApp.searchByEmailPlaceholder")}
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                disabled={!currentUser}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
              />
              <button
                disabled={!currentUser}
                onClick={() => {
                  if (searchUsername.trim() && currentUser) {
                    startConversation(searchUsername.trim())
                    setSearchUsername("")
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50"
              >
                {t("chatApp.chatButton")} {/* Translated */}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#fafafa]">
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
                    isSelected ? "bg-emerald-50 border-l-4 border-emerald-500" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {otherUser?.userName?.[0] || "?"}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{otherUser?.userName || t("chatApp.unknownUser")}</p> {/* Translated Unknown */}
                    <p className="text-xs text-gray-500 truncate">{conversation.lastMessage || t("chatApp.noMessagesYet")}</p> {/* Translated No messages yet */}
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
                {currentUser ? t("chatApp.noConversationsYet") : t("chatApp.connecting")} {/* Translated */}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 rounded-r-xl">
          {selectedConversation ? (
            <>
              <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 shadow-sm">
                <div className="relative w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-700">
                  {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName?.[0] ||
                    "?"}
                  {onlineUsers.has(
                    selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId,
                  ) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-base">
                    {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName ||
                      t("chatApp.unknownUser")}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    {onlineUsers.has(
                      selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId,
                    ) ? (
                      <span className="text-emerald-500 text-xs">● Online</span>
                    ) : (
                      <span className="text-gray-400 text-xs">● Offline</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === currentUser?.userId
                  return (
                    <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end`}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 mr-2">
                          {selectedConversation.participants.find((p) => p.userId === message.senderId)
                            ?.userName?.[0] || "?"}
                        </div>
                      )}
                      <div
                        className={`max-w-xs sm:max-w-sm p-3 rounded-2xl text-sm shadow ${
                          isOwn
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                        }`}
                      >
                        {renderMessageContent(message)}
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

              <div className="bg-white border-t border-gray-200 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!currentUser || isUploading}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-50"
                    title={t("chatApp.uploadFileTitle")} // Translated
                  >
                    {isUploading ? "📤" : "📎"}
                  </button>
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
                    className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 resize-none"
                    style={{ minHeight: "42px", maxHeight: "120px" }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentUser || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-50"
                  >
                    {t("chatApp.sendButton")} {/* Translated */}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-600">
              <h2 className="text-lg font-semibold mb-2">
                {currentUser ? t("chatApp.noConversationSelectedTitle") : t("chatApp.connectingToChatTitle")} {/* Translated */}
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                {currentUser
                  ? t("chatApp.noConversationSelectedInstructions") // Translated
                  : t("chatApp.connectingInstructions")} {/* Translated */}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}