$( document ).ready(function() {
    const socket = io();
    socket.emit("request_boardstate");

    socket.on("display_boardstate", function (data) {
        console.log('displaying cards...');

        for (let x = 0; x < data.length; x++){
            console.log(data[x]);
            let card = data[x];

            var card_elem = document.createElement("div");
            var card_img = document.createElement("img");
            var card_num = document.createElement("span");

            card_elem.className = "card";
            card_img.src = "../img/" + card.image; 

            card_num.innerText = "x" +  card.quantity;

            card_elem.appendChild(card_img);
            card_elem.appendChild(card_num);

            document.getElementById("decks").appendChild(card_elem)
        }
    });
});