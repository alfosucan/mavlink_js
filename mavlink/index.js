var SerialPort = require('serialport');

var command_Q = [];

var DEBUG = false;

log_to_console =
    function(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

var {mavID, mavCmd} = require('./mavlink_v1/mavlink.lut')

class MavLink {
  constructor(ssyd, component_id, port, version = 1) {
    this.mavlink_;
    this.mavlinkProcessor;

    if (version == 1) {
      var {mavlink01, MAVLink10Processor} = require('./mavlink_v1/mavlink');
      this.mavlink_ = mavlink10;
      this.mavlinkProcessor = MAVLink10Processor;

    } else {
      var {mavlink20, MAVLink20Processor} = require('./mavlink_v2/mavlink');
      this.mavlink_ = mavlink20;
      this.mavlinkProcessor = MAVLink20Processor;
    }

    this.ssyd = ssyd;
    this.component_id = component_id;

    try {
      this.serial = new SerialPort(port, {
        baudRate: 921600,
        autoOpen: false,  // end class construction before opening coms
        parity: 'none',
        dataBits: 8,
        stopBits: 1
      });
    } catch (error) {
      throw Error(error)
    }
    this.mav = new this.mavlinkProcessor(null, ssyd, component_id);
    this.serial.on('data', raw_buffer => {
      this.mav.parseBuffer(raw_buffer);
    });

    this.subscribe('COMMAND_ACK', this.commandACKCallback)

    // set a periodic clean up task to avoid possible heap overflow
    // if a message is not correctly sent
    setInterval(this.clearCommandQ, 1000);
    this.serial.open()
  }

  clearCommandQ() {
    let now = Date.now();
    for (var i = 0; i < command_Q.length; i++) {
      let span = now - command_Q[i].time
      if (span > 1000) {
        log_to_console(
            `Removing entry ${command_Q[i].command} of ${span} ms old`);
        command_Q.splice(i, 1);
        log_to_console(`Size of Q: ${command_Q.length}`)
      }
    }
  }

  sendCommand(command, ...params) {
    let cmd_id = mavID[command];
    // avoid send until is already been processed
    let index = command_Q.findIndex(
        val => val.command == cmd_id & val.params == params);
    if (index > -1) {
      log_to_console(`Message ${command} already sent`)
      return;
    }
    let now = Date.now();
    if (typeof params[0] == 'string') {
      params[0] = mavID[params[0]]
    }
    var command_msg =
        new this.mavlink_.messages.command_long(2, 1, cmd_id, 101, ...params);
    log_to_console(
        `Sending:\nCOMMAND:\t${command}\nID:\t${cmd_id}\nPARARMS:\t${params}`);
    var buff = new Buffer.from(command_msg.pack(this.mav));
    this.serial.write(buff);
    command_Q.push({name: command, command: cmd_id, params: params, time: now});
  }

  commandACKCallback(ack_msg) {
    // remove message from send Q
    let index = command_Q.findIndex(val => val.command == ack_msg.command);
    if (index > -1) {
      log_to_console(`Removed ${command_Q[index].name} ID[${
          ack_msg.command}] at position ${index} with result ${
          ack_msg.result}`);
      command_Q.splice(index, 1);
    }
    let id = ack_msg.command.toString();
    let cmd_name = mavCmd[id];

    switch (ack_msg.result) {
      case mavID['MAV_RESULT_TEMPORARILY_REJECTED']:
        console.log(
            `ERROR: MAV_RESULT_TEMPORARILY_REJECTED ${cmd_name} ID:[${id}]`);
        break;
      case mavID['MAV_RESULT_DENIED']:
        console.log(`ERROR: MAV_RESULT_DENIED ${cmd_name} ID:[${id}]`);
        break;
      case mavID['MAV_RESULT_UNSUPPORTED']:
        console.log(`ERROR: MAV_RESULT_UNSUPPORTED ${cmd_name} ID:[${id}]`);
        break;
      case mavID['MAV_RESULT_FAILED']:
        console.log(`ERROR: MAV_RESULT_FAILED ${cmd_name} ID:[${id}]`);
        break;
      case mavID['MAV_RESULT_IN_PROGRESS']:
        console.log(`ERROR: MAV_RESULT_IN_PROGRESS ${cmd_name} ID:[${id}]`);
        break;
      case mavID['MAV_RESULT_CANCELLED']:
        console.log(`ERROR: MAV_RESULT_CANCELLED ${cmd_name} ID:[${id}]`);
        break;
      default:
        break;
    }
  }

  requestMessage(mav_msg) {
    this.sendCommand(
        'MAV_CMD_REQUEST_MESSAGE', mavID[mav_msg], 0, 0, 0, 0, 0, 1)
  }

  async getInfo(msg_name, mav_msg) {
    let promise = new Promise((resolve, reject) => {
      // set timeout for rejection
      var t_out = setTimeout(() => {
        this.mav.removeAllListeners(msg_name)
        reject(`Cannot get info for ${msg_name} with MAV_ID ${mav_msg}`)
      }, 2000)

      // subscribe to msg type
      this.subscribe(msg_name, (msg) => {
        let info_obj = new Object();

        this.requestMessage(mav_msg);  // request msg

        info_obj.name = msg_name
        msg.fieldnames.forEach(field => {
          info_obj[field] = msg[field];
        })
        clearTimeout(t_out);

        this.mav.removeAllListeners(msg_name)
        resolve(info_obj);
      });
    })

    let info = await promise
    return info;
  }

  subscribe(event_name, callback) {
    this.mav.on(event_name, callback);
  }

  unsubscribe(event_name) {
    this.mav.removeAllListeners(event_name);
  }
}



module.exports = MavLink