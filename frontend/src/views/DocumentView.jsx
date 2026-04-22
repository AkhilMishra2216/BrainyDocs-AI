import { FileText, Trash2 } from 'lucide-react'

export default function DocumentView({ documents, onDeleteDocument }) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Document Library</h2>
      {documents.length === 0 ? (
        <p className="text-text-muted">No documents uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-none">
          {documents.map(doc => (
            <div key={doc.file_id} className="glass p-5 rounded-2xl flex flex-col items-start relative group">
              <FileText size={24} className="text-accent-light mb-3" />
              <h3 className="text-sm font-semibold text-text-primary truncate w-full">{doc.filename}</h3>
              <p className="text-xs text-text-muted mt-1">{doc.chunks} chunks • {(doc.characters / 1024).toFixed(1)} KB</p>
              
              <button 
                onClick={() => onDeleteDocument(doc.file_id)}
                className="absolute top-3 right-3 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                title="Delete Document"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
