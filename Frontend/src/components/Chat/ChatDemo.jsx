import ModernChatApp from './ModernChatApp'

export default function ChatDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WhatsApp-like Chat System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A modern chat application with real-time messaging, voice messages, 
            file sharing, emoji reactions, and more features similar to WhatsApp.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <ModernChatApp />
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Features Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time Messaging</h3>
              <p className="text-gray-600 text-sm">
                Instant message delivery with typing indicators and read receipts
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🎤</div>
              <h3 className="font-semibold text-gray-800 mb-2">Voice Messages</h3>
              <p className="text-gray-600 text-sm">
                Record and send voice messages with audio playback
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">📎</div>
              <h3 className="font-semibold text-gray-800 mb-2">File Sharing</h3>
              <p className="text-gray-600 text-sm">
                Share images, documents, and other files easily
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">😊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Emoji Reactions</h3>
              <p className="text-gray-600 text-sm">
                React to messages with emojis and reply to specific messages
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-semibold text-gray-800 mb-2">Notifications</h3>
              <p className="text-gray-600 text-sm">
                Browser notifications for new messages when app is not focused
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-gray-800 mb-2">Modern UI</h3>
              <p className="text-gray-600 text-sm">
                Beautiful, responsive design with smooth animations
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How to Use
          </h2>
          <div className="max-w-2xl mx-auto text-left bg-white p-6 rounded-lg shadow-md">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Enter your username/email in the search box to connect</li>
              <li>Click "Chat" to start a conversation with that user</li>
              <li>Type messages and press Enter or click the send button</li>
              <li>Use the microphone button to record voice messages</li>
              <li>Click the paperclip to attach files</li>
              <li>Use the emoji button to add emojis to your messages</li>
              <li>Hover over messages to see reaction and reply options</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}