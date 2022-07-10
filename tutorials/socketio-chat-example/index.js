const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const user_id_map = {};

//Express is separate form HTTP. We see that HTTP wraps around our express App
//Express is defining a functional handler that our HTTP server uses!
//Also, our http server is wrapped in our socket.io server object somehow?
app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//Behind the scenes, every browser that pings this server sets up a socket.
//Our users are identified by their socket.
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    console.log(msg);
    socket.emit(msg); //sends ot everyone except the sender itself!
  });
  socket.on("userreg", (data) => {
    user_id_map[socket.id] = data.chosenName;
    user_id_map[data.chosenName] = socket.id;
    console.log("User Registered with ID:" + socket.id + " and name:" + data.chosenName);
  });

});


server.listen(3000, () => {
  console.log('listening on *:3000');
});
