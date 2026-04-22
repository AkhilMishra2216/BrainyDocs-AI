import { MessageSquare } from 'lucide-react'

export default function HistoryView() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Chat History</h2>
      <div className="glass p-8 flex flex-col items-center justify-center rounded-2xl text-text-muted">
        <MessageSquare size={32} className="mb-4 opacity-50" />
        <p>Chat history persistence is now active!</p>
        <p className="text-xs mt-2">Past conversations are automatically loaded into your Workspace window.</p>
      </div>
    </div>
  )
}
