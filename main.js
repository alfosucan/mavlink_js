var {mavlink20, MAVLink20Processor} = require('./mavlink/mavlink')
var SerialPort = require('serialport')
let serial_port = new SerialPort('/dev/ttyACM0', { baudRate: 115200 })
let mav = new MAVLink20Processor(null, 1, 1)
serial_port.on('data', function (msg) {
    let decoded_msg = mav.parseBuffer(msg)
    console.log(decoded_msg)
})