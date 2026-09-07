import { useEffect, useState } from 'react'

interface Props {
  estimatedMs: number
}

export function ProcessingView({ estimatedMs }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 50)
    return () => clearInterval(id)
  }, [])

  const progress = estimatedMs > 0
    ? Math.min(95, Math.round((elapsed / estimatedMs) * 100))
    : null

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-sm font-medium">Procesando imagen...</p>
        {estimatedMs > 0 && (
          <p className="text-xs text-zinc-500 mt-1">
            ~{estimatedMs < 1000
              ? `${estimatedMs} ms`
              : `${(estimatedMs / 1000).toFixed(1)} s`} estimados
          </p>
        )}
      </div>

      {progress !== null && (
        <div className="w-64">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 text-right mt-1">{progress}%</p>
        </div>
      )}
    </div>
  )
}
