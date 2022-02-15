const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    origins: ["*"]
});
// const io = require('socket.io')(server, {
//     cors: {
//         methods: ["GET", "POST"],
//         origin: ['http://localhost:3000'],
//     }
// });

// const obj = require('./api/Room.js');

app.use(cors());

// start socket server 
const ioServer = require('./socket/index.js');
ioServer.start(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});