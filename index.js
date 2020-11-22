// Machi Koro

const express = require("express");
const socket = require("socket.io");

// App Setup
const PORT = 3002;
const app = express();
const server = app.listen(PORT, function (){
    console.log("---- Machi Koro ----");
    console.log("--> Server Running");
});

// Static Files
app.use(express.static("public"));

// Game Setup
class CardType { // set up all the information for a card
    constructor(name, image, color, type, cost, activation, quantity){
        this.name = name;
        this.image = image;
        this.color = color;
        this.type = type;
        this.cost = cost;
        this.activation = activation;
        this.quantity = quantity;
    }
}

class Player { // create a new player
    constructor(name, id){
        this.name = name;
        this.id = id;
        this.cards = [
            new CardType("Wheat Field", "Wheat_Field.svg", "blue", "wheat", 1, [1], 1),
            new CardType("Bakery", "Bakery.svg", "green", "bread", 1, [2,3], 1)
        ];
        this.coins = 0;
    }
}

class BoardState { // create a new board state
    constructor(name, id){
        this.id = id;
        this.state = 0; // 0 for waiting, 1 for in play
        this.name = name;
        this.market = [
            new CardType("Wheat Field", "Wheat_Field.svg", "blue", "wheat", 1, [1], 6), 
            new CardType("Ranch", "Ranch.svg", "blue", "cow", 1, [2], 6), 
            new CardType("Forest", "Forest.svg", "blue", "gear", 3, [5], 6), 
            new CardType("Mine", "Mine.svg", "blue", "gear", 6, [9], 6), 
            new CardType("Apple Orchard", "Apple_Orchard.svg", "green","wheat", 3, [10], 6), 
            new CardType("Bakery", "Bakery.svg", "green", "bread", 1, [2,3], 6), 
            new CardType("Convenience Store", "Convenience_Store.svg", "green", "bread", 2,4, 6), 
            new CardType("Cheese Factory", "Cheese_Factory.svg", "green", "factory", 5, 7, 6), 
            new CardType("Furniture Factory", "Furniture_Factory.svg", "green", "factory", 3, 8, 6), 
            new CardType("Fruit and Vegetable Market", "Fruit_and_Vegetable_Market.svg", "green", "fruit", 2, [11,12], 6), 
            new CardType("Cafe", "Cafe.svg", "red", "cup", 2, 3, 6), 
            new CardType("Family Restaurant", "Family_Restaurant.svg", "red", "cup", 3, [9,10], 6), 
            new CardType("Stadium", "Stadium.svg", "purple", "tower", 7, 6, 4), 
            new CardType("TV Station", "TV_Station.svg", "purple", "tower", 7, 6, 4), 
            new CardType("Business Cetner", "Business_Center.svg", "purple", "tower", 8, 6, 4), 
            new CardType("Train Station", "Train_Station.svg", "gold", "tower", 4, null, null), 
            new CardType("Shopping Mall", "Shopping_Mall.svg", "gold", "tower", 10, null, null), 
            new CardType("Amusement Park", "Amusement_Park.svg", "gold", "tower", 16, null, null), 
            new CardType("Radio Tower", "Radio_Tower.svg", "gold", "tower", 22, null, null)
        ];
        this.players = [];
        this.turn = 0;
        this.timer = 300;
    }
}
var _game_list = [
    
];

// Socket Setup
const io = socket(server);

io.on("connection", function (socket) {
    console.log("--> Made socket connection");

    socket.on("join_game", function(data) {
        socket.join(data[0])
        let game = null;
        let self_player = new Player("test player name", data[1]);
        for (x in _game_list){
            if (_game_list[x].id == data[0]){
                game = _game_list[x]
            }
        }
        if (game != null){
            if (game.players.length < 4){
                game.players.push(self_player);
            }else{
                console.log("GAME FULL!");
            }
            io.emit("receive_gamelist", _game_list);
        }else{
            console.log("GAME DOESNT EXIST!");
        }
    });
    socket.on("start_game", function(id) {
        for (x in _game_list){
            if (_game_list[x].id == id){
                _game_list[x].state = 1;
            }
        }
        io.emit("receive_gamelist", _game_list);
    });

    socket.on("create_game", function(data) {
        socket.join(data[1])
        let new_game = new BoardState(data[0], data[1]);
        let self_player = new Player("test player name", data[2]);
        new_game.players.push(self_player);
        _game_list.push(new_game);
        io.emit("receive_gamelist", _game_list);
    });
    socket.on("request_gamelist", function() {
        io.emit("receive_gamelist", _game_list);
    });


    socket.on("request_boardstate", function(id) { // client is requesting boardstate
        let game = null;
        for (x in _game_list){
            if (_game_list[x].id == id){
                game = _game_list[x]
            }
        }
        io.to(id).emit("update_boardstate", game); // send boardstate to client
    });
    
});
