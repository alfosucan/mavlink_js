let {mavlink10, MAVLink10Processor} = require('./mavlink_v1/mavlink')
var SerialPort = require('serialport')

class MavLink {
    constructor(ssyd, component_id, port) {
        this.ssyd = ssyd;
        this.component_id = component_id;
        this.serial = new SerialPort(port, {
            baudRate: 921600,
            autoOpen: true,
            parity: 'none',
            dataBits: 8,
            stopBits: 1
        });
        this.mav = new MAVLink10Processor(null, ssyd, component_id);
        this.serial.on('data', msg => {
            this.mav.parseBuffer(msg);
        });

    }
    sendCommand(target_sys, target_component, command, ...params) {

        var command_msg = new mavlink10.messages.command_long(
            target_sys,
            target_component,
            command,
            101,
            ...params
        );
        var buff = new Buffer.from(command_msg.pack(this.mav));
        this.serial.write(buff);
    }
    subscribe(event, callback) {
        this.mav.on(event, callback);
    }
    unsubscribe(event) {
        this.mav.off(event);
    }
}



module.exports = MavLink