"use client"
import { useState, useRef, useEffect } from "react"
import io from "socket.io-client"
import { useLocation } from "react-router-dom"
import imageCompression from "browser-image-compression"
import heic2any from "heic2any"

// ----------------------
// Config
// ----------------------
const API_BASE = `${import.meta.env.VITE_SERVER}/api/chat`
const SOCKET_URL = `${import.meta.env.VITE_SOCKET}`

export default function ChatApp() {
  // ----------------------
  // State
  // ----------------------
  const [currentUser, setCurrentUser] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Connection states
  const [connectionUsername, setConnectionUsername] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [apiStatus, setApiStatus] = useState("checking")

  // ----------------------
  // Refs
  // ----------------------
  const socketRef = useRef(null)
  const activeConversationRef = useRef(null)
  const messagesRef = useRef([])
  const userRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // ----------------------
  // Router location state
  // ----------------------
  const location = useLocation()
  const focusedConversationId = location.state?.conversationId

  // ----------------------
  // Keep refs in sync
  // ----------------------
  useEffect(() => {
    activeConversationRef.current = activeConversation?._id || null
  }, [activeConversation])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    userRef.current = currentUser
  }, [currentUser])

  // ----------------------
  // API check on mount
  // ----------------------
  useEffect(() => {
    checkApiConnection()
  }, [])

  const checkApiConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`)
      if (res.ok) {
        setApiStatus("connected")
        setConnectionError("")
      } else throw new Error("API error")
    } catch {
      setApiStatus("error")
      setConnectionError("Cannot connect to chat server. Please check if backend is running.")
    }
  }

  // ----------------------
  // Auto-connect stored user
  // ----------------------
  useEffect(() => {
    const storedUsername = localStorage.getItem("chatUsername")
    if (storedUsername) connectUser(storedUsername)
  }, [])

  const connectUser = async (username) => {
    if (!username.trim()) return
    setIsConnecting(true)
    setConnectionError("")
    try {
      const res = await fetch(`${API_BASE}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName: username }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentUser(data.user)
        setIsConnected(true)
        localStorage.setItem("chatUserId", data.user.userId)
        localStorage.setItem("chatUsername", username)
        await loadAllUsers()
        await loadConversations(data.user.userId)
      } else setConnectionError(data.message || "Failed to connect")
    } catch {
      setConnectionError("Connection failed. Check server.")
    } finally {
      setIsConnecting(false)
    }
  }

  // ----------------------
  // Loaders
  // ----------------------
  const loadAllUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`)
      const data = await res.json()
      if (data.success) setAllUsers(data.users)
    } catch {
      setConnectionError("Failed to load users")
    }
  }

  const loadConversations = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${userId}`)
      const data = await res.json()
      if (data.success) setConversations(data.conversations)
    } catch (e) {
      console.error("Error loading conversations:", e)
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      const res = await fetch(`${API_BASE}/messages/${conversationId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(
          [...data.messages].reverse().map((msg) => ({
            id: msg._id,
            text: msg.text,
            sender: msg.senderId === currentUser.userId ? "me" : "other",
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            senderName: msg.senderName,
            fileUrl: msg.fileUrl,
            messageType: msg.messageType,
            fileName: msg.fileName,
          }))
        )
      }
    } catch (e) {
      console.error("Error loading messages:", e)
    }
  }

  // ----------------------
  // Conversation helpers
  // ----------------------
  const startConversation = async (otherUser) => {
    if (!currentUser) return
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveConversation(data.conversation)
        await loadMessages(data.conversation._id)
        socketRef.current?.emit("joinConversation", data.conversation._id)
      }
    } catch (e) {
      console.error("Error starting conversation:", e)
    }
  }

  // ----------------------
  // Socket setup
  // ----------------------
  useEffect(() => {
    if (!isConnected || !currentUser) return
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { withCredentials: true })
    }
    const socket = socketRef.current

    // New message
    const handleNewMessage = (msg) => {
      if (msg.conversationId === activeConversationRef.current) {
        setMessages((prev) => {
          const incomingId = msg._id || msg.id || Date.now()
          if (prev.some((m) => m.id === incomingId)) return prev
          return [
            ...prev,
            {
              id: incomingId,
              text: msg.text,
              sender: msg.senderId === userRef.current?.userId ? "me" : "other",
              timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              senderName: msg.senderName,
              fileUrl: msg.fileUrl,
              messageType: msg.messageType,
              fileName: msg.fileName,
            },
          ]
        })
      }
    }

    // Typing
    const handleTyping = ({ conversationId, userId }) => {
      if (conversationId === activeConversationRef.current && userId !== userRef.current?.userId) {
        setIsTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000)
      }
    }

    socket.off("newMessage").on("newMessage", handleNewMessage)
    socket.off("typing").on("typing", handleTyping)

    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("typing", handleTyping)
    }
  }, [isConnected, currentUser])

  // Join conversation when active changes
  useEffect(() => {
    if (socketRef.current && activeConversation?._id) {
      socketRef.current.emit("joinConversation", activeConversation._id)
    }
  }, [activeConversation?._id])

  // Cleanup socket
  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    socketRef.current?.disconnect()
    socketRef.current = null
  }, [])

  // ----------------------
  // Message sending
  // ----------------------
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !currentUser) return
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversation._id, senderId: currentUser.userId, text: newMessage }),
      })
      const data = await res.json()
      if (data.success) {
        socketRef.current?.emit("sendMessage", {
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: data.message.text,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
          senderName: data.message.senderName,
          _id: data.message._id,
        })
        setNewMessage("")
      }
    } catch (e) {
      alert("Failed to send message.")
    }
  }

  // ----------------------
  // File sending (HEIC + compression)
  // ----------------------
  const handleFileChange = async (e) => {
    let file = e.target.files[0]
    if (!file || !activeConversation || !currentUser) return
    try {
      if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
        const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" })
        file = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" })
      }
      if (file.type.startsWith("image/")) {
        file = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
      }
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", activeConversation._id)
      formData.append("senderId", currentUser.userId)
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) {
        socketRef.current?.emit("sendMessage", {
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: data.message.text,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
          senderName: data.message.senderName,
          _id: data.message._id,
        })
      } else throw new Error("Upload failed")
    } catch (e) {
      alert("Failed to send image.")
    }
  }

  // ----------------------
  // Helpers
  // ----------------------
  const handleImageUpload = () => fileInputRef.current?.click()
  const resolveFileUrl = (fileUrl) => {
    if (!fileUrl) return ""
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl
    const base = (import.meta.env.VITE_SERVER || "").replace(/\/$/, "")
    return `${base}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`
  }
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(scrollToBottom, [messages])
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ChatFlow</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">Welcome, {currentUser?.userName}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition">✕</button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Available Users</h3>
          <div className="space-y-3">
            {allUsers
              .filter((user) => user.userId !== currentUser?.userId)
              .filter((user) =>
                conversations.some((conv) => conv.participants.some((p) => p.userId === user.userId))
              )
              .map((user) => (
                <div
                  key={user.userId}
                  className="group p-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 cursor-pointer transition-all duration-300 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg transform hover:scale-[1.02]"
                  onClick={() => {
                    startConversation(user)
                    setSidebarOpen(false) // close sidebar on mobile
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">{user.userName?.charAt(0)?.toUpperCase() || "U"}</div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${user.isOnline ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors duration-200">{user.userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.isOnline ? (<span className="text-emerald-600 font-medium">● Online</span>) : (`Last seen ${new Date(user.lastSeen).toLocaleDateString()}`)}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 text-xs px-3 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105">Chat</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Topbar */}
        <div className="lg:hidden p-4 border-b bg-white flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-emerald-600">☰</button>
          <h2 className="font-bold text-lg text-gray-800">ChatFlow</h2>
          <div className="w-6"></div>
        </div>

        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 lg:p-6 border-b border-gray-200 bg-white shadow-sm flex items-center space-x-4">
              <div className="relative">
                <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">{activeConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName?.charAt(0)?.toUpperCase() || "U"}</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h2 className="text-base lg:text-xl font-bold text-gray-800">{activeConversation.participants.find((p) => p.userId !== currentUser?.userId)?.userName || "Unknown User"}</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-xs lg:text-sm text-emerald-600 font-semibold">Online • Active now</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((message) => (
                <div key={message.id} className={`flex animate-in slide-in-from-bottom-2 duration-300 ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end space-x-3 max-w-[80%] sm:max-w-xs lg:max-w-md ${message.sender === "me" ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {message.sender === "other" && (<div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">{message.senderName?.charAt(0)?.toUpperCase() || "U"}</div>)}

                    <div className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${message.sender === "me" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-md shadow-lg shadow-emerald-500/25" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md hover:border-gray-300"}`}>
                      {message.messageType === "image" ? (
                        <img src={resolveFileUrl(message.fileUrl)} alt={message.fileName || "Shared image"} className="max-w-[150px] sm:max-w-[200px] max-h-[200px] object-cover rounded-xl mb-2 shadow" />
                      ) : message.messageType === "document" ? (
                        <a href={resolveFileUrl(message.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm font-medium text-emerald-600 hover:underline">📄 {message.fileName || "Download file"}</a>
                      ) : (
                        <p className="text-sm leading-relaxed font-medium">{message.text}</p>
                      )}

                      <p className={`text-xs mt-2 font-medium ${message.sender === "me" ? "text-white/80" : "text-gray-500"}`}>{message.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-in fade-in-0 duration-300">
                  <div className="flex items-end space-x-3 max-w-xs lg:max-w-md">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">U</div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-gray-200 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 lg:p-6 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3 lg:space-x-4">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.heic" className="hidden" />

                <button type="button" onClick={handleImageUpload} className="text-gray-400 hover:text-emerald-600 transition p-2 lg:p-3 rounded-xl hover:bg-emerald-50 group">📷</button>

                <div className="flex-1">
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-sm lg:text-base" />
                </div>

                <button type="submit" className="px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-emerald-500/25 text-sm lg:text-base" disabled={!newMessage.trim()}>➤</button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
            <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700 p-4">
              <div className="relative mx-auto mb-6 lg:mb-8">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center shadow-xl">💬</div>
                <div className="absolute -top-2 -right-2 w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <h3 className="text-lg lg:text-2xl font-bold text-gray-800 mb-2 lg:mb-3">Start a Conversation</h3>
              <p className="text-gray-600 text-sm lg:text-lg max-w-md mx-auto leading-relaxed">Select someone from the sidebar to begin chatting and connect instantly</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
    