import { useState } from 'react'
import type { SegmentResponse } from '../types'

interface Props {
  original: string
  result: SegmentResponse
  onReset: () => void
}

export function ResultView({ original, result, onReset }: Props) {
  const { segmented, palette, meta } = result
  const [lightbox, setLightbox] = useState<string | null>(null)

  function handleDownload() {
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${segmented}`
    a.download = `segmentada_k${meta.k}.png`
    a.click()
  }

  return (
    <>
    {lightbox && (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        onClick={() => setLightbox(null)}
      >
        <img
          src={lightbox}
          alt="Vista ampliada"
          className="max-w-full max-h-full rounded-xl object-contain"
          onClick={e => e.stopPropagation()}
        />
        <button
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl leading-none"
          onClick={() => setLightbox(null)}
        >✕</button>
      </div>
    )}

    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500 mb-2">Original</p>
          <img
            src={original}
            alt="Original"
            className="w-full rounded-lg border border-zinc-800 cursor-zoom-in"
            onClick={() => setLightbox(original)}
          />
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
            Segmentada
            <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full">k = {meta.k}</span>
          </p>
          <img
            src={`data:image/png;base64,${segmented}`}
            alt="Segmentada"
            className="w-full rounded-lg border border-zinc-800 cursor-zoom-in"
            onClick={() => setLightbox(`data:image/png;base64,${segmented}`)}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-3">Paleta detectada</p>
        <div className="flex flex-wrap gap-3">
          {palette.map(hex => (
            <div key={hex} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-md border border-zinc-700"
                style={{ background: hex }}
              />
              <span className="text-xs text-zinc-500 font-mono">{hex}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'K', value: meta.k },
          { label: 'Resolución', value: `${meta.width}×${meta.height}` },
          { label: 'Píxeles', value: meta.pixels.toLocaleString() },
          { label: 'Tiempo', value: meta.time_ms < 1000 ? `${meta.time_ms} ms` : `${(meta.time_ms / 1000).toFixed(1)} s` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-base font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 py-2.5 text-sm border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Descargar PNG
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-2.5 text-sm border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Nueva foto
        </button>
      </div>
    </div>
    </>
  )
}
