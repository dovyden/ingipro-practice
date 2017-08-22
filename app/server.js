'use strict';

const http = require('http');
const path = require('path');
const express = require('express');
const serveStatic = require('serve-static');
const socketIo = require('socket.io');
const websocketController = require('./server/websockets');

const PORT = 3000;


const app = express();
const server = http.Server(app);
const io = socketIo(server, {
    path: '/ws',
});

server.listen(PORT);

app.use(serveStatic(path.join(process.cwd(), 'build'), {redirect: false}));

io.on('connection', websocketController);
