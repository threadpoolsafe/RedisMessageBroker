# RedisMessageBroker

## Example

```javascript
const redismessagebroker = require('redismessagebroker');
const client = new redismessagebroker(['test']);

client.on('connected' , ()=>
{
    client.Request('test', "Hello World" ).then(result =>
    {
        console.dir(result);
    });
});

client.on("Request",(channel, message, res) =>
{
    console.dir(message);
    res("Hi Space");
});
```