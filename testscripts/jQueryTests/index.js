//Call JSON

function callServer() {
  //First, lets just send a request.
  $.get("http://localhost:3000/test", function(data, status) {
    console.log(data["answer"]);
    console.log(status);
  });
};

function callServerPOST() {
//In this test request, we will read all of our filter strings,
  let jsonObj = {command:"connect",fstrings:{}};

  $('input[id^="input"]').each(function(index) {
    ($( this ).val() != "")? jsonObj["fstrings"]["input" + index] = $( this ).val():null;
  });

$.post("http://localhost:3000/testpost", jsonObj, function(data,status) {
  //write tweet limits to info console.
  if (data["rateLimits"] != undefined) {
    var tempHTML = "<div class='sessioninfo'><b>Requests Remaining::</b> ";
    tempHTML += data["rateLimits"]["x-rate-limit-remaining"] + "  /  " +  data["rateLimits"]["x-rate-limit-limit"];
    tempHTML += ". <b>Time Until Session Reset::</b> " + data["rateLimits"]["x-rate-limit-reset"];
    console.log(tempHTML);
    $("#streamlimitoutput").html(tempHTML);
  }
  if (data["tweetData"] != undefined) {
    console.log(data["tweetData"][3]);
    var tempTweets = "<div id='mainblock'>";
    for (let i = 0; i < data["tweetData"].length; i++) {
      let holdRef = data["tweetData"][i];
      tempTweets+= "<div class='tweet'><span><b>ID:</b>"+holdRef["id"]+"</span> ";
      tempTweets+= "<span><b>User:</b>"+holdRef["username"]+",</span> ";
      tempTweets+= "<span><b>Rule:</b>"+holdRef["ruleMatch"]+",</span> ";
      tempTweets+= "<span><b>Tweet:</b>"+holdRef["tweet"]+"</span></div>";
    }
    console.log(tempTweets);
    $("#outputs").html(tempTweets);
  }
});
}

//JQuery onLoad event handlers.
$("#connect").on( "click", callServerPOST);
