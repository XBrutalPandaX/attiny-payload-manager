import React from 'react'
import { PRESETS, PRESET_CATS } from '../constants/presets'

export default function PresetsView({ presetCat, setPresetCat, loadPreset }) {
    const cats = [...new Set(PRESETS.map(p => p.cat))]
    const visibleCats = presetCat === 'all' ? cats : cats.filter(c => c === presetCat)

    return (
        <div className="presets-panel">
            <div className="cat-filter">
                {PRESET_CATS.map(c => (
                    <span
                        key={c}
                        className={`cf-item ${presetCat === c ? 'cf-active' : ''}`}
                        onClick={() => setPresetCat(c)}
                    >
                        {c}
                    </span>
                ))}
            </div>

            <div className="pl-col-head">
                <span className="plh-name">name</span>
                <span className="plh-bin">bin</span>
                <span className="plh-via">via</span>
                <span className="plh-desc">description</span>
            </div>

            <div className="presets-list">
                {visibleCats.map(cat => (
                    <div key={cat} className="preset-group">
                        <div className="pg-head">
                            <span className="pg-cat">{cat.toUpperCase()}</span>
                        </div>
                        {PRESETS.filter(p => p.cat === cat).map((p, i) => (
                            <div key={i} className="preset-row" onClick={() => loadPreset(p)} title={p.desc}>
                                <span className="pr-name">{p.name}</span>
                                <span className="pr-bin">{p.bin}</span>
                                <span className="pr-via">{p.trigger}</span>
                                <span className="pr-desc">{p.desc}</span>
                                <span className="pr-arrow">»</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}