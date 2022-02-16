const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const server = http.createServer(app);
const io = require('socket.io')(server);
const dotenv = require('dotenv');

app.use(cors());
dotenv.config();

// start socket server 
const ioServer = require('./socket/index.js');
ioServer.start(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});