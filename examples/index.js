

var Mavlink = require('mavlink')

mav = new Mavlink(255, 1, '/dev/ttyACM0');


/**
 * Disable ATTITUDE messages setting a rate of -1
 */
mav.sendCommand(
    'MAV_CMD_SET_MESSAGE_INTERVAL', 'ATTITUDE', -1, 0)

mav.subscribe('ATTITUDE', msg => {
  console.log('ATTITUDE')
  console.log(`roll:\t${msg.roll}\npitch:\t${msg.pitch}\nyaw:\t${msg.yaw}`);
  mav.unsubscribe('ATTITUDE')
});
mav.requestMessage('ATTITUDE')

/**Set message interval at some rate (time in us) */

mav.sendCommand(
    'MAV_CMD_SET_MESSAGE_INTERVAL', 'ATTITUDE', 3000, 0)

// Request autopilot capabilities
mav.subscribe('AUTOPILOT_VERSION', msg => {
  let mask = 1 << 16; //official docs
  console.log(`Rally points supported: ${msg.capabilities[0] & mask}`)
})
setInterval(
    () => {
        mav.requestMessage('AUTOPILOT_VERSION')},
    2000)


mav.sendCommand(
    'MAV_CMD_NAV_RALLY_POINT',
    0,                   // unused
    0,                   // unused
    0,                   // unused
    0,                   // unused
    37.4323787602963,    // latitude
    -5.859504045141551,  // longitude
    50                   // altitude
)


/**
 * Send an unsupported request, some message requests need an explicit command
 * Not every msg_id can be requested this way.
 * This one should be used as "sendCommand('MAV_CMD_GET_HOME_POSITION')"
 */
mav.requestMessage('HOME_POSITION')

/**
 * This one could fail if home position is not set
 */
mav.sendCommand('MAV_CMD_GET_HOME_POSITION');


/**
 * Async request of gps info, returns a promise
 */
setInterval(() => {
  mav.getInfo('GPS_RAW_INT', 'GPS_RAW_INT')
      .then(gps => console.log(gps), error => console.log(error));
}, 10000);
