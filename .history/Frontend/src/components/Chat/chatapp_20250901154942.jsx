"use client"
import React, { useEffect, useRef, useState } from "react"
import io from "socket.io-client"
import { useLocation } from "react-router-dom"

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
// If your backend expects the client to emit after the HTTP POST, set this to true.
// If your backend broadcasts the new message from the server after saving, set false.
// We keep deduplication so either mode should be safe. Default: true for backward
// compatibility with the code you provided.
const CLIENT_EMIT_AFTER_POST = true

// -----------------------------------------------------------------------------
// useChatSocket - encapsulates socket lifecycle and handlers
// -----------------------------------------------------------------------------
function useChatSocket(currentUser, { onNewMessage, onTyping, onUserOnline } = {}) {
  const socketRef = useRef(null)
  const handlersRef = useRef({ onNewMessage, onTyping, onUserOnline })

  // keep handler refs fresh so the socket handlers always call latest callbacks
  useEffect(() => {
    handlersRef.current = { onNewMessage, onTyping, onUserOnline }
  }, [onNewMessage, onTyping, onUserOnline])

  useEffect(() => {
    if (!currentUser) return

    // avoid creating multiple sockets (helps with StrictMode double-mount in dev)
    if (socketRef.current && socketRef.current.connected) return

    const SOCKET_URL = import.meta.env.VITE_SOCKET || window.location.origin
    socketRef.current = io(SOCKET_URL, { withCredentials: true })

    const socket = socketRef.current

    const handleNewMessage = (msg) => {
      // delegate to the latest handler
      handlersRef.current.onNewMessage?.(msg)
    }

    const handleTyping = (data) => handlersRef.current.onTyping?.(data)
    const handleUserOnline = (u) => handlersRef.current.onUserOnline?.(u)

    socket.on("connect", () => console.debug("Socket connected", socket.id))
    socket.on("newMessage", handleNewMessage)
    socket.on("typing", handleTyping)
    socket.on("userOnline", handleUserOnline)

    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("typing", handleTyping)
      socket.off("userOnline", handleUserOnline)
      socket.disconnect()
      socketRef.current = null
    }
  }, [currentUser])

  const joinConversation = (conversationId) => {
    if (!socketRef.current) return
    socketRef.current.emit("joinConversation", conversationId)
  }

  const leaveConversation = (conversationId) => {
    if (!socketRef.current) return
    // NOTE: socket.io doesn't have a built-in leave with room name on client
    // but you can call socket.leave from server side if needed. We keep
    // the client simple and rely on joinConversation and socket disconnect.
  }

  const sendViaSocket = (payload) => {
    if (!socketRef.current) return
    socketRef.current.emit("sendMessage", payload)
  }

  const emitTyping = (payload) => {
    if (!socketRef.current) return
    socketRef.current.emit("typing", payload)
  }

  return { joinConversation, sendViaSocket, emitTyping, socketRef }
}

// -----------------------------------------------------------------------------
// Helper: dedupe and manage messages safely when socket callback closures
// -----------------------------------------------------------------------------
function useMessagesState() {
  const [messages, setMessages] = useState([])
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const exists = (incoming) => {
    // Deduplicate by id when present. If id missing, compare a simple signature.
    if (!incoming) return false
    if (incoming.id && messagesRef.current.some((m) => m.id === incoming.id)) return true

    // signature fallback (sender + text + timestamp within a small window)
    return messagesRef.current.some((m) =>
      m.senderName === incoming.senderName &&
      m.text === incoming.text &&
      Math.abs(new Date(m.timestamp).getTime() - new Date(incoming.timestamp).getTime()) < 3000
    )
  }

  const add = (incoming) => {
    if (!incoming) return
    if (exists(incoming)) {
      // If exists, we can consider updating it (e.g. replace pending with confirmed)
      setMessages((prev) => prev.map((m) => (m.id === incoming.id ? { ...m, ...incoming } : m)))
      return
    }
    setMessages((prev) => [...prev, incoming])
  }

  const reset = (arr) => setMessages(arr || [])

  return { messages, add, reset, exists }
}

// -----------------------------------------------------------------------------
// UI components (simple, tailwind-based). Keep them minimal — style as you like.
// -----------------------------------------------------------------------------
function Sidebar({ currentUser, conversations, allUsers, onSelectConversation, onStartConversation }) {
  return (
    <aside className="w-80 border-r bg-white min-h-screen p-4">
      <div className="mb-4">
        <div className="font-semibold">Signed in as</div>
        <div className="text-sm text-gray-600">{currentUser?.displayName || "-"}</div>
      </div>

      <div className="mb-4">
        <div className="font-semibold mb-2">Conversations</div>
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c._id}>
              <button
                onClick={() => onSelectConversation(c)}
                className="w-full text-left py-2 px-3 rounded hover:bg-gray-50"
              >
                {c.title || c._id}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="font-semibold mb-2">All Users</div>
        <ul className="space-y-2">
          {allUsers.map((u) => (
            <li key={u.userId}>
              <button
                onClick={() => onStartConversation(u)}
                className="w-full text-left py-2 px-3 rounded hover:bg-gray-50"
              >
                {u.displayName || u.username}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

function MessageBubble({ m, isMe }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}> 
      <div className={`max-w-[70%] p-3 rounded ${isMe ? "bg-green-100" : "bg-white border"}`}>
        <div className="text-xs text-gray-500">{m.senderName}</div>
        <div className="mt-1 whitespace-pre-wrap">{m.text}</div>
        {m.fileUrl && (
          <div className="mt-2">
            <a href={m.fileUrl} target="_blank" rel="noreferrer" className="underline text-sm">
              {m.fileName || "Attachment"}
            </a>
          </div>
        )}
        <div className="text-[10px] text-gray-400 mt-1">{m.timestamp}</div>
      </div>
    </div>
  )
}

function ChatWindow({ messages, messagesEndRef, isTyping }) {
  return (
    <div className="flex-1 p-4 overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="space-y-2">
        {messages.map((m) => (
          <MessageBubble key={m.id || JSON.stringify(m)} m={m} isMe={m.sender === 'me'} />
        ))}
        {isTyping && <div className="text-sm text-gray-500">Someone is typing...</div>}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

function MessageInput({ value, onChange, onSend, onImageClick }) {
  return (
    <form onSubmit={onSend} className="p-4 border-t bg-white flex items-center gap-2">
      <button type="button" onClick={onImageClick} className="px-3 py-2 border rounded">Image</button>
      <input
        value={value}
        onChange={onChange}
        placeholder="Type a message"
        className="flex-1 px-3 py-2 border rounded"
      />
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
    </form>
  )
}

// -----------------------------------------------------------------------------
// Main component - exported default
// -----------------------------------------------------------------------------
export default function ChatApp() {
  const location = useLocation()
  const focusedConversationId = location.state?.conversationId

  const API_BASE = `${import.meta.env.VITE_SERVER || ''}/api/chat`

  // Core state
  const [currentUser, setCurrentUser] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [connectionUsername, setConnectionUsername] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [apiStatus, setApiStatus] = useState("checking")
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // messages handler with dedupe
  const { messages, add: addMessage, reset: resetMessages, exists: messageExists } = useMessagesState()

  // socket hook
  const { joinConversation, sendViaSocket, emitTyping, socketRef } = useChatSocket(currentUser, {
    onNewMessage: (msg) => {
      // normalize incoming message shape (support both server and relay payloads)
      const normalized = {
        id: msg._id || msg.id || msg.message?._id,
        text: msg.text || msg.message?.text || '',
        sender: (msg.senderId === currentUser?.userId || msg.message?.senderId === currentUser?.userId) ? 'me' : 'other',
        timestamp: msg.timestamp || msg.message?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderName: msg.senderName || msg.message?.senderName || 'Unknown',
        fileUrl: msg.fileUrl || msg.message?.fileUrl,
        messageType: msg.messageType || msg.message?.messageType,
        fileName: msg.fileName || msg.message?.fileName,
      }

      // deduplicate before adding
      if (!messageExists(normalized)) addMessage(normalized)
    },
    onTyping: ({ conversationId, userId }) => {
      if (conversationId === activeConversation?._id && userId !== currentUser?.userId) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 2000)
      }
    },
  })

  // scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // API check
  useEffect(() => { checkApiConnection() }, [])

  async function checkApiConnection() {
    try {
      const res = await fetch(`${API_BASE}/users`)
      if (res.ok) setApiStatus('connected')
      else throw new Error('bad status')
    } catch (err) {
      setApiStatus('error')
      setConnectionError('Cannot connect to chat server. Please check if the backend is running.')
    }
  }

  // connect user
  const connectUser = async (username) => {
    const finalUsername = (username || connectionUsername || '').trim()
    if (!finalUsername) return

    setIsConnecting(true)
    setConnectionError('')

    try {
      const response = await fetch(`${API_BASE}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: finalUsername, displayName: finalUsername }),
      })
      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
        setIsConnected(true)

        // save consistent key
        localStorage.setItem('chatUserId', data.user.userId)
        localStorage.setItem('chatUsername', finalUsername)

        await loadAllUsers()
        await loadConversations(data.user.userId)
      } else {
        setConnectionError(data.message || 'Failed to connect')
      }
    } catch (err) {
      setConnectionError('Connection failed. Check server.')
    } finally {
      setIsConnecting(false)
    }
  }

  // auto-connect if saved
  useEffect(() => {
    const stored = localStorage.getItem('chatUsername')
    if (stored) connectUser(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // load utilities
  const loadAllUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`)
      const data = await res.json()
      if (data.success) setAllUsers(data.users || [])
    } catch (err) {
      setConnectionError('Failed to load users')
    }
  }

  const loadConversations = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${userId}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error loading conversations', err)
    }
  }

  const startConversation = async (otherUser) => {
    if (!currentUser) return
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveConversation(data.conversation)
        await loadMessages(data.conversation._id)
        joinConversation(data.conversation._id)
      }
    } catch (err) {
      console.error('Error starting conversation', err)
    }
  }

  // when activeConversation changes, load messages and join socket room
  useEffect(() => {
    if (!activeConversation || !currentUser) return
    (async () => {
      await loadMessages(activeConversation._id)
      joinConversation(activeConversation._id)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation])

  const loadMessages = async (conversationId) => {
    if (!currentUser) return
    try {
      const res = await fetch(`${API_BASE}/messages/${conversationId}`)
      const data = await res.json()
      if (data.success) {
        const formatted = data.messages.reverse().map((msg) => ({
          id: msg._id,
          text: msg.text,
          sender: msg.senderId === currentUser.userId ? 'me' : 'other',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: msg.senderName,
          fileUrl: msg.fileUrl,
          messageType: msg.messageType,
          fileName: msg.fileName,
        }))
        resetMessages(formatted)
      }
    } catch (err) {
      console.error('Error loading messages', err)
    }
  }

  // send message
  const handleSendMessage = async (e) => {
    e?.preventDefault?.()
    if (!newMessage.trim() || !activeConversation || !currentUser) return

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversation._id, senderId: currentUser.userId, text: newMessage }),
      })
      const data = await res.json()
      if (data.success) {
        const sentMsg = {
          id: data.message._id,
          text: data.message.text,
          sender: 'me',
          timestamp: new Date(data.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: data.message.senderName,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
        }

        // Add locally if not exists (handles the case where server will also broadcast)
        if (!messageExists(sentMsg)) addMessage(sentMsg)

        // Emit via socket if configured and socket available. Dedupe on incoming socket side.
        if (CLIENT_EMIT_AFTER_POST && socketRef.current) {
          sendViaSocket({
            conversationId: activeConversation._id,
            senderId: currentUser.userId,
            text: data.message.text,
            fileUrl: data.message.fileUrl,
            messageType: data.message.messageType,
            senderName: data.message.senderName,
            _id: data.message._id,
          })
        }

        setNewMessage("")
      }
    } catch (err) {
      console.error('Error sending message', err)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeConversation || !currentUser) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversationId', activeConversation._id)
    formData.append('senderId', currentUser.userId)

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        const msg = {
          id: data.message._id,
          text: data.message.text,
          sender: 'me',
          timestamp: new Date(data.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: data.message.senderName,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
          fileName: data.message.fileName,
        }
        if (!messageExists(msg)) addMessage(msg)

        if (CLIENT_EMIT_AFTER_POST && socketRef.current) {
          sendViaSocket({
            conversationId: activeConversation._id,
            senderId: currentUser.userId,
            text: data.message.text,
            fileUrl: data.message.fileUrl,
            messageType: data.message.messageType,
            senderName: data.message.senderName,
            _id: data.message._id,
          })
        }
      }
    } catch (err) {
      console.error('Error uploading file', err)
    }
  }

  const handleImageUpload = () => fileInputRef.current?.click()

  // quick helpers exposed to UI
  const onSelectConversation = (conv) => setActiveConversation(conv)
  const onStartConversation = (user) => startConversation(user)

  return (
    <div className="flex h-screen">
      <Sidebar
        currentUser={currentUser}
        conversations={conversations}
        allUsers={allUsers}
        onSelectConversation={onSelectConversation}
        onStartConversation={onStartConversation}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <ChatWindow messages={messages} messagesEndRef={messagesEndRef} isTyping={isTyping} />
        </div>

        <MessageInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onSend={handleSendMessage}
          onImageClick={handleImageUpload}
        />

        <input ref={fileInputRef} onChange={handleFileChange} type="file" className="hidden" />
      </div>
    </div>
  )

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            ChatFlow
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            Welcome, {currentUser?.userName}
          </p>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition"
        >
          ✕
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
          Available Users
        </h3>
        <div className="space-y-3">
          {allUsers
            .filter((user) => user.userId !== currentUser?.userId)
            .filter((user) =>
              conversations.some((conv) =>
                conv.participants.some((p) => p.userId === user.userId)
              )
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
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {user.userName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        user.isOnline ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    ></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors duration-200">
                      {user.userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.isOnline ? (
                        <span className="text-emerald-600 font-medium">● Online</span>
                      ) : (
                        `Last seen ${new Date(user.lastSeen).toLocaleDateString()}`
                      )}
                    </p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-xs px-3 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105">
                    Chat
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>

    {/* Backdrop for mobile */}
    {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      ></div>
    )}

    {/* Main Chat Area */}
    <div className="flex-1 flex flex-col">
      {/* Mobile Topbar */}
      <div className="lg:hidden p-4 border-b bg-white flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-600 hover:text-emerald-600"
        >
          ☰
        </button>
        <h2 className="font-bold text-lg text-gray-800">ChatFlow</h2>
        <div className="w-6"></div>
      </div>

      {activeConversation ? (
        <>
          {/* Chat Header */}
          <div className="p-4 lg:p-6 border-b border-gray-200 bg-white shadow-sm flex items-center space-x-4">
            <div className="relative">
              <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                {activeConversation.participants
                  .find((p) => p.userId !== currentUser?.userId)
                  ?.userName?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div>
              <h2 className="text-base lg:text-xl font-bold text-gray-800">
                {activeConversation.participants.find(
                  (p) => p.userId !== currentUser?.userId
                )?.userName || "Unknown User"}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-xs lg:text-sm text-emerald-600 font-semibold">
                  Online • Active now
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex animate-in slide-in-from-bottom-2 duration-300 ${
                  message.sender === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-end space-x-3 max-w-[80%] sm:max-w-xs lg:max-w-md ${
                    message.sender === "me"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  {message.sender === "other" && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {message.senderName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                      message.sender === "me"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-md shadow-lg shadow-emerald-500/25"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-md hover:border-gray-300"
                    }`}
                  >
                    {message.messageType === "image" ? (
                      <img
                        src={`http://localhost:8080${message.fileUrl}`}
                        alt={message.fileName || "Shared image"}
                        className="max-w-[150px] sm:max-w-[200px] max-h-[200px] object-cover rounded-xl mb-2 shadow"
                      />
                    ) : message.messageType === "document" ? (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm font-medium text-emerald-600 hover:underline"
                      >
                        📄 {message.fileName}
                      </a>
                    ) : (
                      <p className="text-sm leading-relaxed font-medium">
                        {message.text}
                      </p>
                    )}

                    <p
                      className={`text-xs mt-2 font-medium ${
                        message.sender === "me"
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-in fade-in-0 duration-300">
                <div className="flex items-end space-x-3 max-w-xs lg:max-w-md">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    U
                  </div>
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
            <form
              onSubmit={handleSendMessage}
              className="flex items-end space-x-3 lg:space-x-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={handleImageUpload}
                className="text-gray-400 hover:text-emerald-600 transition p-2 lg:p-3 rounded-xl hover:bg-emerald-50 group"
              >
                📷
              </button>

              <div className="flex-1">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-sm lg:text-base"
                />
              </div>

              <button
                type="submit"
                className="px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-emerald-500/25 text-sm lg:text-base"
                disabled={!newMessage.trim()}
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
            <h3 className="text-lg lg:text-2xl font-bold text-gray-800 mb-2 lg:mb-3">
              Start a Conversation
            </h3>
            <p className="text-gray-600 text-sm lg:text-lg max-w-md mx-auto leading-relaxed">
              Select someone from the sidebar to begin chatting and connect instantly
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
)

}
