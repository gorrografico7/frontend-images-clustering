import { useRef, useState, useCallback } from 'react'

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const start = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
    } catch (err) {
      const msg = err instanceof Error ? err.name : 'Error'
      if (msg === 'NotReadableError') {
        setCameraError('La cámara está en uso por otra aplicación. Cerrá Teams, Zoom u otras pestañas que la estén usando.')
      } else if (msg === 'NotAllowedError') {
        setCameraError('Permiso de cámara denegado. Habilitalo desde el candado en la barra del browser.')
      } else {
        setCameraError('No se pudo acceder a la cámara.')
      }
    }
  }, [])

  const capture = useCallback((): { dataUrl: string; width: number; height: number } | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setActive(false)
    return { dataUrl, width: canvas.width, height: canvas.height }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  return { videoRef, canvasRef, active, cameraError, start, capture, stop }
}
