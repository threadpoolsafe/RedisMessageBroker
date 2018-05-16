const redis = require("redis");
const uuidv1 = require('uuid/v1');
const EventEmitter = require('events');


class rmb extends EventEmitter
{
    constructor(channels = [])
    {
        super();
        this.uuid = uuidv1();
        this.channels = channels;

        this.channels.push(this.uuid);
        this.redisPub = redis.createClient();
        this.redisSub = redis.createClient();

        this.redisSub.subscribe(channels);
        this.correlations = new Map();
        this.connected = false;

        this.redisSub.on('message', (channel, data) =>
        {
            let message = JSON.parse(data);
            if (channel == this.uuid)
            {
                //it is a response
                let resolveFunc = this.correlations.get(message.correlationId);
                this.correlations.delete(message.correlationId);
                resolveFunc(message.data);
            }
            else
            {
                //it is a request
                this.emit("Request", channel, message.data, (res)=>{ this.Response(message.replyTo, message.correlationId, res)})

            }
        });

        this.redisSub.on("subscribe", (channel, count) => {
            if (count == this.channels.length)
            {
                this.connected = true;
                this.emit("connected");
            }
        });
    }


    Response(replyTo, correlationId, data)
    {
        if (this.connected)
        {
            this.redisPub.publish(replyTo, JSON.stringify({
                correlationId : correlationId,
                data: data,
            }));
        }
    }


    Request(action, data, correlationId = uuidv1())
    {
        return new Promise((resolve, reject)=>
        {
            if (this.connected)
            {
                this.correlations.set(correlationId, resolve);
                let message =
                    {
                        replyTo : this.uuid,
                        correlationId : correlationId,
                        data: data,
                    };
                this.redisPub.publish(action, JSON.stringify(message));
            }
            else
            {
                reject("Not connected");
            }
        });
    }


    Quit()
    {
        this.redisSub.quit();
        this.redisPub.quit();
    }
}

module.exports = rmb;