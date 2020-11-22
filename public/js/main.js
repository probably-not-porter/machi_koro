$( document ).ready(function() {
    const socket = io();
    let self_id = makeid(12);
    let in_game = false;

    function start_current(id){
        console.log('game starting');
        socket.emit("start_game", id);
        socket.emit("request_boardstate", id);
    }

    socket.emit("request_gamelist"); // request boardstate

    // create new game
    document.getElementById("new_game").addEventListener("click", function () {
        var name = prompt("Enter a name for your game");
        if (name){
            socket.emit("create_game", [name, makeid(10), self_id]);
            document.getElementById("lobby").style.zIndex = 0;
            document.getElementById("waiting").style.zIndex = 1;
        }
    }); 

    socket.on("self_data", function (ip) {
        console.log('Registered as player');
        self_ip = ip;
        console.log(self_ip);
        
    })

    socket.on("receive_gamelist", function (list) {
        if (in_game == false){
            // update waiting screen
            document.getElementById("waiting").innerText = "";
            let current_game = null;
            for (let x = 0; x < list.length; x++){
                for (let y = 0; y < list[x].players.length; y++){
                    if (list[x].players[y].id == self_id){
                        current_game = list[x];
                    }
                }
            }
            if (current_game){
                if (current_game.state == 1){ // GAME START, SWITCH SCREEN
                    console.log('game is starting');
                    in_game = true;
                    document.getElementById("game").style.zIndex = 1;
                    document.getElementById("waiting").style.zIndex = 0;
                }
                document.getElementById("waiting").innerHTML = "<h1>" + current_game.name + "</h1>";
                document.getElementById("waiting").innerHTML += " (waiting) \n" + current_game.players.length + "/4 \n\n";
                for (x in current_game.players){
                    document.getElementById("waiting").innerText += "\n" + current_game.players[x].name + "\n";
                }
                if (current_game.players.length > 1){
                    document.getElementById("waiting").innerHTML += "<button class='button' id='button-"+current_game.id+"'>START GAME</button>";
                    document.getElementById("button-" + current_game.id).addEventListener("click", function () {
                        start_current(current_game.id)
                    });
                }
            }

            // update lobby board
            var game_list = document.getElementById("active_games");
            game_list.innerHTML = "";
            
            for (let x = 0; x < list.length; x++){
                let game  = list[x];
                if (game.state == 0){
                    var li = document.createElement("li");
                    li.className = game.id;
                    li.innerText = game.name + " (" + game.players.length + "/4 players)";
                    game_list.appendChild(li);


                    // JOIN GAME
                    li.addEventListener("click", function () {
                        console.log(li.className)
                        socket.emit("join_game", [li.className, self_id]);
                        document.getElementById("lobby").style.zIndex = 0;
                        document.getElementById("waiting").style.zIndex = 1;
                    });
                }
            }
            if (game_list.innerHTML == ""){
                var li = document.createElement("li");
                li.innerText = "No open games. (Maybe make one?)"
                game_list.appendChild(li);
            }
        }else{

        }
    });

    socket.on("update_boardstate", function (state) { // display new boardstate
        // MARKET
        console.info(state);
        console.log('--> display market');
        let market_cards = state.market;
        document.getElementById("decks").innerHTML = "";
        for (let x = 0; x < market_cards.length; x++){
            let card = market_cards[x];
            var card_elem = document.createElement("div");
            var card_img = document.createElement("img");
            var card_num = document.createElement("span");
            card_elem.className = "card";
            card_img.src = "../img/" + card.image; 
            card_num.innerText = "x" +  card.quantity;
            card_elem.appendChild(card_img);
            if (card.quantity != null){ card_elem.appendChild(card_num); }
            document.getElementById("decks").appendChild(card_elem)
        }

        // SELF
        console.log('--> display player cards');
        let self_player = null;
        let stats = {"coins": 0, "bread": 0, "cup": 0, "fruit": 0, "tower": 0, "cow": 0, "factory": 0, "gear": 0, "wheat": 0}
        for (x in state.players){
            if (state.players[x].id = self_id){
                self_player = state.players[x]
            }
        }
        for (let x = 0; x < self_player.cards.length; x++){
            let card = self_player.cards[x];
            // stats
            stats[card.type] += 1;

            var card_elem = document.createElement("div");
            var card_img = document.createElement("img");
            var card_num = document.createElement("span");
            card_elem.className = "card";
            card_img.src = "../img/" + card.image; 
            card_num.innerText = "x" +  card.quantity;
            card_elem.appendChild(card_img);
            if (card.quantity != null){ card_elem.appendChild(card_num); }
            document.getElementById("field").appendChild(card_elem);
        }
        document.getElementById("coins-val").innerText = stats["coins"];
        document.getElementById("bread-val").innerText = stats["bread"];
        document.getElementById("cup-val").innerText = stats["cup"];
        document.getElementById("fruit-val").innerText = stats["fruit"];
        document.getElementById("tower-val").innerText = stats["tower"];
        document.getElementById("cow-val").innerText = stats["cow"];
        document.getElementById("factory-val").innerText = stats["factory"];
        document.getElementById("gear-val").innerText = stats["gear"];
        document.getElementById("wheat-val").innerText = stats["wheat"];
    });
    
    function makeid(n) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < n; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
});

