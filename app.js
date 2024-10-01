const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const httpServer = http.createServer(app);

const io = socket(httpServer);

const chess = new Chess();
let currentPlayer;
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Welcome to Chess" })
});


io.on("connection", (soc) => {
    console.log("connected");

    if(!players.white){
        players.white = soc.id;
        soc.emit("playerRole", 'w');
    }
    else if(!players.black){
        players.black = soc.id;
        soc.emit("playerRole", 'b');
    }
    else {
        soc.emit("playerRole", "spectatorRole");
    }

    soc.on("disconnect", () => {
        if(soc.id === players.black){
            delete players.black;
        }
        else if(soc.id === players.white){
            delete players.white;
        }
    });

    soc.on("move", (move) => {
        try {
            if (chess.turn() === 'w' && soc.id !== players.white) return;
            if (chess.turn() === 'b' && soc.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }
            else {
                console.log("Invalid move: ", move);
                soc.emit("invalidMove", move);
            }
        }
        catch(err) {
            console.log(err);
            soc.emit("invalidMove: ", move);
        }
    });
});


const PATH = 3000;
httpServer.listen(PATH, () => {
    console.log(`The server is running on ${PATH}.`);
});