import { hexToLeBytes, strToCharArray } from '../utils/index.js'

export const deviceProfiles = {
  default: { vid: '0x16C0', pid: '0x27DB', vendor: 'digistump.com', device: 'DigiKey' },
  logitech_k120: { vid: '0x046D', pid: '0xC31C', vendor: 'Logitech', device: 'USB Keyboard' },
  dell_kb216: { vid: '0x413C', pid: '0x2113', vendor: 'Dell Inc.', device: 'Dell USB Keyboard' },
  hp_kb: { vid: '0x03F0', pid: '0x0024', vendor: 'HP', device: 'HP USB Keyboard' },
  lenovo_kb: { vid: '0x17EF', pid: '0x6009', vendor: 'Lenovo', device: 'USB Keyboard' },
  cherry_kb: { vid: '0x046A', pid: '0x0001', vendor: 'Cherry GmbH', device: 'USB Keyboard' },
  sandisk_usb: { vid: '0x0781', pid: '0x5567', vendor: 'SanDisk', device: 'Cruzer Blade' },
  generic_hid: { vid: '0x1D50', pid: '0x6000', vendor: 'OpenMoko Inc.', device: 'USB Keyboard' },
}

export const buildUsbConfig = (deviceProfile, customVid = '', customPid = '') => {
  if (!deviceProfile || deviceProfile === 'default') return null

  let vid, pid, vendor, device

  if (deviceProfile === 'custom') {
    const validHex = /^0x[0-9a-fA-F]{1,4}$/
    vid = validHex.test(customVid) ? customVid : '0x16C0'
    pid = validHex.test(customPid) ? customPid : '0x27DB'
    vendor = 'USB Device'
    device = 'USB Input'
  } else {
    const p = deviceProfiles[deviceProfile]
    if (!p) return null
    ;({ vid, pid, vendor, device } = p)
  }

  return `/* usbconfig.h — spoofed: ${deviceProfile} ${vid}/${pid} */
#ifndef __usbconfig_h_included__
#define __usbconfig_h_included__
#define USB_CFG_CLOCK_KHZ               (F_CPU/1000)
#define USB_CFG_CHECK_CRC               0
#define USB_CFG_HAVE_INTRIN_ENDPOINT    1
#define USB_CFG_HAVE_INTRIN_ENDPOINT3   0
#define USB_CFG_EP3_NUMBER              3
#define USB_CFG_IMPLEMENT_HALT          0
#define USB_CFG_SUPPRESS_INTR_CODE      0
#define USB_CFG_INTR_POLL_INTERVAL      10
#define USB_CFG_IS_SELF_POWERED         0
#define USB_CFG_MAX_BUS_POWER           100
#define USB_CFG_IMPLEMENT_FN_WRITE      0
#define USB_CFG_IMPLEMENT_FN_READ       0
#define USB_CFG_IMPLEMENT_FN_WRITEOUT   0
#define USB_CFG_HAVE_FLOWCONTROL        0
#define USB_CFG_LONG_TRANSFERS          0
#define USB_COUNT_SOF                   0
#define USB_CFG_CHECK_DATA_TOGGLING     0
#define USB_CFG_HAVE_MEASURE_FRAME_LENGTH 1
#include "osccal.h"
#define USB_USE_FAST_CRC                0
#define USB_CFG_VENDOR_ID               ${hexToLeBytes(vid)}
#define USB_CFG_DEVICE_ID               ${hexToLeBytes(pid)}
#define USB_CFG_DEVICE_VERSION          0x00, 0x01
#define USB_CFG_VENDOR_NAME             ${strToCharArray(vendor)}
#define USB_CFG_VENDOR_NAME_LEN         ${vendor.length}
#define USB_CFG_DEVICE_NAME             ${strToCharArray(device)}
#define USB_CFG_DEVICE_NAME_LEN         ${device.length}
#define USB_CFG_DEVICE_CLASS            0
#define USB_CFG_DEVICE_SUBCLASS         0
#define USB_CFG_INTERFACE_CLASS         0x03
#define USB_CFG_INTERFACE_SUBCLASS      0x01
#define USB_CFG_INTERFACE_PROTOCOL      0x01
#define USB_CFG_HID_REPORT_DESCRIPTOR_LENGTH 35
#define USB_CFG_DESCR_PROPS_DEVICE                0
#define USB_CFG_DESCR_PROPS_CONFIGURATION         0
#define USB_CFG_DESCR_PROPS_STRINGS               0
#define USB_CFG_DESCR_PROPS_STRING_0              0
#define USB_CFG_DESCR_PROPS_STRING_VENDOR         0
#define USB_CFG_DESCR_PROPS_STRING_PRODUCT        0
#define USB_CFG_DESCR_PROPS_STRING_SERIAL_NUMBER  0
#define USB_CFG_DESCR_PROPS_HID                   0
#define USB_CFG_DESCR_PROPS_HID_REPORT            0
#define USB_CFG_DESCR_PROPS_UNKNOWN               0
#include "usbboardconfig.h"
#endif`
}
