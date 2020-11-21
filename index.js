// Machi Koro

const express = require("express");
const socket = require("socket.io");

// App Setup
const PORT = process.env.PORT || 3002;
const app = express();
const server = app.listen(PORT, function (){
    console.log("---- Machi Koro ----");
    console.log("--> Server Running");
});

// Static Files
app.use(express.static("public"));

// Game Setup
class CardType {
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

// blue
let wheat_field = new CardType("Wheat Field", "Wheat_Field.svg", "blue", "wheat", 1, [1], 6);
let ranch = new CardType("Ranch", "Ranch.svg", "blue", "cow", 1, [2], 6);
let forest = new CardType("Forest", "Forest.svg", "blue", "gear", 3, [5], 6);
let mine = new CardType("Mine", "Mine.svg", "blue", "gear", 6, [9], 6);
let apple_orchard = new CardType("Apple Orchard", "Apple_Orchard.svg", "wheat", 3, [10], 6)

// green
let bakery = new CardType("Bakery", "Bakery.svg", "green", "bread", 1, [2,3], 6);
let convenience_store = new CardType("Convenience Store", "Convenience_Store.svg", "green", "bread", 2,4, 6);
let cheese_factory = new CardType("Cheese Factory", "Cheese_Factory.svg", "green", "factory", 5, 7, 6);
let furniture_factory = new CardType("Furniture Factory", "Furniture_Factory.svg", "green", "factory", 3, 8, 6);
let fruit_and_vegetable_market = new CardType("Fruit and Vegetable Market", "Fruit_and_Vegetable_Market.svg", "green", "fruit", 2, [11,12], 6);

// red
let cafe = new CardType("Cafe", "Cafe.svg", "red", "cup", 2, 3, 6);
let family_restaurant = new CardType("Family Restaurant", "Family_Restaurant.svg", "red", "cup", 3, [9,10], 6)

// purple
let stadium = new CardType("Stadium", "Stadium.svg", "purple", "tower", 7, 6, 4);
let tv_station = new CardType("TV Station", "TV_Station.svg", "purple", "tower", 7, 6, 4);
let business_center = new CardType("Business Cetner", "Business_Center.svg", "purple", "tower", 8, 6, 4);

// gold
let train_station = new CardType("Train Station", "Train_Station", "gold", "tower", 4, null, null);
let shopping_mall = new CardType("Shopping Mall", "Shopping_Mall.svg", "gold", "tower", 10, null, null);
let amusement_park = new CardType("Amusement Park", "Amusement_Park.svg", "gold", "tower", 16, null, null);
let radio_tower = new CardType("Radio Tower", "Radio_Tower.svg", "gold", "tower", 22, null, null);

let game_stack = [wheat_field, ranch, forest, mine, apple_orchard, bakery, convenience_store, 
    cheese_factory, furniture_factory, fruit_and_vegetable_market, cafe, family_restaurant, 
    stadium, tv_station, business_center
]

//console.log(game_stack)

// Socket Setup
const io = socket(server);

io.on("connection", function (socket) {
    console.log("Made socket connection");
    io.emit("start_board", game_stack);
});
