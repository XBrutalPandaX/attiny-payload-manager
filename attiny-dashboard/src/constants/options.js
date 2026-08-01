export const BIN_OPTIONS = [
    { value: 'powershell',      label: 'powershell' },
    { value: 'powershell_bp',   label: 'powershell -bypass' },
    { value: 'powershell_hid',  label: 'powershell -hidden' },
    { value: 'powershell_full', label: 'powershell -bypass -hidden' },
    { value: 'cmd',             label: 'cmd.exe' },
    { value: 'certutil',        label: 'certutil' },
    { value: 'bitsadmin',       label: 'bitsadmin' },
    { value: 'mshta',           label: 'mshta.exe' },
    { value: 'custom',          label: 'custom...' },
]

export const TRIGGER_OPTIONS = [
    { value: 'run',             label: 'win+r  →  run dialog' },
    { value: 'search',          label: 'win+s  →  search bar' },
    { value: 'explorer',        label: 'win+e  →  explorer addr' },
    { value: 'startmenu',       label: 'win    →  start menu' },
    { value: 'winx_ps',         label: 'win+x  →  ps / terminal' },
    { value: 'taskmanager',     label: 'c+s+e  →  task mgr [w10]' },
    { value: 'taskmanager_w11', label: 'c+s+e  →  task mgr [w11]' },
]

export const SPEED_OPTIONS = [
    { value: 'turbo',    label: '0.4x  turbo' },
    { value: 'fast',     label: '0.7x  fast' },
    { value: 'normal',   label: '1.0x  normal' },
    { value: 'slow',     label: '2.0x  slow' },
    { value: 'paranoid', label: '4.0x  paranoid' },
]

export const DEVICE_PROFILE_OPTIONS = [
    { value: 'default',       label: 'default (digispark)' },
    { value: 'logitech_k120', label: 'logitech k120' },
    { value: 'dell_kb216',    label: 'dell kb216' },
    { value: 'hp_kb',         label: 'hp keyboard' },
    { value: 'lenovo_kb',     label: 'lenovo keyboard' },
    { value: 'cherry_kb',     label: 'cherry keyboard' },
    { value: 'sandisk_usb',   label: 'sandisk cruzer' },
    { value: 'generic_hid',   label: 'generic hid' },
    { value: 'custom',        label: 'custom vid/pid...' },
]

export const SKETCH_TEMPLATE = `// temp_sketch.ino — custom DigiKeyboard payload
// setup() wrapper and #include are added automatically on compile

DigiKeyboard.sendKeyStroke(KEY_R, MOD_GUI_LEFT);
DigiKeyboard.delay(900);
DigiKeyboard.print("notepad");
DigiKeyboard.sendKeyStroke(KEY_ENTER);
DigiKeyboard.delay(1500);
DigiKeyboard.print("hello from digispark");
`