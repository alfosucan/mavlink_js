

var Mavlink = require('./ab_zero')

mav = new Mavlink(255, 1, '/dev/ttyACM0');


/**
 * Disable ATTITUDE messages setting a rate of -1
 */
mav.sendCommand('MAV_CMD_SET_MESSAGE_INTERVAL',
    'MAVLINK_MSG_ID_ATTITUDE', -1, 0)

mav.subscribe('ATTITUDE', msg => {
    console.log(msg);
    mav.unsubscribe('ATTITUDE')
});
mav.requestMessage('MAVLINK_MSG_ID_ATTITUDE')

/**Set message interval at some rate (time in us) */
setInterval(() => {
    mav.sendCommand('MAV_CMD_SET_MESSAGE_INTERVAL',
        'MAVLINK_MSG_ID_ATTITUDE', 100000, 0)
}, 500);


/**
 * Send an unsupported request, some message requests need an explicit command
 * Not every msg_id can be requested this way.
 * This one should be used as "sendCommand('MAV_CMD_GET_HOME_POSITION')"
 */
mav.requestMessage('MAVLINK_MSG_ID_HOME_POSITION')

/**
 * This one could fail if home position is not set
 */
setInterval(() => {
    mav.sendCommand('MAV_CMD_GET_HOME_POSITION');
}, 3000);

/**
 * Async request of gps info, returns a promise
*/
setInterval(() => {
    mav.getInfo('GPS_RAW_INT', 'MAVLINK_MSG_ID_GPS_RAW_INT').then(
        gps => console.log(gps),
        error => console.log(error)
    );
}, 1500);
