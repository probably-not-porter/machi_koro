// MACHI KORO
// CLIENT SIDE

$( document ).ready(function() {
    const socket = io();

    var self_id = localStorage['self_id'] || null; // cache id
    if (self_id == null){
        self_id = makeid(12);
        localStorage['self_id'] = self_id;
    }
    var self_name = localStorage['self_name'] || null; // cache name
    if (self_name == null){
        self_name = prompt("Choose a Display Name");
        localStorage['self_name'] = self_name;
    }
    
    document.getElementById('player_name').innerText = self_name;
    let in_game = false;
    let my_game_state = null;
    let in_turn = false;
    let my_game_id = null;
    let buying = false;
    let extra_turn = false;

    // WINCONS
    let t_station = 0;
    let s_mall = 0;
    let a_park = 0;
    let r_tower = 0;

    // Other exceptions that need flags (purple cards)
    let business_center = false;
    let business_center_2 = false;
    let tv_station = false;
    

    function start_current(id){
        socket.emit("start_game", id);
    }

    socket.emit("request_gamelist"); // request boardstate


    // BUTTON LISTENERS

    // create new game (lobby)
    document.getElementById("new_game").addEventListener("click", function () {
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
        let roll = 1 + Math.floor(Math.random()*1);             // CHANGED FOR TESTING, SHOULD BE 6;
        document.getElementById("roll_num").innerText = roll;
        take_turn_pt2(roll);
    });
    document.getElementById("roll2").addEventListener("click", function () {
        let roll = 1 + Math.floor(Math.random()*6);
        let roll2 = 1 + Math.floor(Math.random()*6);
        document.getElementById("roll_num").innerText = roll + ", " + roll2;
        if (roll == roll2 && a_park == 1){ // take an extra turn if you roll doubles and have amusement park
            console.log("take an extra turn");
            extra_turn = true;
        }
        take_turn_pt2(roll + roll2);
    });

    // end turn
    document.getElementById("end_turn").addEventListener("click", function () {
        end_turn();
    });
    document.getElementById("end_turn_buy").addEventListener("click", function () {
        var check = confirm("Are you sure you want to end your turn without buying anything?");
        if (check){
            end_turn();
        }
    });

    socket.on("receive_gamelist", function (list) {
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
                    in_game = true;
                    my_game_state = current_game;
                    document.getElementById("game").style.zIndex = 1;
                    document.getElementById("waiting_lobby").style.zIndex = 0;
                }
                document.getElementById("game_name").innerText = "Game: " + current_game.name + " Lobby";
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
                        my_game_id = li.className;
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
        my_game_state = state;
        // CHECK FOR WIN
        if (s_mall + r_tower + a_park + t_station == 4){
            alert("You Won!");
        }

        // Update dice for a_park
        if (t_station == 1){
            document.getElementById("roll2").disabled = false;
        }

        // CHECK FOR MY TURN
        for (x in state.players){
            if (state.turn == x){
                if (self_id == state.players[x].id && in_turn == false){
                    document.getElementById("current_turn").innerText = "It's your turn!";
                    add_feed_msg(state.players[x].name + "'s turn!");
                    take_turn_pt1();
                }
                else if (self_id != state.players[x].id && in_turn == false){
                    document.getElementById("current_turn").innerText = "It's " + state.players[x].name + "'s turn.";
                }
            }
        }

        // FEED
        document.getElementById("feed").innerText = "";
        for (x in state.feed){
            document.getElementById("feed").innerText += state.feed[x] + "\n";
        }
        updateScroll();
        
        // MARKET
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
            card_elem.addEventListener("click", function () {
                buy_card(card.id);
            });
        }

        // SELF
        let self_player = null;
        let stats = {"coins": 0, "bread": 0, "cup": 0, "fruit": 0, "tower": 0, "cow": 0, "factory": 0, "gear": 0, "wheat": 0}
        for (x in state.players){
            if (state.players[x].id == self_id){
                self_player = state.players[x]
            }
        }
        document.getElementById("field").innerHTML = "";
        for (let x = 0; x < self_player.cards.length; x++){
            let card = self_player.cards[x];

            if (card.name == "Train Station"){t_station = 1;}
            if (card.name == "Shopping Mall"){s_mall = 1;}
            if (card.name == "Amusement Park"){a_park = 1;}
            if (card.name == "Radio Tower"){r_tower = 1;}
            // stats
            stats[card.type] += (1 * card.quantity);

            var card_elem = document.createElement("div");
            var card_img = document.createElement("img");
            var card_num = document.createElement("span");

            var card_tip = document.createElement("span");
            card_tip.className = 'tooltip';
            card_tip.innerText = card.tip;
            card_elem.appendChild(card_tip);

            card_elem.className = "card";
            card_elem.id = card.id;
            card_img.src = "../img/" + card.image; 
            card_num.innerText = "x" +  card.quantity;
            card_elem.appendChild(card_img);
            if (card.quantity != null){ card_elem.appendChild(card_num); }
            document.getElementById("field").appendChild(card_elem);
            card_elem.addEventListener("click", function(){
                business_center_exception_2(this.id);
            });
        }
        document.getElementById("coins-val").innerText = self_player.coins;
        document.getElementById("bread-val").innerText = stats["bread"];
        document.getElementById("cup-val").innerText = stats["cup"];
        document.getElementById("fruit-val").innerText = stats["fruit"];
        document.getElementById("tower-val").innerText = stats["tower"];
        document.getElementById("cow-val").innerText = stats["cow"];
        document.getElementById("factory-val").innerText = stats["factory"];
        document.getElementById("gear-val").innerText = stats["gear"];
        document.getElementById("wheat-val").innerText = stats["wheat"];


        // OPPONENTS
        document.getElementById("opp").innerHTML = "";
        for (x in state.players){
            if (state.players[x] != self_player){
                var opp_elem = document.createElement("div");
                opp_elem.className = 'opp_block';
                opp_elem.innerHTML = "<h4>" + state.players[x].name + "</h4>";
                opp_elem.id = state.players[x].id;
                document.getElementById("opp").appendChild(opp_elem);
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
                    card_elem.id = card.id;
                    card_img.src = "../img/" + card.image; 
                    card_num.innerText = "x" +  card.quantity;
                    card_elem.appendChild(card_img);
                    if (card.quantity != null){ card_elem.appendChild(card_num); }
                    opp_elem.appendChild(card_elem);
                    card_elem.addEventListener("click", function () {
                        business_center_exception(this.parentNode.id, this.id);
                    })
                }
                
                opp_elem.addEventListener("click", function() {
                        tv_station_exception(this.id); // pass selection id to exception
                });
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
        return result;
    }

    // get all the action elements
    let waiting_elem = document.getElementById("waiting");
    let rolling_elem = document.getElementById("rolling");
    let buying_elem = document.getElementById("buying");
    let ending_elem = document.getElementById("ending");
    let exceptions_elem = document.getElementById("exceptions");

    function take_turn_pt1(){ // you are currently taking your turn
        in_turn = true;
        // hide waiting action because its your turn
        waiting_elem.style.display = "none";
        // ROLL PHASE
        rolling_elem.style.display = "inline-block"; // show action
        // WAITING FOR DICE ROLL
    }

    function take_turn_pt2(roll){
        let self_player = null;
        for (x in my_game_state.players){
            if (my_game_state.players[x].id == self_id){
                self_player = my_game_state.players[x]
            }
        }
        add_feed_msg(self_player.name + " rolled a " + roll + ".");
        // activate red ONLY FOR OTHER PLAYERS
        for (y in my_game_state.players){
            if (my_game_state.players[y].id != self_id){ // has to be your turn
                let this_player = my_game_state.players[y];
                for (x in this_player.cards){
                    if (this_player.cards[x].color == "red"){
                        let this_card = this_player.cards[x];
                        if (this_card.activation.includes(roll)){
                            add_feed_msg(this_player.name + "'s " + this_card.name + "(s) is activated.");
                            let take_value = this_card.value
                            if (s_mall && (this_card.type == "bread" || this_card.type == "cup")) {take_value += 1} // mod for shopping mall
                            for (j in my_game_state.players){
                                if (my_game_state.players[j].id == self_id){
                                    let affected_player = my_game_state.players[j];
                                    if (affected_player.coins >= take_value){
                                        affected_player.coins -= take_value;
                                        this_player.coins += take_value;
                                    }
                                    else{
                                        this_player.coins += affected_player.coins;
                                        affected_player.coins = 0;
                                    }
                                    my_game_state.players[j] = affected_player;
                                }
                            }
                        }
                    }
                }
                my_game_state.players[y] = this_player; // update player in state
            }
        }
        // activate blue CHECK FOR EVERYONE
        for (y in my_game_state.players){
            let this_player = my_game_state.players[y];
            for (x in this_player.cards){
                if (this_player.cards[x].color == "blue"){
                    let this_card = this_player.cards[x];
                    if (this_card.activation.includes(roll)){
                        this_player.coins += this_card.value * this_card.quantity;
                        add_feed_msg(this_player.name + "'s " + this_card.name + "(s) is activated.");

                        if (s_mall && (this_card.type == "bread" || this_card.type == "cup")) {this_player.coins += 1} // mod for shopping mall
                    }
                }
            }
            my_game_state.players[y] = this_player; // update player in state
        }
        // activate green ONLY FOR CURRENT PLAYER
        for (y in my_game_state.players){
            if (my_game_state.players[y].id == self_id){ // has to be your turn
                let this_player = my_game_state.players[y];
                for (x in this_player.cards){
                    if (this_player.cards[x].color == "green"){
                        let this_card = this_player.cards[x];
                        if (this_card.activation.includes(roll)){
                            add_feed_msg(this_player.name + "'s " + this_card.name + "(s) is activated.");
                            // exceptions
                            if (this_card.name == "Cheese Factory"){
                                this_player.coins += (3 * parseInt(document.getElementById("cow-val").innerText)) * this_card.quantity; // 3 per cow
                            }
                            else if (this_card.name == "Furniture Factory"){ 
                                this_player.coins += (3 * parseInt(document.getElementById("gear-val").innerText)) * this_card.quantity; // 3 per gear
                            }
                            else if (this_card.name == "Fruit and Vegetable Market"){
                                this_player.coins += (3 * parseInt(document.getElementById("wheat-val").innerText)) * this_card.quantity; // 2 per wheat
                            }
                            else{ this_player.coins += this_card.value * this_card.quantity; }
                            if (s_mall && (this_card.type == "bread" || this_card.type == "cup")) {this_player.coins += 1} // mod for shopping mall
                        }
                    }
                }
                my_game_state.players[y] = this_player; // update player in state
            }
        }
        // activate purple ONLY FOR CURRENT PLAYER
        for (y in my_game_state.players){
            if (my_game_state.players[y].id == self_id){ // has to be your turn
                let this_player = my_game_state.players[y];
                for (x in this_player.cards){
                    if (this_player.cards[x].color == "purple"){
                        let this_card = this_player.cards[x];
                        if (this_card.activation.includes(roll)){
                            add_feed_msg(this_player.name + "'s " + this_card.name + "(s) is activated.");
                            if (this_card.name == "TV Station"){
                                tv_station = true;
                            }else if(this_card.name == "Business Center"){
                                business_center = true;
                            }else{
                                let take_value = this_card.value;
                                for (j in my_game_state.players){
                                    if (my_game_state.players[j].id != self_id){ // affect every player but self
                                        let affected_player = my_game_state.players[j];
                                        if (affected_player.coins >= take_value){
                                            affected_player.coins -= take_value;
                                            this_player.coins += take_value;
                                        }
                                        else{
                                            this_player.coins += affected_player.coins;
                                            affected_player.coins = 0;
                                        }
                                        my_game_state.players[j] = affected_player;
                                    }
                                }
                            }
                        }
                    }
                }
                my_game_state.players[y] = this_player; // update player in state
            }
        }
        if (tv_station){ // exception hook 1
            rolling_elem.style.display = "none"; // hide prev
            exceptions_elem.style.display = "inline-block"; // hide action
            exceptions_elem.innerHTML = "";
            exceptions_elem.innerText = "Select a player to take 5 coins from."; // specific text for tv_station
        }
        else if (business_center){ // exception hook 2
            rolling_elem.style.display = "none"; // hide prev
            exceptions_elem.style.display = "inline-block"; // hide action
            exceptions_elem.innerHTML = "";
            exceptions_elem.innerText = "Select someone elses card to swap..."; // specific text for business center
        }
        else{ // turn proceeds without exception
            socket.emit("change_boardstate", my_game_state); // update state across players
            take_turn_pt3(); // move to part 3
        }
        
    }

    function take_turn_pt3(){
        rolling_elem.style.display = "none"; // hide prev
        buying_elem.style.display = "inline-block"; // show action
        // BUY PHASE
        buying = true;
    }

    function end_turn(){
        in_turn = false;
        if (extra_turn == false){ my_game_state.turn = (my_game_state.turn + 1) % my_game_state.players.length; }
        socket.emit("change_boardstate", my_game_state);
        waiting_elem.style.display = "inline-block"; // back to waiting
        buying_elem.style.display = "none"; // hide action
        ending_elem.style.display = "none"; // hide action
    }

    function buy_card(id){
        if (buying){
            let this_player = null;
            for (x in my_game_state.players){
                if (my_game_state.players[x].id == self_id){
                    this_player = my_game_state.players[x];
                }
            }
            for (x in my_game_state.market){                
                if (my_game_state.market[x].id == id){
                    let this_card = my_game_state.market[x];
                    if (this_card.quantity > 0 || this_card.quantity == null){
                        if (parseInt(document.getElementById("coins-val").innerText) >= this_card.cost){
                            if (my_game_state.market[x].quantity != null){
                                my_game_state.market[x].quantity -= 1;
                            }
                            add_card(this_card);
                            add_feed_msg(this_player.name + "   buys a " + this_card.name);
                            console.log(id);
                            buying = false;
                            ending_elem.style.display = "inline-block"; // back to waiting
                            buying_elem.style.display = "none"; // hide action
                            socket.emit("change_boardstate", my_game_state);
                        }else{
                            alert("you dont have enough coins to buy this card!");
                        }
                    }
                }
            }
        }
    }

    function add_card(card){
        for (x in my_game_state.players){
            if (my_game_state.players[x].id == self_id){
                let this_player = my_game_state.players[x];
                let target_stack = null;
                for (y in this_player.cards){
                    if (this_player.cards[y].id == card.id){
                        target_stack = y;
                    }
                }
                if (target_stack){ // buying a dupe
                    this_player.cards[target_stack].quantity += 1;
                    this_player.coins -= card.cost;
                    //add_feed_msg(this_player.name + " buys another " + card.name);
                }else{ // buying a new card
                    let new_card = card;
                    new_card.quantity = 1;
                    this_player.cards.push(new_card);
                    this_player.coins -= card.cost;
                    
                }

            }
        }
    }

    function add_feed_msg(msg){
        my_game_state.feed.push(msg);
    }

    function updateScroll(){
        var element = document.getElementById("feed");
        element.scrollTop = element.scrollHeight;
    }

    let swap_card = null; // business center tracking
    let swap_player = null;

    function tv_station_exception(id){
        if (tv_station){
            let target_ind = null;
            let self_ind = null;
            for (x in my_game_state.players){
                if (my_game_state.players[x].id == id){
                    target_ind = x;
                }
                if (my_game_state.players[x].id == self_id){
                    self_ind = x;
                }
            }
    
            if (my_game_state.players[target_ind].coins >= 5){
                my_game_state.players[target_ind].coins -= 5;
                my_game_state.players[self_ind].coins += 5;
            }
            else{
                my_game_state.players[self_ind].coins += my_game_state.players[target_ind].coins;
                my_game_state.players[target_ind].coins = 0;
            }
    
            
    
            tv_station = false;
            if (business_center){ // exception hook 2
                rolling_elem.style.display = "none"; // hide prev
                exceptions_elem.style.display = "inline-block"; // hide action
                exceptions_elem.innerHTML = "";
                exceptions_elem.innerText = "Select a player to take 5 coins from."; // specific text for tv_station
            }else{
                // END EXCEPTION IF THERE IS NO BUSINESS CENTER ACTIVATION
                exceptions_elem.style.display = "none";
                socket.emit("change_boardstate", my_game_state); // update state across players
                take_turn_pt3(); // move to part 3
            }
        }
        else{
            console.log("action denied");
        }
    }

    function business_center_exception(player_id, card_id){
        console.log("BUSINESS CENTER STUFF: " + player_id, card_id);
        if (business_center){
            swap_card = card_id;
            swap_player = player_id;

            business_center = false;
            business_center_2 = true;
            exceptions_elem.innerHTML = "";
            exceptions_elem.innerText = "Now select a card of your own to swap."; // specific text for business center
        }
        else{
            console.log("action denied");
        }
    }

    function business_center_exception_2(id){
        if (business_center_2){

            let card1 = null;
            let card2 = null;
            let player1 = null;
            let player2 = null;

            business_center_2 = false;
            let new_card = null;
            let new_card_2 = null;
            for (y in my_game_state.players){
                if (my_game_state.players[y].id == swap_player){
                    player2 = my_game_state.players[y].name;
                    for (z in my_game_state.players[y].cards){
                        if (my_game_state.players[y].cards[z].id == swap_card){
                            card2 = my_game_state.players[y].cards[z].name;
                            new_card = my_game_state.players[y].cards[z];
                        }
                    }
                }
                if (my_game_state.players[y].id == self_id){
                    player1 = my_game_state.players[y].name;
                    for (z in my_game_state.players[y].cards){
                        if (my_game_state.players[y].cards[z].id == id){
                            card1 = my_game_state.players[y].cards[z].name;
                            new_card_2 = my_game_state.players[y].cards[z];
                        }
                    }
                }
            }
            for (x in my_game_state.players){
                if (my_game_state.players[x].id == self_id){ // self player
                    let new_card_stack = null;
                    let stack_id = null;

                    for (y in my_game_state.players[x].cards){
                        if (my_game_state.players[x].cards[y].id == id){ // self selected card (swap away)
                            if (my_game_state.players[x].cards[y].quantity == 1){
                                my_game_state.players[x].cards.splice(y, 1);
                            }else{
                                my_game_state.players[x].cards[y].quantity -= 1;
                            }
                        }
                        if (my_game_state.players[x].cards[y].id == swap_card){ // other selected card (add one)
                            new_card_stack = my_game_state.players[x].cards[y];
                            stack_id = y;
                        }
                    }
                    if (new_card_stack){
                        my_game_state.players[x].cards[stack_id].quantity += 1;
                    }
                    else{
                        new_card.quantity = 1;
                        my_game_state.players[x].cards.push(new_card);
                    }
                }
                else if (my_game_state.players[x].id == swap_player){ // other player
                    let new_card_stack = null;
                    let stack_id = null;

                    for (y in my_game_state.players[x].cards){
                        if (my_game_state.players[x].cards[y].id == swap_card){
                            if (my_game_state.players[x].cards[y].quantity == 1){
                                my_game_state.players[x].cards.splice(y, 1);
                            }else{
                                my_game_state.players[x].cards[y].quantity -= 1;
                            }
                        }
                        if (my_game_state.players[x].cards[y].id == id){ // other selected card (add one)
                            new_card_stack = my_game_state.players[x].cards[y];
                            stack_id = y;
                        }
                    }
                    if (new_card_stack){
                        my_game_state.players[x].cards[stack_id].quantity += 1;
                    }
                    else{
                        new_card_2.quantity = 1;
                        my_game_state.players[x].cards.push(new_card_2);
                    }
                }
            }
            add_feed_msg("Swapped " + player2 + "'s " + card2 + " for " + player1 + "'s " + card1);

            // END EXCEPTIONS
            exceptions_elem.style.display = "none";
            swap_player = null;
            swap_card = null;
            socket.emit("change_boardstate", my_game_state); // update state across players
            take_turn_pt3(); // move to part 3
        }
        else{
            console.log("action denied");
        }
    }
});

