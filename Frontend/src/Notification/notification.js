// Notification utility functions
export class ChatNotifications {
  constructor() {
    this.permission = null
    this.audioContext = null
    this.notificationSound = null
    this.init()
  }

  async init() {
    // Request notification permission
    await this.requestPermission()
    // Initialize audio context for notification sounds
    this.initAudio()
  }

  async requestPermission() {
    if ("Notification" in window) {
      this.permission = await Notification.requestPermission()
      console.log("Notification permission:", this.permission)
    } else {
      console.log("This browser does not support notifications")
    }
  }

  initAudio() {
    try {
      // Create audio context for notification sound
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.createNotificationSound()
    } catch (error) {
      console.log("Audio context not supported:", error)
    }
  }

  createNotificationSound() {
    // Create a simple notification sound using Web Audio API
    const createBeep = (frequency = 800, duration = 200) => {
      if (!this.audioContext) return

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 1000)
    }

    this.notificationSound = createBeep
  }

  playNotificationSound() {
    if (this.notificationSound && this.audioContext) {
      try {
        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume()
        }
        this.notificationSound()
      } catch (error) {
        console.log("Error playing notification sound:", error)
      }
    }
  }

  showBrowserNotification(title, options = {}) {
    if (this.permission === "granted") {
      const notification = new Notification(title, {
        icon: "/favicon.ico", // Add your app icon here
        badge: "/favicon.ico",
        tag: "chat-message", // Prevents duplicate notifications
        requireInteraction: false,
        ...options,
      })

      // Auto close notification after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
        // You can add custom click handling here
        if (options.onClick) {
          options.onClick()
        }
      }

      return notification
    }
  }

  // Show notification for new message
  showMessageNotification(senderName, messageText, messageType = "text", conversationId) {
    let body = messageText
    let icon = "💬"

    // Customize notification based on message type
    switch (messageType) {
      case "image":
        body = "📷 Sent an image"
        icon = "📷"
        break
      case "document":
        body = "📄 Sent a document"
        icon = "📄"
        break
      default:
        // Truncate long messages
        if (messageText.length > 50) {
          body = messageText.substring(0, 50) + "..."
        }
    }

    this.showBrowserNotification(`${icon} ${senderName}`, {
      body: body,
      onClick: () => {
        // Focus on the conversation when notification is clicked
        if (window.focusConversation) {
          window.focusConversation(conversationId)
        }
      },
    })

    // Play notification sound
    this.playNotificationSound()
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.permission === "granted"
  }

  // Get current permission status
  getPermissionStatus() {
    return this.permission
  }
}

// Create singleton instance
export const chatNotifications = new ChatNotifications()
