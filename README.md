# MavLink JS Wrapper for ABZero

## Usage

- Clone repository
- On your project folder: `npm install --save PATH_TO_REPO/mavlink`
- Import as `var mavlink = requires('mavlink')`

## Examples

- Basic message request and commanding

```JavaScript
var Mavlink = require('mavlink')

// sysID, componentID, port
mav = new Mavlink(255, 1, '/dev/ttyACM0');

//Disable ATTITUDE messages setting a rate of -1
mav.sendCommand(
    'MAV_CMD_SET_MESSAGE_INTERVAL', 'ATTITUDE', -1, 0)

//Subscribe to ATTITUDE messages
mav.subscribe('ATTITUDE', msg => {
  // unsubscriobe as soon as the message is received
  mav.unsubscribe('ATTITUDE')

  // We'll just log some of the fields
  console.log('ATTITUDE')
  console.log(
      `roll:\t${msg.roll}\npitch:\t${msg.pitch}\nyaw:\t${msg.yaw}`);
});

// Request a single ATTITUDE message
mav.requestMessage('ATTITUDE');

//Set back ATTITUDE interval to some time in microseconds
mav.sendCommand('MAV_CMD_SET_MESSAGE_INTERVAL', 'ATTITUDE', 500000, 0);
```

- Request autopilot capabilities and check for rally points support

```JavaScript
// Request autopilot capabilities
mav.subscribe('AUTOPILOT_VERSION', msg => {
  // rally point capabilities bit mask
  let mask = 1 << 16;
  console.log(`Rally points supported: ${msg.capabilities[0] & mask}`)
});

mav.requestMessage('AUTOPILOT_VERSION');

// Try to add a rally point
mav.sendCommand(
    'MAV_CMD_NAV_RALLY_POINT',
    0,                   // unused
    0,                   // unused
    0,                   // unused
    0,                   // unused
    37.4323787602963,    // latitude
    -5.859504045141551,  // longitude
    50);                 // altitude
```

Request async information

```JavaScript
// Async request of gps info, returns a promise
setInterval(() => {
  mav.getInfo('GPS_RAW_INT', 'GPS_RAW_INT')
      .then(gps => console.log(gps), error => console.log(error));
}, 10000);
```
