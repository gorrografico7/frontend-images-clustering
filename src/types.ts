export interface SegmentRequest {
  image: string
  k: number
  use_manual: boolean
}

export interface Meta {
  k: number
  width: number
  height: number
  pixels: number
  time_ms: number
}

export interface SegmentResponse {
  segmented: string
  palette: string[]
  meta: Meta
}

export interface EstimateResponse {
  estimado_ms: number
  pixeles: number
  k: number
}
