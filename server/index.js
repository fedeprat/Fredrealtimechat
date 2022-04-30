const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");
const cors = require("cors");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "https://fredrealtimechat-9u2rslqjw-fedeprat.vercel.app",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 4000;

// keyword connection manages new connections
io.on("connection", (socket) => {
  console.log("we have a new connection");

  socket.on("join", ({ name, room }, callback) => {
    console.log({ name, room });
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);
    socket.emit("message", {
      user: "admin",
      text: `welcome to the room ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined.` });
    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    console.log({ user });
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => console.log("Server running on port", PORT));
