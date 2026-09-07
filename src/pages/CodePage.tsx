import React, { useState } from 'react'

const FILES = [
  {
    id: 'main',
    name: 'main.py',
    desc: 'API FastAPI. Configura CORS, expone /health, /estimate y /segment, y elige la implementación de K-Means según use_manual.',
    code: `import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from calibration import calibrate, estimate_ms
from image_utils import decode_image, encode_image
from kmeans import run_kmeans
from kmeans_manual import run_kmeans_manual
from schemas import SegmentRequest, SegmentResponse, Meta

N_INIT = int(os.getenv("KMEANS_N_INIT", 10))

@asynccontextmanager
async def lifespan(app):
    calibrate(N_INIT)
    yield

app = FastAPI(title="API de Segmentación K-Means", lifespan=lifespan)

@app.get("/health")
def health():
    return {"estado": "ok"}

@app.get("/estimate")
def estimate(width: int, height: int, k: int = Query(ge=2, le=16)):
    return {"estimado_ms": estimate_ms(width, height, k)}

@app.post("/segment", response_model=SegmentResponse)
def segment(req: SegmentRequest):
    arr = decode_image(req.image)
    h, w = arr.shape[:2]
    fn = run_kmeans_manual if req.use_manual else run_kmeans
    result = fn(arr, req.k, N_INIT)
    return SegmentResponse(
        segmented=encode_image(result["segmented_array"]),
        palette=result["palette_hex"],
        meta=Meta(k=req.k, width=w, height=h,
                  pixels=w*h, time_ms=result["time_ms"]),
    )`,
  },
  {
    id: 'kmeans',
    name: 'kmeans.py',
    desc: 'Lógica pura usando scikit-learn. Recibe un array NumPy, corre KMeans y devuelve la imagen segmentada + paleta hex.',
    code: `import time
import numpy as np
from sklearn.cluster import KMeans


def run_kmeans(arr: np.ndarray, k: int, n_init: int = 10) -> dict:
    h, w = arr.shape[:2]
    pixels = arr.reshape(-1, 3).astype(np.float32)

    t0 = time.perf_counter()
    km = KMeans(n_clusters=k, n_init=n_init, random_state=42)
    km.fit(pixels)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    centers = km.cluster_centers_.astype(np.uint8)
    segmented = centers[km.labels_].reshape(h, w, 3)

    return {
        "segmented_array": segmented,
        "palette_hex": _centers_to_hex(centers),
        "time_ms": elapsed_ms,
    }


def _centers_to_hex(centers: np.ndarray) -> list[str]:
    return [
        "#{:02x}{:02x}{:02x}".format(int(r), int(g), int(b))
        for r, g, b in centers
    ]`,
  },
  {
    id: 'manual',
    name: 'kmeans_manual.py',
    desc: 'Misma lógica implementada con NumPy puro, sin sklearn. Muestra el algoritmo desde cero: inicialización, asignación y actualización iterativa.',
    code: `import time
import numpy as np


def run_kmeans_manual(arr: np.ndarray, k: int, max_iter: int = 100) -> dict:
    h, w = arr.shape[:2]
    pixels = arr.reshape(-1, 3).astype(np.float32)
    n = len(pixels)

    # inicializar centroides desde colores únicos
    rng = np.random.default_rng(42)
    unique = np.unique(pixels.astype(np.uint8), axis=0).astype(np.float32)
    centers = unique[rng.choice(len(unique), size=k, replace=False)].copy()

    labels = np.zeros(n, dtype=np.int32)
    dists = np.empty((n, k), dtype=np.float32)

    t0 = time.perf_counter()
    for _ in range(max_iter):
        # distancia euclídea al cuadrado a cada centroide
        for i in range(k):
            diff = pixels - centers[i]
            dists[:, i] = (diff * diff).sum(axis=1)

        new_labels = np.argmin(dists, axis=1)

        # recalcular centroides como media de los píxeles asignados
        new_centers = np.array([
            pixels[new_labels == i].mean(axis=0)
            if (new_labels == i).any() else centers[i]
            for i in range(k)
        ])

        if np.array_equal(new_labels, labels):
            break
        labels, centers = new_labels, new_centers

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    centers_u8 = centers.astype(np.uint8)
    return {
        "segmented_array": centers_u8[labels].reshape(h, w, 3),
        "palette_hex": _centers_to_hex(centers_u8),
        "time_ms": elapsed_ms,
    }`,
  },
  {
    id: 'utils',
    name: 'image_utils.py',
    desc: 'Todo el I/O de imagen. Decode de base64 (stripea el prefijo data URI), encode a PNG base64. Sin lógica de algoritmo.',
    code: `import base64
import io
import numpy as np
from PIL import Image


def decode_image(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return np.array(img)


def encode_image(arr: np.ndarray) -> str:
    img = Image.fromarray(arr.astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")`,
  },
  {
    id: 'schemas',
    name: 'schemas.py',
    desc: 'Contratos Pydantic. Valida que k esté entre 2 y 16 antes de que el request llegue al endpoint.',
    code: `from pydantic import BaseModel, Field


class SegmentRequest(BaseModel):
    image: str
    k: int = Field(ge=2, le=16)
    use_manual: bool = False


class Meta(BaseModel):
    k: int
    width: int
    height: int
    pixels: int
    time_ms: int


class SegmentResponse(BaseModel):
    segmented: str
    palette: list[str]
    meta: Meta`,
  },
  {
    id: 'calib',
    name: 'calibration.py',
    desc: 'Mide la velocidad real de K-Means en esta máquina al arrancar el servidor. Permite estimar el tiempo antes de procesar.',
    code: `import numpy as np
from kmeans import run_kmeans

_MS_PER_PIXEL_PER_K: float = 0.0


def calibrate(n_init: int) -> None:
    global _MS_PER_PIXEL_PER_K
    arr = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = run_kmeans(arr, k=4, n_init=n_init)
    _MS_PER_PIXEL_PER_K = result["time_ms"] / (100 * 100 * 4)


def estimate_ms(width: int, height: int, k: int) -> int:
    return max(1, int(width * height * k * _MS_PER_PIXEL_PER_K))`,
  },
]

const KW = new Set(['import','from','def','class','return','if','else','elif','for','in',
  'while','not','and','or','global','async','await','with','as','None','True','False'])

function tokenizeLine(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let buf = ''
  let i = 0

  const flush = () => { if (buf) { out.push(buf); buf = '' } }

  while (i < line.length) {
    if (line[i] === '#') {
      flush()
      out.push(<span key={i} className="text-zinc-500 italic">{line.slice(i)}</span>)
      return out
    }
    if (line[i] === '"' || line[i] === "'") {
      flush()
      const q = line[i]; let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++ }
      j++
      out.push(<span key={i} className="text-green-400">{line.slice(i, j)}</span>)
      i = j; continue
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      flush()
      const m = line.slice(i).match(/^[a-zA-Z_]\w*/)![0]
      const isPrecededByNonWord = i === 0 || /\W/.test(line[i - 1])
      if (KW.has(m) && isPrecededByNonWord) {
        out.push(<span key={i} className="text-purple-400">{m}</span>)
      } else {
        out.push(m)
      }
      i += m.length; continue
    }
    if (/\d/.test(line[i]) && (i === 0 || /\W/.test(line[i - 1]))) {
      flush()
      const m = line.slice(i).match(/^\d+/)![0]
      out.push(<span key={i} className="text-amber-400">{m}</span>)
      i += m.length; continue
    }
    buf += line[i]; i++
  }
  flush()
  return out
}

export function CodePage() {
  const [activeId, setActiveId] = useState('kmeans')
  const active = FILES.find(f => f.id === activeId)!

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex border border-zinc-800 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 100px)' }}>
        <div className="w-48 bg-zinc-950 border-r border-zinc-800 flex-shrink-0">
          <p className="text-xs text-zinc-600 uppercase tracking-widest px-4 pt-4 pb-2">backend/</p>
          {FILES.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 border-l-2 transition-colors ${
                f.id === activeId
                  ? 'border-blue-500 bg-blue-950/30 text-blue-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
            <span className="text-zinc-600 text-xs">backend /</span>
            <span className="text-xs font-medium text-zinc-200">{active.name}</span>
          </div>

          <div className="px-4 py-3 border-b border-zinc-800 bg-blue-950/20">
            <p className="text-xs text-zinc-400 leading-relaxed">{active.desc}</p>
          </div>

          <div className="flex-1 overflow-auto bg-zinc-950 p-4">
            <pre className="text-xs leading-relaxed font-mono">
              {active.code.split('\n').map((line, i) => (
                <div key={i} className="flex gap-4 hover:bg-zinc-900/50 px-1 rounded">
                  <span className="text-zinc-700 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
                  <span>{line ? tokenizeLine(line) : ' '}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
