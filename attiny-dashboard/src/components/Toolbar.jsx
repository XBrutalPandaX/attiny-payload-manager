import React from 'react'
import { BIN_OPTIONS, TRIGGER_OPTIONS, SPEED_OPTIONS, DEVICE_PROFILE_OPTIONS } from '../constants/options'

export default function Toolbar({
    connected, bin, setBin, customBin, setCustomBin, trigger, setTrigger,
    speed, setSpeed, deviceProfile, setDeviceProfile, customVid, setCustomVid,
    customPid, setCustomPid, onReset, onClearLogs
}) {
    return (
        <div className="toolbar">
            <span className={`conn-text ${connected ? 'conn-on' : 'conn-off'}`}>
                {connected ? '● conn' : '○ disc'}
            </span>

            <span className="cfg-sep">|</span>

            <span className="cfg-key">bin:</span>
            <select value={bin} onChange={e => setBin(e.target.value)}>
                {BIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {bin === 'custom' && (
                <input
                    className="custom-bin-input"
                    value={customBin}
                    onChange={e => setCustomBin(e.target.value)}
                    placeholder="path/to/binary.exe"
                    autoComplete="off" spellCheck="false"
                />
            )}

            <span className="cfg-key">via:</span>
            <select value={trigger} onChange={e => setTrigger(e.target.value)}>
                {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <span className="cfg-key">spd:</span>
            <select value={speed} onChange={e => setSpeed(e.target.value)}>
                {SPEED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <span className="cfg-key">usb:</span>
            <select value={deviceProfile} onChange={e => setDeviceProfile(e.target.value)}>
                {DEVICE_PROFILE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {deviceProfile === 'custom' && (
                <>
                    <input
                        className="vid-pid-input"
                        value={customVid}
                        onChange={e => setCustomVid(e.target.value)}
                        placeholder="VID 0x045E"
                        autoComplete="off" spellCheck="false"
                    />
                    <input
                        className="vid-pid-input"
                        value={customPid}
                        onChange={e => setCustomPid(e.target.value)}
                        placeholder="PID 0x0745"
                        autoComplete="off" spellCheck="false"
                    />
                </>
            )}

            <span className="cfg-sep">|</span>
            <button className="tbtn tbtn-red" onClick={onReset}>reset</button>
            <button className="tbtn tbtn-dim" onClick={onClearLogs}>clr</button>
        </div>
    )
}