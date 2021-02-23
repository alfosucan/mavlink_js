let {mavlink10, MAVLink10Processor} = require('./mavlink_v1/mavlink')
var SerialPort = require('serialport')
var command_Q = new Array().fill(-1);
var DEBUG = true;

log_to_console = function (...args) {
    if (DEBUG) {
        console.log(...args);
    }
}
class MavLink {

    constructor(ssyd, component_id, port) {
        this.ssyd = ssyd;
        this.component_id = component_id;

        try {
            this.serial = new SerialPort(port, {
                baudRate: 921600,
                autoOpen: true,
                parity: 'none',
                dataBits: 8,
                stopBits: 1
            });
        }
        catch (error) {
            throw Error(error)
        }
        this.mav = new MAVLink10Processor(null, ssyd, component_id);
        this.serial.on('data', raw_buffer => {
            this.mav.parseBuffer(raw_buffer);
        });
        this.subscribe('COMMAND_ACK', this.commandACKCallback)

    }

    sendCommand(command, ...params) {
        // avoid send until is already been processed
        let index = command_Q.find(val => val==command);
        if (index > -1) {
            log_to_console(`Message ID: ${command} already sent`)
            return;
        }

        command_Q.push(command);
        var command_msg = new mavlink10.messages.command_long(
            2,
            1,
            command,
            101,
            ...params
        );
        var buff = new Buffer.from(command_msg.pack(this.mav));
        this.serial.write(buff);
    }

    commandACKCallback(ack_msg) {

        // remove message from send Q
        let index = command_Q.find(val => val==ack_msg.command);
        if (index > -1) {
            log_to_console(`Removed ${ack_msg.command} at position ${index}`);
            command_Q.splice(index, 1);
        }

        switch (ack_msg.result) {
            case mavlink10.MAV_RESULT_TEMPORARILY_REJECTED:
                throw Error("MAV_RESULT_TEMPORARILY_REJECTED");
            case mavlink10.MAV_RESULT_DENIED:
                throw Error("MAV_RESULT_DENIED");
            case mavlink10.MAV_RESULT_UNSUPPORTED:
                throw Error("MAV_RESULT_UNSUPPORTED");
            case mavlink10.MAV_RESULT_FAILED:
                throw Error("MAV_RESULT_FAILED");
            case mavlink10.MAV_RESULT_IN_PROGRESS:
                throw Error("MAV_RESULT_IN_PROGRESS");
            case mavlink10.MAV_RESULT_CANCELLED:
                throw Error("MAV_RESULT_CANCELLED");
            default:
                break;
        }
     }

    requestMessage(mav_msg) {
        this.sendCommand(mavlink10.MAV_CMD_REQUEST_MESSAGE,
            mav_msg, 0,0,0,0,0,1)
    }

    async getInfo(msg_name, mav_msg) {
        let promise = new Promise((resolve, reject) => {

            // subscribe to msg type
            this.subscribe(msg_name, (msg) => {
                let info_obj = new Object();

                this.requestMessage(mav_msg); // request msg

                info_obj.name = msg_name
                msg.fieldnames.forEach(field => {
                    info_obj[field] = msg[field];
                })
                resolve(info_obj);
            })

            setTimeout(() => {
                reject(new Error(`Cannot get info for ${msg_name} : ${mav_msg}`))
            }, 1000);

        })
        let info = await promise
        this.mav.removeAllListeners(msg_name)
        return info;
    }

    subscribe(event, callback) {
        this.mav.on(event, callback);
    }

    unsubscribe(event) {
        this.mav.removeAllListeners(event);
    }
}



module.exports = MavLink