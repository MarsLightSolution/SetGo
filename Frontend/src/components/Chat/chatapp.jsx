"use client"

import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"

export default function ChatApp() {
  const [currentUser, setCurrentUser] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState(null)
  const [searchUsername, setSearchUsername] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Connect user using existing username
  const handleConnect = async () => {
    const storedUserId = localStorage.getItem("userName")

    try {
      const response = await fetch("http://localhost:8080/api/chat/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: storedUserId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCurrentUser(data.user)
        setIsConnected(true)
        initializeSocket(data.user)
        fetchConversations(data.user.userId)
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Connection error:", error)
      alert("Failed to connect")
    }
  }

  // Initialize Socket.IO
  const initializeSocket = (user) => {
    const newSocket = io("http://localhost:8080", {
      withCredentials: true,
    })

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO")
      newSocket.emit("join-user", user.userId) // user.userId is the username
    })

    newSocket.on("new-message", (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, data.message])
      }
      // Update conversation list
      fetchConversations(user.userId)
    })

    newSocket.on("user-typing", (data) => {
      setIsTyping(data.isTyping)
      if (data.isTyping) {
        setTimeout(() => setIsTyping(false), 3000)
      }
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO")
    })

    setSocket(newSocket)
  }

  // Fetch conversations
  const fetchConversations = async (username) => {
    try {
      const response = await fetch(`http://localhost:8080/api/chat/conversations/${username}`)
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  // Start conversation with user
  const startConversation = async (targetUsername) => {
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

        // Join conversation room
        if (socket) {
          socket.emit("join-conversation", data.conversation._id)
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  // Select conversation
  const selectConversation = async (conversation) => {
    // Leave previous conversation room
    if (selectedConversation && socket) {
      socket.emit("leave-conversation", selectedConversation._id)
    }

    setSelectedConversation(conversation)

    // Join new conversation room
    if (socket) {
      socket.emit("join-conversation", conversation._id)
    }

    try {
      const response = await fetch(`http://localhost:8080/api/chat/messages/${conversation._id}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch("http://localhost:8080/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderId: currentUser.userId, // This is the username
          text: newMessage.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Handle typing indicator
  const handleTyping = () => {
    if (socket && selectedConversation) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        isTyping: true,
        userName: currentUser.userName,
      })
    }
  }

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      backgroundColor: "#f3f4f6",
      fontFamily: "Arial, sans-serif",
    },
    loginContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      backgroundColor: "white",
      padding: "40px",
    },
    loginForm: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      width: "300px",
    },
    input: {
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
    },
    button: {
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      padding: "12px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
    sidebar: {
      width: "33.333333%",
      backgroundColor: "white",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
    },
    sidebarHeader: {
      padding: "16px",
      borderBottom: "1px solid #e5e7eb",
    },
    sidebarTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#1f2937",
      margin: "0 0 8px 0",
    },
    userInfo: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "16px",
    },
    searchContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "16px",
    },
    searchInput: {
      flex: 1,
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "12px",
    },
    searchButton: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
    },
    conversationsList: {
      flex: 1,
      overflowY: "auto",
    },
    conversationItem: {
      display: "flex",
      alignItems: "center",
      padding: "16px",
      cursor: "pointer",
      borderBottom: "1px solid #f3f4f6",
      transition: "background-color 0.2s",
    },
    conversationItemSelected: {
      backgroundColor: "#dbeafe",
    },
    avatar: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      marginRight: "12px",
      backgroundColor: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
    },
    conversationContent: {
      flex: 1,
      minWidth: 0,
    },
    conversationName: {
      fontWeight: "500",
      color: "#111827",
      fontSize: "16px",
      margin: "0 0 4px 0",
    },
    conversationMessage: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    chatArea: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    chatHeader: {
      backgroundColor: "white",
      borderBottom: "1px solid #e5e7eb",
      padding: "16px",
      display: "flex",
      alignItems: "center",
    },
    chatAvatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      marginRight: "12px",
      backgroundColor: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: "600",
      color: "#374151",
    },
    chatHeaderName: {
      fontWeight: "500",
      color: "#111827",
      margin: "0 0 4px 0",
    },
    chatHeaderStatus: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
    },
    messagesArea: {
      flex: 1,
      overflowY: "auto",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    messageContainer: {
      display: "flex",
    },
    messageContainerUser: {
      justifyContent: "flex-end",
    },
    messageContainerOther: {
      justifyContent: "flex-start",
    },
    messageAvatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      marginRight: "8px",
      marginTop: "4px",
      backgroundColor: "#d1d5db",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      color: "#374151",
    },
    messageBubble: {
      maxWidth: "320px",
      padding: "12px 16px",
      borderRadius: "8px",
    },
    messageBubbleUser: {
      backgroundColor: "#22c55e",
      color: "white",
    },
    messageBubbleOther: {
      backgroundColor: "#e5e7eb",
      color: "#1f2937",
    },
    messageText: {
      fontSize: "14px",
      margin: "0 0 4px 0",
      lineHeight: "1.4",
    },
    messageTime: {
      fontSize: "12px",
      opacity: 0.8,
    },
    typingIndicator: {
      fontSize: "12px",
      color: "#6b7280",
      fontStyle: "italic",
      padding: "8px 16px",
    },
    inputArea: {
      backgroundColor: "white",
      borderTop: "1px solid #e5e7eb",
      padding: "16px",
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    messageInput: {
      flex: 1,
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
    },
    sendButton: {
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      padding: "12px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
    },
    emptyState: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#6b7280",
      fontSize: "16px",
    },
    onlineIndicator: {
      width: "12px",
      height: "12px",
      backgroundColor: "#10b981",
      borderRadius: "50%",
      border: "2px solid white",
      position: "absolute",
      bottom: "2px",
      right: "2px",
    },
    avatarContainer: {
      position: "relative",
      display: "inline-block",
    },
  }

  // Login Screen
  if (!isConnected) {
    return (
      <div style={styles.loginContainer}>
        <h1 style={{ marginBottom: "32px", color: "#1f2937" }}>Connect to Chat</h1>
        <div style={styles.loginForm}>
          <button style={styles.button} onClick={handleConnect}>
            Connect to Chat
          </button>
          <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
            Using stored user credentials from localStorage
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Chat App</h2>
          <div style={styles.userInfo}>
            Logged in as: <strong>{currentUser?.userName}</strong> (@{currentUser?.userId})
          </div>

          <div style={styles.searchContainer}>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Enter Username to chat"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            <button
              style={styles.searchButton}
              onClick={() => {
                if (searchUsername.trim()) {
                  startConversation(searchUsername.trim())
                  setSearchUsername("")
                }
              }}
            >
              Start Chat
            </button>
          </div>
        </div>

        <div style={styles.conversationsList}>
          {conversations.map((conversation) => {
            const otherUser = conversation.participants.find((p) => p.userId !== currentUser.userId)
            return (
              <div
                key={conversation._id}
                style={{
                  ...styles.conversationItem,
                  ...(selectedConversation?._id === conversation._id ? styles.conversationItemSelected : {}),
                }}
                onClick={() => selectConversation(conversation)}
                onMouseEnter={(e) => {
                  if (selectedConversation?._id !== conversation._id) {
                    e.currentTarget.style.backgroundColor = "#f9fafb"
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?._id !== conversation._id) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <div style={styles.avatarContainer}>
                  <div style={styles.avatar}>{otherUser?.userName?.[0] || "?"}</div>
                  {otherUser?.isOnline && <div style={styles.onlineIndicator}></div>}
                </div>
                <div style={styles.conversationContent}>
                  <h3 style={styles.conversationName}>
                    {otherUser?.userName || "Unknown"} (@{otherUser?.userId || "Unknown"})
                  </h3>
                  <p style={styles.conversationMessage}>{conversation.lastMessage || "No messages yet"}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={styles.avatarContainer}>
                <div style={styles.chatAvatar}>
                  {selectedConversation.participants.find((p) => p.userId !== currentUser.userId)?.userName?.[0] || "?"}
                </div>
                {selectedConversation.participants.find((p) => p.userId !== currentUser.userId)?.isOnline && (
                  <div style={styles.onlineIndicator}></div>
                )}
              </div>
              <div>
                <h3 style={styles.chatHeaderName}>
                  {selectedConversation.participants.find((p) => p.userId !== currentUser.userId)?.userName ||
                    "Unknown"}
                </h3>
                <p style={styles.chatHeaderStatus}>
                  @{selectedConversation.participants.find((p) => p.userId !== currentUser.userId)?.userId || "Unknown"}
                  {selectedConversation.participants.find((p) => p.userId !== currentUser.userId)?.isOnline && (
                    <span style={{ color: "#10b981", marginLeft: "8px" }}>● Online</span>
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
              {messages.map((message) => (
                <div
                  key={message._id}
                  style={{
                    ...styles.messageContainer,
                    ...(message.senderId === currentUser.userId
                      ? styles.messageContainerUser
                      : styles.messageContainerOther),
                  }}
                >
                  {message.senderId !== currentUser.userId && (
                    <div style={styles.messageAvatar}>
                      {selectedConversation.participants.find((p) => p.userId === message.senderId)?.userName?.[0] ||
                        "?"}
                    </div>
                  )}
                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(message.senderId === currentUser.userId
                        ? styles.messageBubbleUser
                        : styles.messageBubbleOther),
                    }}
                  >
                    <p style={styles.messageText}>{message.text}</p>
                    <p style={styles.messageTime}>{new Date(message.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {isTyping && <div style={styles.typingIndicator}>Someone is typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputArea}>
              <div style={styles.inputContainer}>
                <input
                  style={styles.messageInput}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleTyping}
                  placeholder="Type a message..."
                />
                <button onClick={handleSendMessage} style={styles.sendButton}>
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>Select a conversation or start a new chat</div>
        )}
      </div>
    </div>
  )
}
