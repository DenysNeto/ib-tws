import EventEmitter from "events";
import net from "net";
import util from "util";
const debuglog = util.debuglog("ib-tws-api-bytes");
import { Telegraf } from "telegraf";

let Logger = function (message, type, channel_id) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID = channel_id ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram.sendMessage(CHANNEL_ID, message);
  }
};

/* Protocol's byte-level handing */
class ProtocolBytes {
  constructor() {
    this._emitter = new EventEmitter();
  }

  /* p: {host, port, clientId} */
  connect(p = {}) {
    p.host = p.host || "127.0.0.1";
    this._clientId = p.clientId;
    this._socket = new net.Socket();

    this._socket.on("data", (data) => {
      // console.log("DATA", data);
      this._onData(data);
    });

    this._socket.on("close", (e) => {
      console.log("CLOSE");
      debuglog("ProtocolBytes: close");
      this._emitter.emit("close");
    });

    this._socket.on("end", (e) => {
      console.log("END");
      debuglog("ProtocolBytes: end");
      this._emitter.emit("close");
    });

    this._socket.on("error", (e) => {
      console.log("ERROR");
      debuglog("ProtocolBytes: error");
      debuglog(e);
      this._emitter.emit("error", e);
    });

    return this._promiseBoundToSocketError((resolve) => {
      console.log("ERROR SOCKET CONNECT");
      this._socket.connect(
        {
          host: p.host,
          port: p.port,
        },
        resolve
      );
    });
  }

  on(eventName, listener) {
    this._emitter.on(eventName, listener);
  }

  off(eventName, listener) {
    this._emitter.off(eventName, listener);
  }

  removeAllListeners() {
    this._emitter.removeAllListeners();
  }

  disconnect() {
    this._socket.end();
  }

  sendFieldset(fields) {
    debuglog("sending fieldset");
    debuglog(fields);
    let fieldsStrings = fields.map((i) => {
      if (i == null) {
        return "";
      } else if (typeof i === "boolean") {
        return i ? "1" : "0";
      } else if (typeof i === "string") {
        return i;
      } else if (typeof i === "number") {
        return i.toString();
      } else {
        let output = "";
        for (let key in i) {
          output += key + "=" + i[key] + ";";
        }
        return output;
      }
    });

    let string = fieldsStrings.join("\0") + "\0";
    let message = this._serializeString(string);

    debuglog("sending (serialized)");
    debuglog(fieldsStrings);
    debuglog(string);
    debuglog(message);

    this._socket.write(message);
  }

  sendHandshake() {
    const MIN_CLIENT_VERSION = 100;
    const MAX_CLIENT_VERSION = 151;

    let v100prefix = "API\0";
    this._socket.write(v100prefix);

    let v100version = util.format(
      "v%d..%d",
      MIN_CLIENT_VERSION,
      MAX_CLIENT_VERSION
    );
    let msg = this._serializeString(v100version);
    this._socket.write(msg);

    debuglog("connection handshake sent");
  }

  _promiseBoundToSocketError(workload) {
    return new Promise((resolve, reject) => {
      const onError = (e) => {
        reject(e);
      };

      const onSuccess = () => {
        this._socket.off("error", onError);
        resolve();
      };

      this._socket.once("error", onError);
      workload(onSuccess);
    });
  }

  _serializeString(s) {
    let content = Buffer.from(s);
    let header = Buffer.alloc(4);
    header.writeInt32BE(content.length);

    return Buffer.concat([header, content]);
  }

  _onData(data) {
    debuglog("received packet");
    debuglog(data);
    debuglog(data.toString("ascii"));

    if (this._dataPending) {
      this._dataPending = Buffer.concat([this._dataPending, data]);
    } else {
      this._dataPending = data;
    }

    while (this._dataPending && this._dataPending.length >= 4) {
      let stringLength = this._dataPending.readInt32BE(0);
      if (this._dataPending.length < stringLength + 4) {
        debuglog("not full message received, waiting for remainder");
        return;
      }

      let messageString = this._dataPending.toString(
        "ascii",
        4,
        stringLength + 4
      );
      if (this._dataPending.length == stringLength + 4) {
        this._dataPending = null;
      } else {
        this._dataPending = this._dataPending.slice(stringLength + 4);
      }

      let messageFields = messageString.split("\0");
      messageFields.pop(); // last item is always empty

      debuglog("received message fields");
      debuglog(messageFields);

      //console.log("FFFF", messageFields);

      this._emitter.emit("message_fieldset", messageFields);
    }
  }
}

export default ProtocolBytes;
