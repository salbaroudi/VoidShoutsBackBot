
//URLs and Settings
let TS_RULES_GET = "http://localhost:3001/api/rules";


function queryRules() {
    //First, lets just send a request.
    $.get(TS_RULES_GET, function(data, status) {
        $( "#outputs" ).html(JSON.stringify(data));
        console.log(JSON.stringify(data));
    });
  };

//Setup Buttons:
$( "#queryRules" ).on("click", queryRules);
