export function inferType(msg) {
    if (msg.startsWith('CRITICAL:')) return 'error'
    if (msg.startsWith('DETAIL:')) return 'detail'
    if (msg.startsWith('COMPILE:') || msg.startsWith('BUILD LOG:')) return 'build'
    if (msg.startsWith('UPLOAD:') || msg.startsWith('UPLOAD LOG:')) return 'upload'
    if (msg.startsWith('STATUS:')) return 'status'
    return 'log'
}

export function getClass(type) {
    return ({
        cmd: 'log-cmd',
        banner: 'log-banner',
        error: 'log-error',
        detail: 'log-detail',
        build: 'log-build',
        upload: 'log-upload',
        status: 'log-status'
    })[type] || 'log-server'
}