import type { SegmentRequest, SegmentResponse, EstimateResponse } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function postSegment(req: SegmentRequest): Promise<SegmentResponse> {
  const res = await fetch(`${BASE}/segment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Error ${res.status}`)
  }
  return res.json()
}

export async function getEstimate(
  width: number,
  height: number,
  k: number
): Promise<EstimateResponse> {
  const res = await fetch(`${BASE}/estimate?width=${width}&height=${height}&k=${k}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
