import { useCameraCapture } from '../hooks/useCameraCapture'

interface Props {
  onCapture: (dataUrl: string, width: number, height: number) => void
}

export function CameraView({ onCapture }: Props) {
  const { videoRef, canvasRef, active, cameraError, start, capture, stop } = useCameraCapture()

  function handleCapture() {
    const result = capture()
    if (result) onCapture(result.dataUrl, result.width, result.height)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      <span className="text-sm text-zinc-400">Captura</span>

      <div className="relative bg-zinc-950 rounded-lg overflow-hidden" style={{ height: 220 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay muted playsInline
          style={{ display: active ? 'block' : 'none' }}
        />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="text-xs">Cámara inactiva</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {cameraError && (
        <p className="text-xs text-red-400 leading-relaxed">{cameraError}</p>
      )}

      <div className="flex gap-2">
        {!active ? (
          <button
            onClick={start}
            className="flex-1 py-2 text-sm border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Activar cámara
          </button>
        ) : (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
            >
              Tomar foto
            </button>
            <button
              onClick={stop}
              className="px-3 py-2 text-sm border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
