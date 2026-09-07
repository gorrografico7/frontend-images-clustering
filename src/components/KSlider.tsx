interface Props {
  value: number
  onChange: (k: number) => void
}

export function KSlider({ value, onChange }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-zinc-400">Clusters (K)</span>
        <span className="text-lg font-semibold tabular-nums">{value}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-600">2</span>
        <input
          type="range"
          min={2}
          max={16}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-500"
        />
        <span className="text-xs text-zinc-600">16</span>
      </div>
    </div>
  )
}
