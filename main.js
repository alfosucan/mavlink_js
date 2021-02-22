/**
 * Ejemplo de como funciona esta wea
 */

// var {mavlink10, MAVLink10Processor} = require('./mavlink_v1/mavlink')
// var SerialPort = require('serialport')
// let serial_port = new SerialPort('/dev/ttyACM0', {
//     baudRate: 921600,
//     autoOpen: true,
//     parity: 'none',
//     dataBits: 8,
//     stopBits: 1
// })
// let mav1 = new MAVLink10Processor(null, 1, 1)
// mav1.file = serial_port;

// var test_command_long = new mavlink10.messages.command_long();
// test_command_long.param1 = mavlink10.MAVLINK_MSG_ID_RAW_IMU;
// test_command_long.command = mavlink10.MAV_CMD_GET_MESSAGE_INTERVAL;
// test_command_long.target_system = 2;
// test_command_long.target_component = 1;
// test_command_long.confirmation = 101;
// var t = new Buffer.from(test_command_long.pack(mav1));
// serial_port.on('data', function (msg) {

//     mav1.parseBuffer(msg)
// })
// mav1.on('COMMAND_ACK', function (msg) {
//     console.log(msg)
// })
// mav1.on('MESSAGE_INTERVAL', function (msg) {
//     var s = `ID: ${msg.message_id}\t INTERVAL: ${msg.interval_us}`
//     console.log(s)
// })

// setInterval(() => {
//     serial_port.write(t)
// }, 1500)

var Mavlink = require('./ab_zero')
let {mavlink10, MAVLink10Processor} = require('./mavlink_v1/mavlink')

mav = new Mavlink(1, 1, '/dev/ttyACM0');
mav.subscribe('MESSAGE_INTERVAL', (msg) => {
    var s = `ID: ${msg.message_id}\t INTERVAL: ${msg.interval_us}`
    console.log(s)
})

setInterval(() => {
    mav.sendCommand(1,1, mavlink10.MAV_CMD_GET_MESSAGE_INTERVAL, mavlink10.MAVLINK_MSG_ID_RAW_IMU)
}, 1000)