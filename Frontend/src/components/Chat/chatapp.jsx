"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import io from "socket.io-client"
import { useLocation } from "react-router-dom"
import { FaCamera, FaTimes, FaBars, FaPaperPlane, FaCheck, FaCheckDouble, FaExclamationTriangle } from "react-icons/fa"
import imageCompression from "browser-image-compression"
import heic2any from "heic2any"

export default function ChatApp() {
  const [currentUser, setCurrentUser]           = useState(null)
  const [allUsers, setAllUsers]                 = useState([])
  const [conversations, setConversations]       = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages]                 = useState([])
  const [newMessage, setNewMessage]             = useState("")
  const [isTyping, setIsTyping]                 = useState(false)
  const [sidebarOpen, setSidebarOpen]           = useState(false)
  const [isConnected, setIsConnected]           = useState(false)
  const [uploadState, setUploadState]           = useState("idle") // idle | processing | uploading | error
  const [lightboxImage, setLightboxImage]       = useState(null)
  const [loadingMessages, setLoadingMessages]   = useState(false)

  const location              = useLocation()
  const focusedConversationId = location.state?.conversationId

  const API_BASE   = `${import.meta.env.VITE_SERVER}/api/chat`
  const SOCKET_URL = `${import.meta.env.VITE_SOCKET}`

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const messagesContainerRef  = useRef(null)
  const fileInputRef          = useRef(null)
  const socketRef             = useRef(null)
  const activeConvRef         = useRef(null)   // avoids stale closure in socket handler
  const currentUserRef        = useRef(null)
  const typingTimeoutRef      = useRef(null)
  const isFirstLoad           = useRef(true)

  // Keep refs in sync
  useEffect(() => { activeConvRef.current  = activeConversation }, [activeConversation])
  useEffect(() => { currentUserRef.current = currentUser },        [currentUser])

  // ─── Auto-connect ─────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("userName")
    if (stored) connectUser(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Auto-focus conversation from route state ─────────────────────────────
  useEffect(() => {
    if (!currentUser || !conversations.length || !focusedConversationId) return
    const target = conversations.find(c => c._id === focusedConversationId)
    if (target) selectConversation(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, conversations, focusedConversationId])

  // ─── Socket — init ONCE per session, never on conversation change ──────────
  useEffect(() => {
    if (!isConnected || !currentUser) return

    const socket = io(SOCKET_URL, {
      path: "/socket.io/",
      transports: ["websocket"],
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on("newMessage", (msg) => {
      const conv = activeConvRef.current
      const user = currentUserRef.current
      if (!conv || !user || msg.conversationId !== conv._id) return
      // Skip own messages — already added optimistically
      if (msg.senderId === user.userId) return

      setMessages(prev => [...prev, {
        id:          msg._id || Date.now(),
        text:        msg.text,
        sender:      "other",
        timestamp:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        senderName:  msg.senderName,
        fileUrl:     msg.fileUrl,
        messageType: msg.messageType,
        fileName:    msg.fileName,
      }])
    })

    socket.on("typing", ({ conversationId, userId }) => {
      const conv = activeConvRef.current
      const user = currentUserRef.current
      if (conversationId === conv?._id && userId !== user?.userId) {
        setIsTyping(true)
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500)
      }
    })

    return () => {
      socket.disconnect()
      clearTimeout(typingTimeoutRef.current)
    }
  }, [isConnected, currentUser]) // ← no activeConversation dep — fixes reconnect bug

  // ─── Join socket room whenever active conversation changes ─────────────────
  useEffect(() => {
    if (activeConversation && socketRef.current) {
      socketRef.current.emit("joinConversation", activeConversation._id)
    }
  }, [activeConversation])

  // ─── Scroll helpers ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" })
  }, [])

  useEffect(() => {
    if (!messages.length) return
    // Wait one tick for the DOM to paint, then scroll
    const t = setTimeout(() => scrollToBottom(!isFirstLoad.current), 60)
    isFirstLoad.current = false
    return () => clearTimeout(t)
  }, [messages.length, scrollToBottom])

  // ─── API helpers ──────────────────────────────────────────────────────────
  const connectUser = async (username) => {
    const name = (username || "").trim()
    if (!name) return
    try {
      const res  = await fetch(`${API_BASE}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, displayName: name }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentUser(data.user)
        setIsConnected(true)
        localStorage.setItem("chatUserId",   data.user.userId)
        localStorage.setItem("chatUsername", name)
        await Promise.all([loadAllUsers(), loadConversations(data.user.userId)])
      }
    } catch {
      console.error("Chat connect failed")
    }
  }

  const loadAllUsers = async () => {
    try {
      const res  = await fetch(`${API_BASE}/users`)
      const data = await res.json()
      if (data.success) setAllUsers(data.users)
    } catch {}
  }

  const loadConversations = async (userId) => {
    try {
      const res  = await fetch(`${API_BASE}/conversations/${userId}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) setConversations(data.conversations)
    } catch {}
  }

  const loadMessages = async (conversationId) => {
    if (!currentUser) return
    setLoadingMessages(true)
    isFirstLoad.current = true
    try {
      const res  = await fetch(`${API_BASE}/messages/${conversationId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages.reverse().map(msg => ({
          id:          msg._id,
          text:        msg.text,
          sender:      msg.senderId === currentUser.userId ? "me" : "other",
          timestamp:   new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          senderName:  msg.senderName,
          fileUrl:     msg.fileUrl,
          messageType: msg.messageType,
          fileName:    msg.fileName,
        })))
      }
    } catch {}
    finally { setLoadingMessages(false) }
  }

  const selectConversation = async (conv) => {
    setActiveConversation(conv)
    setMessages([])
    setSidebarOpen(false)
    await loadMessages(conv._id)
  }

  const startConversation = async (otherUser) => {
    if (!currentUser) return
    try {
      const res  = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      })
      const data = await res.json()
      if (data.success) await selectConversation(data.conversation)
    } catch {}
  }

  // ─── Send text message (optimistic) ──────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !activeConversation || !currentUser) return

    const tempId = `temp-${Date.now()}`
    setNewMessage("")

    // ✅ Add to UI immediately
    setMessages(prev => [...prev, {
      id:          tempId,
      text,
      sender:      "me",
      timestamp:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      senderName:  currentUser.userName,
      messageType: "text",
      sending:     true,
    }])

    try {
      const res  = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          senderId:       currentUser.userId,
          text,
        }),
      })
      const data = await res.json()

      if (data.success) {
        // Confirm optimistic message
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...m,
          id:        data.message._id,
          timestamp: new Date(data.message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sending:   false,
        } : m))

        socketRef.current?.emit("sendMessage", {
          conversationId: activeConversation._id,
          senderId:       currentUser.userId,
          recipientId:    getOtherParticipant(activeConversation)?.userId,
          text:           data.message.text,
          fileUrl:        data.message.fileUrl,
          messageType:    data.message.messageType,
          senderName:     data.message.senderName,
          _id:            data.message._id,
        })
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m))
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m))
    }
  }

  // ─── Send image (optimistic with local preview) ────────────────────────────
  const handleFileChange = async (e) => {
    let file = e.target.files[0]
    if (!file || !activeConversation || !currentUser) return
    e.target.value = "" // reset so same file can be re-selected

    const tempId    = `temp-img-${Date.now()}`
    const localUrl  = URL.createObjectURL(file)

    // ✅ Show image immediately from local blob
    setMessages(prev => [...prev, {
      id:          tempId,
      sender:      "me",
      timestamp:   new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      senderName:  currentUser.userName,
      messageType: "image",
      localUrl,          // blob preview
      fileUrl:     null, // server URL — filled after upload
      sending:     true,
    }])
    setUploadState("processing")

    try {
      // HEIC → JPEG
      const isHeic = file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic")
      if (isHeic) {
        let converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
        if (Array.isArray(converted)) converted = converted[0]
        file = new File([converted], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg", lastModified: Date.now() })
      }

      // Compress
      setUploadState("uploading")
      if (file.type.startsWith("image/")) {
        file = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
      }

      const formData = new FormData()
      formData.append("file",           file)
      formData.append("conversationId", activeConversation._id)
      formData.append("senderId",       currentUser.userId)

      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Upload failed")

      // ✅ Replace blob URL with real server URL
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        id:      data.message._id,
        fileUrl: data.message.fileUrl,
        sending: false,
      } : m))
      setUploadState("idle")

      socketRef.current?.emit("sendMessage", {
        conversationId: activeConversation._id,
        senderId:       currentUser.userId,
        recipientId:    getOtherParticipant(activeConversation)?.userId,
        text:           data.message.text,
        fileUrl:        data.message.fileUrl,
        messageType:    data.message.messageType,
        senderName:     data.message.senderName,
        _id:            data.message._id,
        fileName:       data.message.fileName,
      })
    } catch (err) {
      console.error("Upload error:", err)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m))
      setUploadState("error")
    }
  }

  // ─── Typing indicator emit ─────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (!socketRef.current || !activeConversation || !currentUser) return
    socketRef.current.emit("typing", {
      conversationId: activeConversation._id,
      userId:         currentUser.userId,
    })
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getOtherParticipant = (conv) =>
    conv?.participants?.find(p => p.userId !== currentUser?.userId)

  const getOnlineUser = (conv) => {
    const other = getOtherParticipant(conv)
    return allUsers.find(u => u.userId === other?.userId)
  }

  const avatarLetter = (name) => (name || "U").charAt(0).toUpperCase()

  const chatUsers = allUsers
    .filter(u => u.userId !== currentUser?.userId)
    .filter(u => conversations.some(c => c.participants.some(p => p.userId === u.userId)))

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-[85vh] md:h-[86vh] lg:h-[80vh] flex justify-center bg-gray-100 pt-1 md:pt-0">
      <div className="w-full max-w-5xl h-full bg-white shadow-2xl overflow-hidden flex relative rounded-none md:rounded-2xl">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={`
            absolute inset-y-0 left-0 z-40 w-72 flex flex-col bg-white border-r border-gray-100 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:relative lg:translate-x-0
          `}
        >
          {/* Sidebar header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-teal-600">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Messages</h1>
                {currentUser && (
                  <p className="text-xs text-emerald-100 mt-0.5 truncate max-w-[180px]">
                    {currentUser.userName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
              >
                <FaTimes size={13} />
              </button>
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto py-2">
            {chatUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start chatting with a seller or buyer</p>
              </div>
            ) : (
              chatUsers.map(user => {
                const conv = conversations.find(c => c.participants.some(p => p.userId === user.userId))
                const isActive = activeConversation && conv?._id === activeConversation._id
                return (
                  <button
                    key={user.userId}
                    onClick={() => startConversation(user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left
                      ${isActive
                        ? "bg-emerald-50 border-r-4 border-emerald-500"
                        : "hover:bg-gray-50 border-r-4 border-transparent"
                      }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm
                        ${isActive ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-lime-500 to-emerald-500"}`}>
                        {avatarLetter(user.userName)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                        ${user.isOnline ? "bg-emerald-500" : "bg-gray-300"}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? "text-emerald-700" : "text-gray-800"}`}>
                        {user.userName}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {conv?.lastMessage
                          ? conv.lastMessage.length > 30
                            ? conv.lastMessage.slice(0, 30) + "…"
                            : conv.lastMessage
                          : user.isOnline ? "Online" : "Tap to chat"}
                      </p>
                    </div>

                    {/* Time */}
                    {conv?.lastMessageTime && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main Chat Area ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">

          {activeConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition"
                >
                  <FaBars size={16} />
                </button>

                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {avatarLetter(getOtherParticipant(activeConversation)?.userName)}
                  </div>
                  {getOnlineUser(activeConversation)?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Name / status */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {getOtherParticipant(activeConversation)?.userName || "Unknown"}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {isTyping ? "typing…" : getOnlineUser(activeConversation)?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50"
                style={{ scrollBehavior: "auto" }}
              >
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">Loading messages…</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 shadow-sm">
                      <span className="text-3xl">👋</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Say hello!</p>
                    <p className="text-xs text-gray-400 mt-1">Be the first to send a message</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      serverUrl={import.meta.env.VITE_SERVER}
                      onImageClick={setLightboxImage}
                    />
                  ))
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {avatarLetter(getOtherParticipant(activeConversation)?.userName)}
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-200 shadow-sm">
                      <div className="flex gap-1 items-center h-3">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload progress bar */}
              {(uploadState === "processing" || uploadState === "uploading") && (
                <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    {uploadState === "processing" ? "Processing image…" : "Uploading…"}
                  </p>
                </div>
              )}

              {/* Input bar */}
              <div className="px-3 py-3 border-t border-gray-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadState === "processing" || uploadState === "uploading"}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-400
                      hover:text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaCamera size={17} />
                  </button>

                  {/* Text input */}
                  <div className="flex-1">
                    <input
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type a message…"
                      className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm text-gray-800 placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full
                      bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md
                      hover:shadow-lg hover:scale-105 transition-all duration-200
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <FaPaperPlane size={14} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col">
              {/* Mobile topbar */}
              <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition"
                >
                  <FaBars size={16} />
                </button>
                <h2 className="font-bold text-gray-800">Messages</h2>
              </div>

              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                <div className="text-center px-6">
                  <div className="relative mx-auto mb-6 w-24 h-24">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center shadow-lg">
                      <span className="text-4xl">💬</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full animate-pulse shadow" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Select a conversation from the sidebar to start chatting
                  </p>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition"
                  >
                    Open Conversations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Image Lightbox ─────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={() => setLightboxImage(null)}
          >
            <FaTimes size={16} />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ─── Message Bubble Component ─────────────────────────────────────────────────
function MessageBubble({ msg, serverUrl, onImageClick }) {
  const isMe        = msg.sender === "me"
  const imageSource = msg.localUrl
    ? msg.localUrl  // immediate local preview
    : msg.fileUrl
      ? `${serverUrl}${msg.fileUrl}`
      : null

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar (other only) */}
      {!isMe && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm self-end mb-0.5">
          {(msg.senderName || "U").charAt(0).toUpperCase()}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[72%] sm:max-w-xs lg:max-w-sm ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`relative px-3.5 py-2.5 rounded-2xl shadow-sm transition-shadow duration-200
            ${isMe
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
            }
            ${msg.failed ? "opacity-60" : ""}
          `}
        >
          {/* Image message */}
          {msg.messageType === "image" && imageSource ? (
            <div className="relative">
              <img
                src={imageSource}
                alt="Shared image"
                className={`max-w-[220px] max-h-[240px] w-full object-cover rounded-xl cursor-pointer
                  hover:opacity-95 transition ${msg.sending ? "opacity-80" : ""}`}
                onClick={() => !msg.sending && onImageClick(imageSource)}
                onLoad={() => {}} // triggers re-render for scroll
              />
              {msg.sending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                  <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : msg.messageType === "document" ? (
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm font-medium ${isMe ? "text-white" : "text-emerald-600"} hover:underline`}
            >
              <span>📄</span> {msg.fileName || "Document"}
            </a>
          ) : (
            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
          )}
        </div>

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
          {isMe && (
            <span className="text-[10px]">
              {msg.failed   ? <FaExclamationTriangle className="text-red-400" size={9} /> :
               msg.sending  ? <FaCheck className="text-gray-300" size={9} /> :
                              <FaCheckDouble className="text-emerald-500" size={9} />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
