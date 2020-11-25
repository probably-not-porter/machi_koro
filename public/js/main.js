$( document ).ready(function() {
    const socket = io();
    let self_id = makeid(12);
    let self_name = prompt("Choose a Display Name");
    document.getElementById('player_name').innerText = self_name;
    let in_game = false;
    

    function start_current(id){
        console.log('--> start_current ' + id);
        socket.emit("start_game", id);
    }

    socket.emit("request_gamelist"); // request boardstate


    // BUTTON LISTENERS

    // create new game (lobby)
    document.getElementById("new_game").addEventListener("click", function () {
        console.log("--> create game")
        var name = prompt("Enter a name for your game");
        if (name){
            socket.emit("create_game", [name, makeid(10), self_id, self_name]);
            document.getElementById("lobby").style.zIndex = 0;
            document.getElementById("waiting_lobby").style.zIndex = 1;
        }
    }); 

    // dice (in game)
    document.getElementById("roll2").disabled = true; 

    document.getElementById("roll1").addEventListener("click", function () {
        let roll = 1 + Math.floor(Math.random()*6);
        document.getElementById("roll_num").innerText = roll;
        // check cards
    });
    document.getElementById("roll2").addEventListener("click", function () {
        let roll = 1 + Math.floor(Math.random()*6);
        let roll2 = 1 + Math.floor(Math.random()*6);
        document.getElementById("roll_num").innerText = roll + ", " + roll2;
        // check cards
    });

    socket.on("receive_gamelist", function (list) {
        console.log("--> receive_gamelist");
        if (in_game == false){
            // update waiting screen
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
                    document.getElementById("waiting_lobby").style.zIndex = 0;
                    let current_turn_player = current_game.players[current_game.turn];
                    if (current_turn_player.id == self_id) {
                        document.getElementById("current_turn").innerText = "It's your turn!";
                        take_turn_pt1();
                    }else{
                        document.getElementById("current_turn").innerText = current_turn_player.name + "'s turn";
                    }
                }
                document.getElementById("game_name").innerText = current_game.name;
                document.getElementById("game_players").innerText = current_game.players.length + "/4 (waiting)";
                document.getElementById("game_players_list").innerHTML = "";
                for (x in current_game.players){
                    var li = document.createElement("li");
                    li.innerText = current_game.players[x].name;
                    document.getElementById("game_players_list").appendChild(li);
                }
                if (current_game.players.length > 1){
                    document.getElementById("waiting-button-wrapper").innerHTML = "<button class='button' id='button-"+current_game.id+"'>START GAME</button>";
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
                        socket.emit("join_game", [li.className, self_id, self_name]);
                        document.getElementById("lobby").style.zIndex = 0;
                        document.getElementById("waiting_lobby").style.zIndex = 1;
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
        console.log("--> update boardstate")
        // MARKET
        console.log('----> display market');
        let market_cards = state.market;
        document.getElementById("decks").innerHTML = "";
        for (let x = 0; x < market_cards.length; x++){
            let card = market_cards[x];
            var card_elem = document.createElement("div");
            var card_img = document.createElement("img");
            var card_num = document.createElement("span");

            var card_tip = document.createElement("span");
            card_tip.className = 'tooltip';
            card_tip.innerText = card.tip;
            card_elem.appendChild(card_tip);

            card_elem.className = "card";
            card_img.src = "../img/" + card.image; 
            card_num.innerText = "x" +  card.quantity;
            card_elem.appendChild(card_img);
            if (card.quantity != null){ card_elem.appendChild(card_num); }
            document.getElementById("decks").appendChild(card_elem)
        }

        // SELF
        console.log('----> display player cards');
        let self_player = null;
        let stats = {"coins": 0, "bread": 0, "cup": 0, "fruit": 0, "tower": 0, "cow": 0, "factory": 0, "gear": 0, "wheat": 0}
        for (x in state.players){
            if (state.players[x].id == self_id){
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

            var card_tip = document.createElement("span");
            card_tip.className = 'tooltip';
            card_tip.innerText = card.tip;
            card_elem.appendChild(card_tip);

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


        // OPPONENTS
        console.log('----> display opponent cards');

        for (x in state.players){
            if (state.players[x] != self_player){
                var opp_elem = document.createElement("div");
                opp_elem.className = 'opp_block';
                opp_elem.innerHTML = "<h4>" + state.players[x].name + "</h4>";
                for (let y = 0; y < state.players[x].cards.length; y++){
                    let card = state.players[x].cards[y];

                    var card_elem = document.createElement("div");
                    var card_img = document.createElement("img");
                    var card_num = document.createElement("span");

                    var card_tip = document.createElement("span");
                    card_tip.className = 'tooltip';
                    card_tip.innerText = card.tip;
                    card_elem.appendChild(card_tip);

                    card_elem.className = "card";
                    card_img.src = "../img/" + card.image; 
                    card_num.innerText = "x" +  card.quantity;
                    card_elem.appendChild(card_img);
                    if (card.quantity != null){ card_elem.appendChild(card_num); }
                    opp_elem.appendChild(card_elem);
                }
                document.getElementById("opp").appendChild(opp_elem)
            }
        }
    });
    
    function makeid(n) {

        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < n; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        console.log("created id "+ result);
        return result;
    }

    function take_turn_pt1(){ // you are currently taking your turn

        // get all the action elements
        let waiting_elem = document.getElementById("waiting");
        let rolling_elem = document.getElementById("rolling");
        let buying_elem = document.getElementById("buying");
        let ending_elem = document.getElementById("ending");

        // hide waiting action because its your turn
        waiting_elem.style.display = "none";

        // ROLL PHASE
        rolling_elem.style.display = "inline-block"; // show action
        // if player has two dice,
        // document.getElementById("roll2").disabled = false; 


        // WAITING FOR DICE ROLL
    }
    function take_turn_pt2(){
        // DICE ROLL AS INPUT

        // update board

        // activate blue

        // activate green

        // activate purple

        // update board state

        // BUY PHASE

        // update board state
    }
});

