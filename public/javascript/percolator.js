/**
 * Created by tjeuj_000 on 24-11-2015.
 */



var connection = new WebSocket("ws://localhost:3000");

window.onload = function () {
    console.log("LOADING ALL MEMORY MODELS");
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", '/api/MemoryModels', true);
    xhttp.onload = function (e) {
        var res = JSON.parse(xhttp.responseText);
        console.log(xhttp.response);
        console.log(res);

        // SET MEMORY MODELS IN SELECTBOX
        var memoryModels = res.data;
        var sel = document.getElementById('memoryModelsList');
        for (var i = 0; i < memoryModels.length; i++) {
            var opt = document.createElement('option');
            opt.innerHTML = memoryModels[i].name;
            opt.value = memoryModels[i].id;
            sel.appendChild(opt);
        }
    };
    xhttp.send();
};

function chooseMemoryModel(id) {
    console.log("GET SELECTED MEMORY MODEL");
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", '/api/MemoryModels/' + id, true);
    xhttp.send();
}


