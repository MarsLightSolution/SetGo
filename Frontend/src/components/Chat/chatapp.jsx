"use client"

import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"

export default function ChatApp() {
  const [currentUser, setCurrentUser] = useState(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState(null)
  const [searchUsername, setSearchUsername] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    handleAutoConnect()
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
      setConnectionError("No user ID found in localStorage. Please login first.")
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
        fetchConversations(data.user.userId)
      } else {
        setConnectionError(data.message)
      }
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionError("Failed to connect to chat server")
    } finally {
      setIsConnecting(false)
    }
  }

  const initializeSocket = (user) => {
    const newSocket = io("http://localhost:8080", { withCredentials: true })

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO")
      newSocket.emit("join-user", user.userId)
    })

    newSocket.on("new-message", (data) => {
      console.log("Received new message:", data)
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some((msg) => msg._id === data.message._id)
          if (messageExists) return prev
          return [...prev, data.message]
        })
      }
      if (user) fetchConversations(user.userId)
    })

    newSocket.on("user-typing", (data) => {
      if (data.userId !== user.userId) {
        setIsTyping(data.isTyping)
        setTypingUser(data.userName)
        if (data.isTyping) {
          setTimeout(() => {
            setIsTyping(false)
            setTypingUser("")
          }, 3000)
        }
      }
    })

    newSocket.on("user-online", (data) => {
      console.log("User came online:", data)
      fetchConversations(user.userId)
    })

    newSocket.on("user-offline", (data) => {
      console.log("User went offline:", data)
      fetchConversations(user.userId)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO")
    })

    setSocket(newSocket)
  }

  const fetchConversations = async (userIdentifier) => {
    if (!userIdentifier) return
    try {
      const response = await fetch(`http://localhost:8080/api/chat/conversations/${userIdentifier}`)
      const data = await response.json()
      if (data.success) setConversations(data.conversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const startConversation = async (targetUsername) => {
    if (!currentUser) return alert("Please wait, connecting to chat...")

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
        setSelectedConversation(data.conversation)
        setMessages([])
        fetchConversations(currentUser.userId)
        if (socket) socket.emit("join-conversation", data.conversation._id)
      } else alert(data.message)
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  const selectConversation = async (conversation) => {
    if (!currentUser) return

    if (selectedConversation && socket) socket.emit("leave-conversation", selectedConversation._id)

    setSelectedConversation(conversation)
    if (socket) socket.emit("join-conversation", conversation._id)

    try {
      const response = await fetch(`http://localhost:8080/api/chat/messages/${conversation._id}`)
      const data = await response.json()
      if (data.success) setMessages(data.messages)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    try {
      const response = await fetch("http://localhost:8080/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderId: currentUser.userId,
          text: newMessage.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Add message to local state immediately
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")

        // Emit through socket for real-time updates to other users
        if (socket) {
          socket.emit("send-message", {
            conversationId: selectedConversation._id,
            message: data.message,
          })
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!selectedConversation || !currentUser) {
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
        // Add message to local state immediately
        setMessages((prev) => [...prev, data.message])

        // Emit through socket for real-time updates to other users
        if (socket) {
          socket.emit("send-message", {
            conversationId: selectedConversation._id,
            message: data.message,
          })
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage()
  }

  const handleTyping = () => {
    if (socket && selectedConversation && currentUser) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        isTyping: true,
        userName: currentUser.userName,
      })
    }
  }

  const startConversationFromExternal = async (targetUsername, productInfo = null) => {
    if (!currentUser) {
      if (isConnecting) return setTimeout(() => startConversationFromExternal(targetUsername, productInfo), 1000)
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
        setSelectedConversation(data.conversation)
        setMessages([])
        fetchConversations(currentUser.userId)
        if (socket) socket.emit("join-conversation", data.conversation._id)

        if (productInfo) {
          setTimeout(() => {
            const productMessage = `Hi! I'm interested in your product: ${productInfo.title} - €${productInfo.price}`
            setNewMessage(productMessage)
          }, 500)
        }
      } else alert(data.message)
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  useEffect(() => {
    window.startChatConversation = startConversationFromExternal
    return () => delete window.startChatConversation
  }, [currentUser, socket])

  // Render message content based on type
  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case "image":
        return (
          <div>
            <img
              src={`http://localhost:8080${message.fileUrl}`}
              alt="Shared image"
              className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer mb-1"
              onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
            />
            <p>{message.text}</p>
          </div>
        )
      case "document":
        return (
          <div
            className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded cursor-pointer"
            onClick={() => window.open(`http://localhost:8080${message.fileUrl}`, "_blank")}
          >
            <span>📄</span>
            <div>
              <p className="text-sm font-medium m-0">{message.fileName}</p>
              <p className="text-xs opacity-70 m-0">{(message.fileSize / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        )
      default:
        return <p>{message.text}</p>
    }
  }

  const getConnectionStatus = () => {
    if (isConnecting) return <div className="text-sm text-gray-500 mb-2">Connecting to chat...</div>
    if (connectionError) return <div className="text-sm text-red-500 mb-2">{connectionError}</div>
    if (currentUser) return <div className="text-sm text-green-600 mb-2">● Connected</div>
    return null
  }

  return (
    <div className="mt-6">
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

      <div className="max-w-6xl mx-auto px-2 flex h-[calc(100vh-160px)] font-sans rounded-lg shadow">
        {/* Sidebar */}
        <div className="w-[320px] border-r border-gray-100 flex flex-col shadow-lg rounded-l-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
            {/* Top Row: Title & Connection */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chat</h2>
              <div>{getConnectionStatus()}</div>
            </div>
            {/* Current User Info */}
            {currentUser && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-4">
                <p className="text-sm text-gray-600">
                  Logged in as <span className="font-semibold text-gray-800">{currentUser.userName}</span>
                </p>
                <p className="text-xs text-gray-400 truncate">{currentUser.userId}</p>
              </div>
            )}
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by email"
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
                Chat
              </button>
            </div>
          </div>
          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto bg-[#fafafa]">
            {conversations.map((conversation) => {
              const otherUser = conversation.participants.find((p) => p.userId !== currentUser?.userId)
              const isSelected = selectedConversation?._id === conversation._id
              return (
                <div
                  key={conversation._id}
                  onClick={() => currentUser && selectConversation(conversation)}
                  className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-all ${
                    isSelected ? "bg-emerald-50 border-l-4 border-emerald-500" : "hover:bg-gray-100"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {otherUser?.userName?.[0] || "?"}
                    </div>
                    {otherUser?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{otherUser?.userName || "Unknown"}</p>
                    <p className="text-xs text-gray-500 truncate">{conversation.lastMessage || "No messages yet"}</p>
                  </div>
                </div>
              )
            })}
            {!isConnecting && conversations.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                {currentUser ? "No conversations yet. Start one!" : "Connecting..."}
              </div>
            )}
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 rounded-r-xl">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 shadow-sm">
                {/* Avatar */}
                <div className="relative w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-700">
                  {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName?.[0] ||
                    "?"}
                  {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                {/* User Info */}
                <div>
                  <h3 className="text-gray-900 font-semibold text-base">
                    {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName ||
                      "Unknown"}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userId ||
                      "Unknown"}
                    {selectedConversation.participants.find((p) => p.userId !== currentUser?.userId)?.isOnline && (
                      <span className="text-emerald-500 text-xs">● Online</span>
                    )}
                  </p>
                </div>
              </div>
              {/* Chat Body */}
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
                        <p className="text-[10px] text-gray-300 mt-1 text-right">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {isTyping && <div className="text-sm text-gray-400 italic">{typingUser || "Someone"} is typing...</div>}
                <div ref={messagesEndRef} />
              </div>
              {/* Chat Input */}
              <div className="bg-white border-t border-gray-200 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!currentUser || isUploading}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-50"
                    title="Upload file"
                  >
                    {isUploading ? "📤" : "📎"}
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={handleTyping}
                    placeholder={currentUser ? "Type a message..." : "Connecting..."}
                    disabled={!currentUser}
                    className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentUser}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-600">
              <h2 className="text-lg font-semibold mb-2">
                {currentUser ? "No Conversation Selected" : "Connecting to chat..."}
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                {currentUser
                  ? "Please select a conversation from the sidebar or start a new one using the search above."
                  : "Hang tight! We're connecting you to the chat server."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
