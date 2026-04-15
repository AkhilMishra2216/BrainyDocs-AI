import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import RightPanel from './components/RightPanel'
import UploadModal from './components/UploadModal'
import LoginModal from './components/LoginModal'

function App() {
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [sources, setSources] = useState([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [eli5Mode, setEli5Mode] = useState(false)
  const [deepMode, setDeepMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeNav, setActiveNav] = useState('workspace')

  const currentMode = deepMode ? 'deep' : eli5Mode ? 'eli5' : 'normal'

  const handleSendMessage = async (query) => {
    if (!query.trim()) return

    const userMsg = { role: 'user', content: query, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, session_id: 'default', mode: currentMode }),
      })
      const data = await res.json()
      const aiMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
      setSources(data.sources || [])
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the backend. Please make sure the server is running.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (doc) => {
    setDocuments((prev) => [...prev, doc])
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    setIsLoginOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Left Sidebar */}
      <Sidebar
        documents={documents}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onUploadClick={() => setIsUploadOpen(true)}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setIsLoginOpen(true)}
      />

      {/* Main Chat Area */}
      <ChatWindow
        messages={messages}
        onSend={handleSendMessage}
        isLoading={isLoading}
        hasDocuments={documents.length > 0}
      />

      {/* Right Panel */}
      <RightPanel
        eli5Mode={eli5Mode}
        deepMode={deepMode}
        onEli5Toggle={() => { setEli5Mode(!eli5Mode); if (!eli5Mode) setDeepMode(false) }}
        onDeepToggle={() => { setDeepMode(!deepMode); if (!deepMode) setEli5Mode(false) }}
        sources={sources}
      />

      {/* Modals */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  )
}

export default App
