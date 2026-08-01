import React from 'react'

export default function TitleBar({ theme, toggleTheme, setMinimized, toggleFullscreen, isFullscr }) {
    return (
        <div className="title-bar">
            <span className="title-name">bad-usb payload manager</span>
            <span className="title-ver">v1.0</span>
            <div className="win-btns">
                <button className="win-btn win-theme" onClick={toggleTheme} title={theme === 'dark' ? 'light mode' : 'dark mode'}>
                    {theme === 'dark' ? '☀' : '☾'}
                </button>
                <button className="win-btn win-min" onClick={() => setMinimized(m => !m)} title="minimize">─</button>
                <button className="win-btn win-max" onClick={toggleFullscreen} title={isFullscr ? 'restore' : 'maximize'}>
                    {isFullscr ? '❐' : '□'}
                </button>
                <button className="win-btn win-close" onClick={() => window.close()} title="close">✕</button>
            </div>
        </div>
    )
}