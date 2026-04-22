import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import RightPanel from './components/RightPanel'
import UploadModal from './components/UploadModal'
import DocumentView from './views/DocumentView'
import HistoryView from './views/HistoryView'
import LoginView from './views/LoginView'

function App() {
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [sources, setSources] = useState([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [showLoginView, setShowLoginView] = useState(false)
  const [user, setUser] = useState(null)
  const [eli5Mode, setEli5Mode] = useState(false)
  const [deepMode, setDeepMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeNav, setActiveNav] = useState('workspace')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    let storedSession = localStorage.getItem('brainydocs_session_id')
    if (!storedSession) {
      storedSession = crypto.randomUUID()
      localStorage.setItem('brainydocs_session_id', storedSession)
    }
    setSessionId(storedSession)

    // Fetch auth status
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null));

    // Fetch documents on load
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        if (data.documents) {
          setDocuments(data.documents)
        }
      })
      .catch(err => console.error("Failed to fetch documents:", err))
  }, [])

  useEffect(() => {
    if (!sessionId) return
    
    // Fetch chat history for this session
    fetch(`/api/chat/history/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages)
        }
      })
      .catch(err => console.error("Failed to fetch chat history:", err))
  }, [sessionId])

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
        body: JSON.stringify({ query, session_id: sessionId, mode: currentMode }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      const aiMsgId = Date.now()
      setMessages((prev) => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        sources: [],
        timestamp: new Date(),
      }])
      setIsLoading(false)

      let streamDone = false
      let buffer = ''

      while (!streamDone) {
        const { value, done } = await reader.read()
        streamDone = done
        if (value) {
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            // keep the last chunk in the buffer if it doesn't end with \n\n
            buffer = lines.pop() || ''
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim()
                    if (!dataStr) continue
                    try {
                        const parsed = JSON.parse(dataStr)
                        if (parsed.type === 'sources') {
                             setSources(parsed.data)
                             setMessages(prev => prev.map(msg => 
                                 msg.id === aiMsgId ? { ...msg, sources: parsed.data } : msg
                             ))
                        } else if (parsed.type === 'chunk') {
                             setMessages(prev => prev.map(msg => 
                                 msg.id === aiMsgId ? { ...msg, content: msg.content + parsed.data } : msg
                             ))
                        } else if (parsed.type === 'done') {
                             streamDone = true
                        }
                    } catch (e) {
                      console.error('Error parsing SSE', e)
                    }
                }
            }
        }
      }
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the backend. Please make sure the server is running.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (doc) => {
    setDocuments((prev) => [...prev, doc])
  }

  const handleDeleteDocument = async (fileId) => {
    try {
      const res = await fetch(`/api/documents/${fileId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.file_id !== fileId))
      }
    } catch (err) {
      console.error("Failed to delete document:", err)
    }
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setShowLoginView(false)
  }

  if (showLoginView) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Left Sidebar */}
      <Sidebar
        documents={documents}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onUploadClick={() => {
          if (user) setIsUploadOpen(true)
          else setShowLoginView(true)
        }}
        user={user}
        onLoginClick={() => setShowLoginView(true)}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* Main Area Router */}
      {activeNav === 'workspace' && (
        <ChatWindow
          messages={messages}
          onSend={handleSendMessage}
          isLoading={isLoading}
          hasDocuments={documents.length > 0}
        />
      )}
      {activeNav === 'documents' && <DocumentView documents={documents} onDeleteDocument={handleDeleteDocument} />}
      {activeNav === 'chat' && <HistoryView />}

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
    </div>
  )
}

export default App
