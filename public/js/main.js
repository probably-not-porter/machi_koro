$( document ).ready(function() {
    const socket = io();
    var loaded = false;
    var instance = false;

    socket.on("start_board", function (data) {
        console.log('test');
        console.log(data);
    });
});