const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 9999;

let startTime = null;
let elapsedTime = 0;
let running = false;
let title = '';

io.on("connection", (socket) => {
    console.log(socket.id + " connected");

    socket.emit("updateTimer", { elapsedTime, running, startTime });
    io.emit("newTimerTitle", title);

    socket.on("setStartTime", (time) => {
        startTime = Date.now() - time;
        elapsedTime = time;
        io.emit("updateTimer", { elapsedTime, running, startTime });
    });

    socket.on("setTimerTitle", (timertitle) => {
        title = timertitle;
        io.emit("newTimerTitle", timertitle);
    });

    socket.on("startStopwatch", () => {
        if (!running) {
            startTime = Date.now() - elapsedTime;
            running = true;
            io.emit("startStopwatchFrontend");
            updateElapsedTime();
        }
    });

    socket.on("stopStopwatch", () => {
        if (running) {
            elapsedTime = Date.now() - startTime;
            running = false;
            io.emit("stopStopwatchFrontend");
        }
    });

    socket.on("resetStopwatch", () => {
        startTime = null;
        elapsedTime = 0;
        running = false;
        io.emit("resetStopwatchFrontend");
    });
});

function updateElapsedTime() {
    if (running) {
        setTimeout(() => {
            elapsedTime = Date.now() - startTime;
            io.emit("updateTimer", { elapsedTime, running, startTime });
            updateElapsedTime();
        }, 1000);
    }
}

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    if(req.query.pw == "masonmedia") {
        res.sendFile(join(__dirname, 'Backend.html'));
    } else {
        res.redirect('/');
    }
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
