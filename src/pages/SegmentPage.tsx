import { useState } from 'react'
import { CameraView } from '../components/CameraView'
import { KSlider } from '../components/KSlider'
import { ProcessingView } from '../components/ProcessingView'
import { ResultView } from '../components/ResultView'
import { postSegment, getEstimate } from '../api/segment'
import type { SegmentResponse } from '../types'

type Step = 'camera' | 'preview' | 'processing' | 'result'

export function SegmentPage() {
  const [step, setStep] = useState<Step>('camera')
  const [k, setK] = useState(4)
  const [useManual, setUseManual] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [captureSize, setCaptureSize] = useState<{ w: number; h: number } | null>(null)
  const [estimatedMs, setEstimatedMs] = useState(0)
  const [result, setResult] = useState<SegmentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleCapture(dataUrl: string, width: number, height: number) {
    setOriginalImage(dataUrl)
    setCaptureSize({ w: width, h: height })
    setError(null)
    setStep('preview')
  }

  async function handleConfirm() {
    if (!originalImage || !captureSize) return

    try {
      const est = await getEstimate(captureSize.w, captureSize.h, k)
      setEstimatedMs(est.estimado_ms)
    } catch {
      setEstimatedMs(0)
    }

    setStep('processing')

    try {
      const base64 = originalImage.split(',')[1]
      const res = await postSegment({ image: base64, k, use_manual: useManual })
      setResult(res)
      setStep('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setStep('preview')
    }
  }

  function handleReset() {
    setStep('camera')
    setOriginalImage(null)
    setCaptureSize(null)
    setResult(null)
    setError(null)
    setEstimatedMs(0)
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5 p-5 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <CameraView onCapture={handleCapture} />
        <KSlider value={k} onChange={setK} />

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Implementación manual</p>
              <p className="text-xs text-zinc-500 mt-0.5">NumPy puro sin sklearn</p>
            </div>
            <button
              onClick={() => setUseManual(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${useManual ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${useManual ? 'left-5' : 'left-0.5'}`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 min-h-64">
        {step === 'camera' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600 py-16">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M4.5 7.5h.008v.008H4.5V7.5zm0 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <p className="text-sm">Activá la cámara y tomá una foto para segmentar</p>
          </div>
        )}

        {step === 'preview' && originalImage && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-400">Vista previa — confirmá antes de segmentar</p>
            <img
              src={originalImage}
              alt="Vista previa"
              className="w-full rounded-xl border border-zinc-700 object-contain max-h-96"
            />
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
              >
                Segmentar con K = {k}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-sm border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Retomar foto
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>
        )}

        {step === 'processing' && <ProcessingView estimatedMs={estimatedMs} />}

        {step === 'result' && result && originalImage && (
          <ResultView original={originalImage} result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
