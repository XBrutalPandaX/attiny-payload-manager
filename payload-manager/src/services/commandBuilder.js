export const buildCommand = (bin, cmd, customBin = '') => {
  switch (bin) {
    case 'powershell':
      return `powershell -NoProfile -Command "${cmd}"`
    case 'powershell_bp':
      return `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`
    case 'powershell_hid':
      return `powershell -WindowStyle Hidden -NoProfile -Command "${cmd}"`
    case 'powershell_full':
      return `powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`
    case 'cmd':
      return `cmd /c ${cmd}`
    case 'certutil':
      return `certutil ${cmd}`
    case 'bitsadmin':
      return `bitsadmin ${cmd}`
    case 'mshta':
      return `mshta "${cmd}"`
    case 'custom':
      return customBin ? `${customBin.trim()} ${cmd}` : `cmd /c ${cmd}`
    default:
      return `cmd /c ${cmd}`
  }
}

export const registryParser = (text) => {
  const p = text.match(/-p\s+"?([^"]+)"?/)?.[1]
  const k = text.match(/-k\s+"?([^"]+)"?/)?.[1]
  const v = text.match(/-string\s+"?([^"]+)"?/)?.[1]
  if (!p || !k || !v) return null
  return `New-Item -Path '${p}' -Force; New-ItemProperty -Path '${p}' -Name '${k}' -Value '${v}' -PropertyType String -Force`
}
