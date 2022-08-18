//This is a basic Express Middle-Ware /Backend implementation. Lets Provide the front end with
//parsed Twitter API endpoint responses.

var express = require('express');
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

//Request Header Print, for development;
app.use((req,res,next) => { //this will print to cmd line
  console.log(req.headers);
  //Always, to dodge CORS on our local machine.
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', "*");
  //don't forget to set ratelimit headers for later on [!!!]
  next();
})

//read out all of our JSON data, and write to cmd line.
//then send out an OK back to our front end.
app.get('/test', function(req, res) {
  console.log("GET request recieved");
  res.end(JSON.stringify({ answer: "Thank You." }));
});

app.post("/testpost", function(req, res) {
  console.log("POST received");
  console.log("Body Portion:", req.body);

  //Generate sample tweet response, for now.
  let jsonResponse = {tweetData:[],
  rateLimits: {"x-rate-limit-limit":50,
  "x-rate-limit-reset":"4:39",
  "x-rate-limit-remaining":20}};

  for (let i = 0; i < 10; i++) {
    jsonResponse["tweetData"].push({
      id:i,
      username: "user" + i,
      ruleMatch: "somerule number" + i,
      tweet:"hello".repeat(i)
    });
  }

  res.end(JSON.stringify(jsonResponse));
})

app.listen(3000); //just listen on standard port, no callback.

/* References:

[1] Responding with Json properly:
https://stackoverflow.com/questions/19696240/proper-way-to-return-json-using-node-or-express

[2] Make a fetch within Express Middleware:
https://stackoverflow.com/questions/66087766/can-i-make-a-fetch-request-from-an-express-request-handler-or-middleware




*/
