"use client"
import { useState, useRef, useEffect } from "react"
import io from "socket.io-client"
import { useLocation } from "react-router-dom"
import { FaCamera } from "react-icons/fa"

export default function ChatApp() {
  const [currentUser, setCurrentUser] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [connectionUsername, setConnectionUsername] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [apiStatus, setApiStatus] = useState("checking")
  const location = useLocation()
  const focusedConversationId = location.state?.conversationId
  const focusedReceiver = location.state?.receiverUsername
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const API_BASE = `${import.meta.env.VITE_SERVER}/api/chat`
  const SOCKET_URL = `${import.meta.env.VITE_SOCKET}`

  const socketRef = useRef(null)

  // Auto-focus conversation after currentUser and conversations are ready
  useEffect(() => {
    if (!currentUser || conversations.length === 0) return

    if (focusedConversationId) {
      const targetConversation = conversations.find((c) => c._id === focusedConversationId)

      if (targetConversation) {
        setActiveConversation(targetConversation)

        // Wait for messages to load, then join socket
        loadMessages(targetConversation._id).then(() => {
          if (socketRef.current) {
            socketRef.current.emit("joinConversation", targetConversation._id)
          }
        })
      }
    }
  }, [currentUser, conversations, focusedConversationId])

  // Socket setup
  useEffect(() => {
    if (isConnected && currentUser) {
      socketRef.current = io(SOCKET_URL, { withCredentials: true })

      socketRef.current.on("newMessage", (msg) => {
        if (msg.conversationId === activeConversation?._id) {
          setMessages((prev) => [
            ...prev,
            {
              id: msg._id || Date.now(),
              text: msg.text,
              sender: msg.senderId === currentUser.userId ? "me" : "other",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              senderName: msg.senderName,
              fileUrl: msg.fileUrl,
              messageType: msg.messageType,
            },
          ])
        }
      })

      socketRef.current.on("typing", ({ conversationId, userId }) => {
        if (conversationId === activeConversation?._id && userId !== currentUser.userId) {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 2000)
        }
      })

      return () => {
        socketRef.current.disconnect()
      }
    }
  }, [isConnected, currentUser, activeConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // API check
  useEffect(() => {
    checkApiConnection()
  }, [])

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`)
      if (response.ok) {
        setApiStatus("connected")
        setConnectionError("")
      } else {
        throw new Error(`API responded with status: ${response.status}`)
      }
    } catch (error) {
      setApiStatus("error")
      setConnectionError("Cannot connect to chat server. Please check if the backend is running.")
    }
  }

  // User connection
  const connectUser = async (username) => {
    // Prefer passed username, otherwise from state
    const finalUsername = username || connectionUsername
    if (!finalUsername || !finalUsername.trim()) return

    setIsConnecting(true)
    setConnectionError("")

    try {
      const response = await fetch(`${API_BASE}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: finalUsername,
          displayName: finalUsername,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
        setIsConnected(true)

        // Store userId in localStorage for auto-reconnect
        localStorage.setItem("chatUserId", data.user.userId)
        localStorage.setItem("chatUsername", finalUsername)

        await loadAllUsers()
        await loadConversations(data.user.userId)
      } else {
        setConnectionError(data.message || "Failed to connect")
      }
    } catch (error) {
      setConnectionError("Connection failed. Check server.")
    } finally {
      setIsConnecting(false)
    }
  }

  // Auto-connect on page load
  useEffect(() => {
    const storedUsername = localStorage.getItem("userName")

    if (storedUsername) {
      // Call connectUser with stored username
      connectUser(storedUsername)
    }
  }, [])

  const loadAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`)
      const data = await response.json()
      if (data.success) setAllUsers(data.users)
    } catch (error) {
      setConnectionError("Failed to load users")
    }
  }

  const loadConversations = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${userId}`, {
        credentials: "include",
      })
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.log("Error loading conversations:", error)
    }
  }

  const startConversation = async (otherUser) => {
    if (!currentUser) return
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      })
      const data = await response.json()
      if (data.success) {
        setActiveConversation(data.conversation)
        await loadMessages(data.conversation._id)

        if (socketRef.current) {
          socketRef.current.emit("joinConversation", data.conversation._id)
        }
      }
    } catch (error) {
      console.log("Error creating conversation:", error)
    }
  }

  const loadMessages = async (conversationId) => {
    if (!currentUser) return // ✅ don’t map messages until user is ready

    try {
      const response = await fetch(`${API_BASE}/messages/${conversationId}`)
      const data = await response.json()

      if (data.success) {
        const formattedMessages = data.messages.reverse().map((msg) => ({
          id: msg._id,
          text: msg.text,
          sender: msg.senderId === currentUser.userId ? "me" : "other", // ✅ works only when currentUser set
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          senderName: msg.senderName,
          fileUrl: msg.fileUrl,
          messageType: msg.messageType,
          fileName: msg.fileName,
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.log("Error loading messages:", error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !currentUser) return

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: newMessage,
        }),
      })

      const data = await response.json()
      if (data.success) {
        const newMsg = {
          id: data.message._id,
          text: data.message.text,
          sender: "me",
          timestamp: new Date(data.message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          senderName: data.message.senderName,
        }
        // Make sure socket exists before sending
        if (socketRef.current && activeConversation) {
          socketRef.current.emit("sendMessage", {
            conversationId: activeConversation._id,
            senderId: currentUser.userId,
            text: data.message.text,
            fileUrl: data.message.fileUrl,
            messageType: data.message.messageType,
            senderName: data.message.senderName,
          })
        }

        setNewMessage("")
      }
    } catch (error) {
      console.log("Error sending message:", error)
    }
  }

 import imageCompression from "browser-image-compression"
import heic2any from "heic2any"

const handleFileChange = async (e) => {
  let file = e.target.files[0]
  if (!file || !activeConversation || !currentUser) return

  try {
    // 🟢 HEIC to JPEG conversion
    if (file.type === "image/heic" || file.name.endsWith(".heic")) {
      const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" })
      file = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: new Date().getTime(),
      })
    }

    // 🟢 Image compression
    const options = {
      maxSizeMB: 1, // compress to ~1MB
      maxWidthOrHeight: 1200, // resize if larger
      useWebWorker: true,
    }
    if (file.type.startsWith("image/")) {
      file = await imageCompression(file, options)
    }

    // 🟢 Prepare form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("conversationId", activeConversation._id)
    formData.append("senderId", currentUser.userId)

    // 🟢 Upload API
    const response = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData })
    const data = await response.json()

    if (data.success) {
      const newMsg = {
        id: data.message._id,
        text: data.message.text,
        sender: "me",
        timestamp: new Date(data.message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: data.message.senderName,
        fileUrl: data.message.fileUrl,
        messageType: data.message.messageType,
      }

      setMessages((prev) => [...prev, newMsg])

      socketRef.current.emit("sendMessage", {
        conversationId: activeConversation._id,
        senderId: currentUser.userId,
        text: data.message.text,
        fileUrl: data.message.fileUrl,
        messageType: data.message.messageType,
        senderName: data.message.senderName,
      })
    }
  } catch (error) {
    console.error("Error processing/uploading file:", error)
  }
}

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }
  return (
 <div className="h-[85vh] md:h-[86vh] lg:h-[80vh] flex justify-center bg-gray-100 pt-1 md:pt-0">


 

  <div className="w-full max-w-5xl h-full bg-white shadow-2xl overflow-hidden flex relative">

        {/* Sidebar */}
<div
  className={`
    absolute inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl transform transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    lg:relative lg:translate-x-0
  `}
>


          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 flex flex-col bg-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-lime-700">ChatFlow</h1>
              {/* Close button (mobile only) */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              You are logged in as <span className="font-medium text-gray-700">{currentUser?.userName}</span>
            </p>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-2">
            <h3 className="text-xs font-semibold text-gray-500 px-2 mb-3 uppercase tracking-wide">Chats</h3>
            <div className="space-y-1">
              {allUsers
                .filter((user) => user.userId !== currentUser?.userId)
                .filter((user) => conversations.some((conv) => conv.participants.some((p) => p.userId === user.userId)))
                .map((user) => (
                  <div
                    key={user.userId}
                    className="group flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-xl transition-all duration-200 relative"
                    onClick={() => {
                      startConversation(user)
                      setSidebarOpen(false) // close sidebar on mobile
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {user.userName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          user.isOnline ? "bg-green-600" : "bg-gray-400"
                        }`}
                      ></span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.userName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.isOnline ? "Online" : `Last seen ${new Date(user.lastSeen).toLocaleDateString()}`}
                      </p>
                    </div>

                    {/* Optional Last Message Time */}
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {user.lastSeen &&
                        new Date(user.lastSeen).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mobile Topbar */}
          {/* Mobile Topbar */}
<div className="lg:hidden sticky top-0 z-20 p-4 border-b bg-white flex items-center justify-between">
    <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-lime-600">
      ☰
    </button>
    <h2 className="font-bold text-lg text-gray-800">ChatFlow</h2>
    <div className="w-6"></div>
  </div>


          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="sticky top-0 z-10 p-3 lg:p-4 border-b border-gray-200 bg-white flex items-center space-x-3">
                {/* Profile Avatar */}
                <div className="relative">
                  <div
                    className="h-10 w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      backgroundColor: "#84cc16", // 🎨 set avatar color here (example: indigo-600)
                    }}
                  >
                    {activeConversation.participants
                      .find((p) => p.userId !== currentUser?.userId)
                      ?.userName?.charAt(0)
                      ?.toUpperCase() || "U"}
                  </div>

                  {/* Online status dot */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-green-600 rounded-full border-2 border-white"></div>
                </div>

                {/* User Info */}
                <div>
                  <h2 className="text-sm lg:text-base font-semibold text-gray-900">
                    {activeConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName ||
                      "Unknown User"}
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
  Online • <span className="text-green-600">Active now</span>
</p>

                </div>
              </div>
             {/* Messages area (scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <div key={message.id}
                    className={`flex animate-in fade-in duration-300 ${
                      message.sender === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-end gap-3 max-w-[80%] sm:max-w-xs lg:max-w-md ${
                        message.sender === "me" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {message.sender === "other" && (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                          {message.senderName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-300 ${
                          message.sender === "me"
                            ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white rounded-br-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        {message.messageType === "image" ? (
                          <img
                            src={`http://localhost:8080${message.fileUrl}`}
                            alt={message.fileName || "Shared image"}
                            className="max-w-[180px] sm:max-w-[220px] max-h-[220px] object-cover rounded-xl mb-2 shadow-sm hover:shadow-md transition"
                          />
                        ) : message.messageType === "document" ? (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
                          >
                            📄 {message.fileName}
                          </a>
                        ) : (
                          <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                        )}

                        <p
                          className={`text-xs mt-2 font-medium ${
                            message.sender === "me" ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="flex items-end gap-3 max-w-xs lg:max-w-md">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        U
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-gray-200 shadow-md">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input (always at bottom) */}
              <div className="sticky bottom-0 z-20 p-2 lg:p-3 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  >
                    <FaCamera className="w-5 h-5" />
                  </button>

                  {/* Message Input */}
                  <div className="flex-1">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition text-sm lg:text-base"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-40 disabled:hover:scale-100"
                  >
                    ➤
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
              <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700 p-4">
                <div className="relative mx-auto mb-6 lg:mb-8">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center shadow-xl">
                    💬
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-800 mb-2 lg:mb-3">Start a Conversation</h3>
                <p className="text-gray-600 text-sm lg:text-lg max-w-md mx-auto leading-relaxed">
                  Select someone from the sidebar to begin chatting and connect instantly
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
