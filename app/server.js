'use strict';

const http = require('http');
const path = require('path');
const express = require('express');
const serveStatic = require('serve-static');
const socketIo = require('socket.io');

const websockets = require('./server/websockets');

const PORT = 3000;

const app = express();
const server = http.Server(app);
const io = socketIo(server);

app.use(serveStatic(path.join(process.cwd(), 'build'), {redirect: false}));

app.listen(PORT, () => {
    // eslint-disable-next-line
    console.log(`Server started on localhost:${PORT}`);
});

io.on('connection', websockets);
