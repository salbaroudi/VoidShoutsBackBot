
//URLs and Settings
let TS_RULES_URL = "http://localhost:3001/api/rules";

function queryRules() {
    //First, lets just send a request.
    $.get(TS_RULES_URL, function(data, status) {
        $( "#outputs" ).html(JSON.stringify(data));
        console.log(JSON.stringify(data));
    });
  };

function updateRules() {
    //First, we must construct an object container for our rules.
    //read strings from all filter string fields.
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
    console.log(jsonArray);   
    //Next wecheck to see if our json objects are well formed.
    //based and reduce-pilled {8^).
    const predicate = jsonArray.reduce(
        (prevV, currV) => ( ("value" in currV)&&("tags" in currV))&&(prevV),true
    );
    if (predicate) {
        //We have successfully formed a JSON Array with filter strings. Send it to B-E.
        let response = $.post(TS_RULES_URL,jsonArray);
        response.done(function (data, textStatus, jqXHR) {
            console.log(data);
            console.log(textStatus);
            console.log(jqXHR);
        });
    } else {
        alert("You don't have 'tags' and 'value' fields in all your filter strings. Double check!");
    }
    return;
}


//Setup Buttons:
$( "#queryRules" ).on("click", queryRules);
$( "#updateRules" ).on("click", updateRules);
