
//URLs and Settings
let TS_RULES_URL = "http://localhost:3001/api/rules";

let TS_RULES_URL_DELETE = "http://localhost:3001/api/rules/delete";

let TS_FSTREAM_URL = "http://localhost:3001/api/stream/";


function queryRules() {
    //First, lets just send a request.
    $.get(TS_RULES_URL, function(data, status) {
        $( "#outputs" ).html(JSON.stringify(data));
    });
  };

function deleteRules() {
    //First, lets just send a request.
    $.get(TS_RULES_URL_DELETE, function(data, status) {
        $( "#outputs" ).html("");
    });
  };


function updateRules() {
    let filterStrings = []; 
    $("[id*='input']").each((index,elem) => {
        if ($( elem ).val().length > 0) {
            filterStrings.push($( elem ).val());
        }
    });
    let jsonArray = [];
    for (let index in filterStrings) {
        let hold = filterStrings[index];
        let predBraces = ((hold[0] == "{") && (hold[hold.length-1] == "}"));
        let predComma = (hold.includes(","));
        if (predBraces&&predComma) {
                jsonArray.push(JSON.parse(hold));
        }
    }   
    //Next we check to see if our json objects are well formed.
    //based and reduce-pilled {8^).
    const predicate = jsonArray.reduce(
        (prevV, currV) => ( ("value" in currV)&&("tag" in currV))&&(prevV),true
    );
    if (predicate) {
        //We have successfully formed a JSON Array with filter strings. Send it to B-E.
        console.log("Our Data to Send:");
        console.log(jsonArray)
        //We must send a plain object or string for data field...Array of Jsons doesn't work
        //Args: URL, data, params plain Object
        //let response = $.post(TS_RULES_URL,JSON.stringify(jsonArray),{contentType: "application/json",dataType: "json"});
        let response = $.ajax({url:TS_RULES_URL, type:"POST", data:JSON.stringify(jsonArray),
        contentType:"application/json; charset=utf-8", dataType:"json", 
        error: function(e) {
            console.log(e.responseText);
            $( "#outputs" ).html(e.responseText);
        }});
      
        response.done(function (data, textStatus, jqXHR) {
            console.log("Returned Data:: " + data.data);
            console.log("Returned Data:: " + data.meta);
        });
    } else {
        alert("You don't have 'tags' and 'value' fields in all your filter strings. Double check!");
    }
    return;
}

function getLimits() {
    $.get(TS_RULES_URL, function(data, status) {
        $( "#outputs" ).html(data);
    });
}

//Using fetch, we set up a reader on the response.body that is periodically being assembled (via chunking).
//Note the recursive onComplete function we use. It terminates itself when result.done()
//To process an unknown amount of data, the below function structure is a kind of design pattern to know!

function streamConnect() {
    //First, lets get our fileName parameter.
    let filePath = $( "#inputfilepath" ).val();

    if (filePath.length == 0) {
        alert("Empty filepath. Please check input box");
        return;
    }

    //Lets use fetch to process our stream with a reader.
    let reqObj = new Request(TS_FSTREAM_URL+filePath, {method:"GET",mode:"cors",cache:"no-store"});
    var decoder = new TextDecoder();
    var jsonString; var jsonObj;
    let hold = fetch(reqObj)
    .then(function (response) {
        let myReader = response.body.getReader();
        myReader.read().then(function processResult(result) {
            if (result.done) {
                return;
            }
            jsonString = decoder.decode(result.value, {stream: true});
            console.log(jsonString);
            //jsonObj = JSON.parse(jsonString);
            //console.log(jsonObj.field1); //lets see what we get...
            return myReader.read().then(processResult);
        });
    });
}


//Setup Buttons:
$( "#queryRules" ).on("click", queryRules)
$( "#updateRules" ).on("click", updateRules);
$( "#deleteRules" ).on("click", deleteRules);
$( "#streamConnect" ).on("click", streamConnect);

