import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io } from "socket.io-client";

import TitleBar from './components/TitleBar'
import Toolbar from './components/Toolbar'
import ConsoleView from './components/ConsoleView'
import PresetsView from './components/PresetsView'
import { SKETCH_TEMPLATE } from './constants/options'
import { inferType } from './utils/logHelpers'
import './App.css'


// Vite exposes environment variables via import.meta.env
const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000')

export default function App() {
    const [mode, setMode] = useState('console')
    const [minimized, setMinimized] = useState(false)
    const [isFullscr, setIsFullscr] = useState(false)
    const [theme, setTheme] = useState(() => localStorage.getItem('bum_theme') || 'dark')
    const [connected, setConnected] = useState(socket.connected)
    const [logs, setLogs] = useState([])
    const [cmd, setCmd] = useState('')
    const [bin, setBin] = useState('powershell')
    const [customBin, setCustomBin] = useState('')
    const [trigger, setTrigger] = useState('run')
    const [speed, setSpeed] = useState('normal')
    const [regCmd, setRegCmd] = useState('')
    const [history, setHistory] = useState([])
    const [histIdx, setHistIdx] = useState(-1)
    const [draft, setDraft] = useState('')
    const [sketchCode, setSketchCode] = useState(SKETCH_TEMPLATE)
    const [sketchPrev, setSketchPrev] = useState('')
    const [showPrev, setShowPrev] = useState(false)
    const [presetCat, setPresetCat] = useState('all')
    const [deviceProfile, setDeviceProfile] = useState('default')
    const [customVid, setCustomVid] = useState('0x045E')
    const [customPid, setCustomPid] = useState('0x0745')
    const endRef = useRef()

    useEffect(() => {
        try {
            const s = JSON.parse(localStorage.getItem('bum_s') || '{}')
            if (s.bin) setBin(s.bin)
            if (s.trigger) setTrigger(s.trigger)
            if (s.speed) setSpeed(s.speed)
            if (s.deviceProfile) setDeviceProfile(s.deviceProfile)
            if (s.customVid) setCustomVid(s.customVid)
            if (s.customPid) setCustomPid(s.customPid)
            const h = JSON.parse(localStorage.getItem('bum_h') || '[]')
            if (h.length) setHistory(h)
        } catch (_) {}
    }, [])

    useEffect(() => {
        localStorage.setItem('bum_s', JSON.stringify({ bin, trigger, speed, deviceProfile, customVid, customPid }))
    }, [bin, trigger, speed, deviceProfile, customVid, customPid])

    useEffect(() => {
        if (history.length) localStorage.setItem('bum_h', JSON.stringify(history.slice(-100)))
    }, [history])

    useEffect(() => { localStorage.setItem('bum_theme', theme) }, [theme])

    useEffect(() => {
        const handler = () => setIsFullscr(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handler)
        return () => document.removeEventListener('fullscreenchange', handler)
    }, [])

    function toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
        else document.exitFullscreen()
    }
    function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark') }

    useEffect(() => {
        const onLog = payload => {
            let out = { type: 'log', msg: '' }
            if (typeof payload === 'string') out.msg = payload
            else if (payload && typeof payload === 'object') {
                out.type = payload.type || 'log'
                out.msg = payload.msg !== undefined ? String(payload.msg) : JSON.stringify(payload)
            } else out.msg = String(payload)
            if (out.type === 'log') out.type = inferType(out.msg)

            setLogs(prev => {
                const last = prev[prev.length - 1]
                if (last && last.type !== 'separator' && last.msg === out.msg && last.type === out.type)
                    return [...prev.slice(0, -1), { ...last, count: (last.count || 1) + 1 }]
                return [...prev, { ...out, count: 1 }]
            })
        }
        const onSketch = code => { setSketchPrev(code); setShowPrev(true) }
        const onConnect = () => setConnected(true)
        const onDisconnect = () => setConnected(false)

        socket.on('log', onLog)
        socket.on('sketch-content', onSketch)
        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        return () => {
            socket.off('log', onLog)
            socket.off('sketch-content', onSketch)
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
        }
    }, [])

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

    const pushSep = useCallback((label, meta = {}) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false })
        setLogs(prev => [...prev, { type: 'separator', msg: label, time, ...meta, count: 1 }])
    }, [])

    const pushCmd = useCallback(text => {
        setLogs(prev => [...prev, { type: 'cmd', msg: `> ${text}`, count: 1 }])
    }, [])

    function runPayload() {
        const command = cmd.trim()
        if (!command) return
        if (bin === 'custom' && !customBin.trim()) return

        setHistory(prev => [...prev, command])
        setHistIdx(-1)
        setDraft('')
        pushSep(command, { bin, trigger })
        pushCmd(command)

        if (command === 'help') socket.emit('help')
        else socket.emit('run-payload', { bin, customBin: customBin.trim(), trigger, cmd: command, speed, deviceProfile, customVid, customPid })
        setCmd('')
    }

    function runRegistry() {
        const command = regCmd.trim()
        if (!command) return
        pushSep(`reg: ${command}`, { bin: 'powershell', trigger: 'run' })
        pushCmd(`registry ${command}`)
        socket.emit('run-registry', { cmd: command })
        setRegCmd('')
    }

    function uploadSketch() {
        pushSep('[custom sketch]', { bin: 'raw', trigger: 'custom' })
        pushCmd('custom sketch upload')
        socket.emit('run-sketch', { code: sketchCode, deviceProfile, customVid, customPid })
        setMode('console')
    }

    function requestPreview() {
        socket.emit('preview-sketch', {
            bin, customBin: customBin.trim(), trigger,
            cmd: cmd.trim() || 'echo hello', speed,
        })
    }

    function previewSketchRaw() {
        setSketchPrev(`#include "DigiKeyboard.h"\nvoid setup(){\n  DigiKeyboard.delay(4000);\n${sketchCode}\n}\nvoid loop(){}`)
        setShowPrev(true)
    }

    function handleCmdKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); runPayload()
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (!history.length) return
            if (histIdx === -1) { setDraft(cmd); const i = history.length - 1; setHistIdx(i); setCmd(history[i]) }
            else if (histIdx > 0) { const i = histIdx - 1; setHistIdx(i); setCmd(history[i]) }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (histIdx === -1) return
            if (histIdx < history.length - 1) { const i = histIdx + 1; setHistIdx(i); setCmd(history[i]) }
            else { setHistIdx(-1); setCmd(draft) }
        }
    }

    function handleRegKey(e) { if (e.key === 'Enter') { e.preventDefault(); runRegistry() } }
    function loadPreset(p) { setBin(p.bin); setTrigger(p.trigger); setCmd(p.cmd); setMode('console') }

    return (
        <div className={`window${minimized ? ' minimized' : ''}`} data-theme={theme}>
            <TitleBar
                theme={theme}
                toggleTheme={toggleTheme}
                setMinimized={setMinimized}
                toggleFullscreen={toggleFullscreen}
                isFullscr={isFullscr}
            />

            <div className="window-body">
                <Toolbar
                    connected={connected}
                    bin={bin} setBin={setBin}
                    customBin={customBin} setCustomBin={setCustomBin}
                    trigger={trigger} setTrigger={setTrigger}
                    speed={speed} setSpeed={setSpeed}
                    deviceProfile={deviceProfile} setDeviceProfile={setDeviceProfile}
                    customVid={customVid} setCustomVid={setCustomVid}
                    customPid={customPid} setCustomPid={setCustomPid}
                    onReset={() => socket.emit('force-reset')}
                    onClearLogs={() => setLogs([])}
                />

                <div className="mode-tabs">
                    {[['console', 'console.sh'], ['sketch', 'sketch.ino'], ['presets', 'presets.cfg']].map(([m, label]) => (
                        <button key={m} className={`mode-tab ${mode === m ? 'tab-active' : ''}`} onClick={() => setMode(m)}>
                            {label}
                        </button>
                    ))}
                    <div className="tab-spacer" />
                </div>

                {mode === 'console' && (
                    <ConsoleView
                        logs={logs}
                        endRef={endRef}
                        cmd={cmd}
                        setCmd={setCmd}
                        handleCmdKey={handleCmdKey}
                        requestPreview={requestPreview}
                        regCmd={regCmd}
                        setRegCmd={setRegCmd}
                        handleRegKey={handleRegKey}
                    />
                )}

                {mode === 'sketch' && (
                    <div className="sketch-panel">
                        <textarea
                            className="sketch-editor"
                            value={sketchCode}
                            onChange={e => setSketchCode(e.target.value)}
                            spellCheck="false" autoComplete="off"
                        />
                        <div className="sketch-actions">
                            <span className="sketch-hint">raw DigiKeyboard.h  ·  setup() + #include added on compile</span>
                            <button className="tbtn tbtn-blue" onClick={previewSketchRaw}>preview .ino</button>
                            <button className="tbtn tbtn-green" onClick={uploadSketch}>compile + upload</button>
                        </div>
                    </div>
                )}

                {mode === 'presets' && (
                    <PresetsView
                        presetCat={presetCat}
                        setPresetCat={setPresetCat}
                        loadPreset={loadPreset}
                    />
                )}

                {showPrev && (
                    <div className="preview-overlay" onClick={() => setShowPrev(false)}>
                        <div className="preview-modal" onClick={e => e.stopPropagation()}>
                            <div className="preview-header">
                                <span>temp_sketch.ino — generated output</span>
                                <button className="preview-close" onClick={() => setShowPrev(false)}>✕ close</button>
                            </div>
                            <pre className="preview-code">{sketchPrev}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}