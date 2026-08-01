import React from 'react'
import { getClass } from '../utils/logHelpers'

export default function ConsoleView({
    logs, endRef, cmd, setCmd, handleCmdKey, requestPreview,
    regCmd, setRegCmd, handleRegKey
}) {
    return (
        <>
            <div className="log-window">
                <div className="log-content">
                    {logs.map((l, i) => {
                        if (l.type === 'separator') {
                            const meta = [l.bin, l.trigger].filter(Boolean).join(' / ')
                            return (
                                <div key={i} className="session-head">
                                    <span className="sh-time">[{l.time}]</span>
                                    <span className="sh-meta">{meta}</span>
                                    <span className="sh-cmd">{l.msg}</span>
                                </div>
                            )
                        }
                        return (
                            <pre key={i} className={`log-line ${getClass(l.type)}`}>
                                {l.msg}
                                {l.count > 1 && <span className="log-repeat"> ×{l.count}</span>}
                            </pre>
                        )
                    })}
                    <div ref={endRef} />
                </div>
            </div>

            <div className="console-row main-row">
                <span className="prompt">$</span>
                <input
                    className="cin" value={cmd}
                    onChange={e => setCmd(e.target.value)}
                    onKeyDown={handleCmdKey}
                    placeholder="command — ↑↓ history — ↵ run"
                    autoFocus autoComplete="off" spellCheck="false"
                />
                <button className="cin-btn" onClick={requestPreview} title="preview generated .ino">.ino</button>
            </div>

            <div className="console-row reg-row">
                <span className="prompt dim-prompt">reg$</span>
                <input
                    className="cin" value={regCmd}
                    onChange={e => setRegCmd(e.target.value)}
                    onKeyDown={handleRegKey}
                    placeholder='-p "HKCU\..." -k "Key" -string "Value" — ↵ run'
                    autoComplete="off" spellCheck="false"
                />
            </div>
        </>
    )
}