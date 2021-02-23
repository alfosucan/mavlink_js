

var Mavlink = require('./ab_zero')
let {mavlink10, MAVLink10Processor} = require('./mavlink_v1/mavlink')

mav = new Mavlink(255, 1, '/dev/ttyACM0');

mav.subscribe('HOME_POSITION', msg => {
    console.log(msg)
})

// mav.subscribe('ATTITUDE', msg => {
//     console.log(msg)
// })

setInterval(() => {
    mav.requestMessage(mavlink10.MAVLINK_MSG_ID_HOME_POSITION)
}, 5000)

setInterval(() => {
    mav.sendCommand(mavlink10.MAV_CMD_SET_MESSAGE_INTERVAL,
        mavlink10.MAVLINK_MSG_ID_ATTITUDE, 1000000, 0)
}, 5000)


//get gps info
mav.getInfo('GPS_RAW_INT', mavlink10.MAVLINK_MSG_ID_GPS_RAW_INT).then(
    gps => console.log(gps),
    error => console.log(error)
)

mav.getInfo('THIS_IS_NOT_A_MSG', mavlink10.I_DONT_EXIST).then(
    gps => console.log(gps),
    error => console.log(error)
)