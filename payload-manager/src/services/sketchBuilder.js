import { delay, speedMap } from '../utils/index.js'

export const buildTriggerCode = (trigger, escaped, mult = 1.0) => {
  const d = (ms) => Math.max(80, Math.round(ms * mult))

  switch (trigger) {
    case 'run':
      return `
DigiKeyboard.sendKeyStroke(KEY_R, MOD_GUI_LEFT);
DigiKeyboard.delay(${d(900)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(200)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    case 'search':
      return `
DigiKeyboard.sendKeyStroke(KEY_S, MOD_GUI_LEFT);
DigiKeyboard.delay(${d(1200)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(200)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    case 'explorer':
      return `
DigiKeyboard.sendKeyStroke(KEY_E, MOD_GUI_LEFT);
DigiKeyboard.delay(${d(1500)});
DigiKeyboard.sendKeyStroke(KEY_L, MOD_CONTROL_LEFT);
DigiKeyboard.delay(${d(400)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(200)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    case 'startmenu':
      return `
DigiKeyboard.sendKeyStroke(0, MOD_GUI_LEFT);
DigiKeyboard.delay(${d(1800)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(600)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    case 'winx_ps':
      return `
DigiKeyboard.sendKeyStroke(KEY_X, MOD_GUI_LEFT);
DigiKeyboard.delay(${d(1500)});
DigiKeyboard.sendKeyStroke(KEY_I);
DigiKeyboard.delay(${d(1800)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(200)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    case 'taskmanager':
      return `
DigiKeyboard.sendKeyStroke(KEY_ESC, MOD_CONTROL_LEFT | MOD_SHIFT_LEFT);
DigiKeyboard.delay(${d(2500)});
DigiKeyboard.sendKeyStroke(KEY_F, MOD_ALT_LEFT);
DigiKeyboard.delay(${d(600)});
DigiKeyboard.sendKeyStroke(KEY_R);
DigiKeyboard.delay(${d(1000)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(200)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    case 'taskmanager_w11':
      return `
DigiKeyboard.sendKeyStroke(KEY_ESC, MOD_CONTROL_LEFT | MOD_SHIFT_LEFT);
DigiKeyboard.delay(${d(2500)});
DigiKeyboard.sendKeyStroke(KEY_N, MOD_ALT_LEFT);
DigiKeyboard.delay(${d(800)});
DigiKeyboard.print("${escaped}");
DigiKeyboard.delay(${d(200)});
DigiKeyboard.sendKeyStroke(KEY_ENTER);`

    default:
      return null
  }
}

export const makeSketch = (triggerCode) => {
  return `#include "DigiKeyboard.h"
void setup(){
  DigiKeyboard.delay(4000);
${triggerCode}
}
void loop(){}
`
}
