const express = require("express");
var http = require("http");
require("dotenv").config();

const app = express();
var process = require("process");

app.use(express.json());

var server = http.createServer(app);
const io = require("./helpers/io").init(server);

const Player = require("./classes/Player");
const Room = require("./classes/Room");

const roomlist = require("./helpers/roomlist");

app.use("/", express.static(__dirname + "/dist"));
app.use("/", express.static(__dirname+"/public"));
app.use("/assets", express.static(__dirname+"/assets"));

roomlist.setRoom(new Room())

io.on("connection", async (socket) => {
  socket.on("go", (name) => {
    if(!name || typeof name != "string") return;
    name = name.trim();
    if(name.length == 0) return socket.disconnect();
    name = name.substring(0,16);
    var player = new Player(name, socket.id, socket);
    roomlist.getAllRooms()[0].addPlayer(player);
  });
  socket.on("controller", (controller) => {
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(!room) return;
    room.playerControllerUpdate(socket.id, controller);
  });
  socket.on("mouse", (mouseAngle) => {
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(!room) return;
    room.playerMouseUpdate(socket.id, mouseAngle);
  });
  socket.on("down", (down) => {
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(!room) return;
    room.playerDown(socket.id, down);
  })
  socket.on("ping", (fn) => {
    fn(); // Simply execute the callback on the client
  })
  socket.on("disconnect", async () => {
    var room = roomlist.getRoomByPlayerId(socket.id);
    if(room) {
      room.removePlayer(socket.id);
    }
  });
});

//tick rooms
var tps = 0;
var secondStart = Date.now();
setInterval(() => {
  roomlist.tickAll();
  tps++;
  if(Date.now() - secondStart > 1000) {
    // console.log("tps: " + tps);
    tps = 0;
    secondStart = Date.now();
  }
}, 1000/30);

server.listen(process.env.PORT || 3000, () => {
  console.log("server started");
});
