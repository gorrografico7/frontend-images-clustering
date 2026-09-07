import { useState } from 'react'
import { SegmentPage } from './pages/SegmentPage'
import { CodePage } from './pages/CodePage'

type Page = 'segment' | 'code'

export default function App() {
  const [page, setPage] = useState<Page>('segment')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto flex items-center gap-1 px-5 py-0">
          <span className="text-sm font-semibold text-zinc-300 mr-4 py-3">Images Clustering</span>
          {([
            { id: 'segment', label: 'Segmentar' },
            { id: 'code',    label: 'Código fuente' },
          ] as { id: Page; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className={`px-4 py-3 text-sm border-b-2 transition-colors ${
                page === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1">
        {page === 'segment' ? <SegmentPage /> : <CodePage />}
      </div>

      <footer className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-5 py-4 flex flex-col items-center gap-0.5 text-zinc-600 text-xs text-center">
          <span>Tomas Correa Zea &amp; Cristian Alejandro Morales</span>
          <span>Electiva II — 190202022-2</span>
        </div>
      </footer>
    </div>
  )
}
