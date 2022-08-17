const express = require("express");
const bodyParser = require("body-parser");
const util = require("util");
const request = require("request");
const path = require("path");
const cors = require("cors")
const socketIo = require("socket.io");
const http = require("http");

//Load our config file into the process.env varible:
//-------------------------------------------------------
require("dotenv").config();
let PORT;
let BEARER_TOKEN;
if (process.env.PORT) {
    port = process.env.PORT || 3002;
    BEARER_TOKEN = process.env.BEARER_TOKEN;
    console.log("Port#: " + PORT);
    console.log("Bearer Token: " + BEARER_TOKEN);
} else {
    throw Error("Configuration file (.env) NOT loaded. Please check project configuration.")
}
//------------------------
//URL and canned responses objects.
//--------------------------------
const streamURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=context_annotations&expansions=author_id"
);
const rulesURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream/rules"
);
const authMessage = {
  title: "Could not authenticate",
  details: [
    'Could not find the Bearer token! Check your .env and dotenv setup!'
  ],
  type: "https://developer.twitter.com/en/docs/authentication",
};
//---------------------------------

const app = express();
const post = util.promisify(request.post);
const get = util.promisify(request.get);

//Standard middleware modules.
//All requests will be passed through these, in the order shown.
app.use(cors());
//app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req,res,next) {
  if (!BEARER_TOKEN) {
    res.status(400).send(authMessage);
  }
  next();
});
//Create a server that accepts http requests at port 3001, using our express middleware instance.
const server = http.createServer(app);
const io = socketIo(server); 

//Warning! This causes our Express -> Twitter request to timeout,
//or report nothing in the console.log() or res.send()
//Why? Because we end up with a 2 layer promise, I suspect.
//Dump it.
/*
async function pushRuleChanges(ruleChanges) {  
    const response = await post({
      url: rulesURL,
      auth: {
        bearer: BEARER_TOKEN,
      },
      json: ruleChanges,
    });
}
*/

//Avoiding the double await again. This is put inline.
/*async function getRules() {
  let response = await get({
    url: rulesURL,
    auth: {
      bearer: BEARER_TOKEN,
    },
    json: true,
  });
  return response;
}
*/

//Get our listed rules.
app.get("/api/rules", async (req, res) => {
  try {
    const response = await get({url: rulesURL, auth: {bearer: BEARER_TOKEN}, json: true});    
    
    if (response.statusCode !== 200) {
      if (response.statusCode === 403) { //Forbidden
        res.status(403).send(response.body); //our res is for our client. our response is from twitter.
      } else { 
        console.log("Unknown Error detected in rules GET route.");
        throw new Error(response.body.error.message);
      }
    }
    console.log(response.body.data); //If successful, our rules.
    res.status(200).send(response.body.data);
} catch (e) {
    res.send(e);
}});

//Our route to submit rules to our twitter account.
app.post("/api/rules", async (req, res) => {
  if (!req.body) {
    res.status(400).send("ERROR: POST Body is empty!");
  }

  let ruleChanges = { add: req.body };
  try {
    const response = await post({url: rulesURL, auth: {bearer: BEARER_TOKEN}, json: ruleChanges});
    console.log(response.body);
    res.send(response.body);
    //If there is a rule error, we still get status 200 ...:/
    if (response.statusCode === 200 || response.statusCode === 201) {
     /* if (!response.body.errors) {
        res.status(400).send(response.body.errors);
      }*/
    
    }
     else {
      console.log("Unknown Error detected in rules POST route.");
      throw new Error(response);
    }
  } catch (e) {
    res.send(e);
  }
});

//This custom path does not match twitter API. Used to delete all our rules with simple 
app.get("/api/rules/delete", async (req, res) => {
  var idArray = [];
  try {
    const response = await get({ url: rulesURL,auth: { bearer: BEARER_TOKEN}, json: true});    
    
    if (response.statusCode !== 200) {
      if (response.statusCode === 403) {
        res.status(403).send(response.body); 
      } else { 
        throw new Error(response.body.error.message);
      }
    }

  //No Errors, pull the IDs
  idArray = (response.body.data).map((entry) => entry.id);
  console.log(idArray); 
  //Now lets make a delete request.
  let ruleChanges = {delete:{ ids:idArray }};
  const response2 = await post({url: rulesURL, auth: {bearer: BEARER_TOKEN,}, json: ruleChanges});

  if (response2.statusCode === 200 || response2.statusCode === 201) {
    let rbe2 = response2.body.errors;
    if (rbe2 != null) {
      res.status(400).send(rbe2);   
    }
    console.log(response2.body);
    res.send(response2.body);
  }
   else {
    console.log("Unknown Error detected in rules delete route.");
    throw new Error(response);
  }
} catch (e) {
  res.send(e);
}
});

/* This is a great async example. Before, I tried to use a loop
to call setTimeout(), with our res.write() built into a curried call.
What we ended up with was the loop running through, and stacking all the setTImeouts quickly.
They all timed out within a few ms of each other, and data is not delivered smoothly.

The problem with a loop is that it is not coupled to the timeout in anyway (hence the event pile-up).
The code below solves the problem. Our function that we call calls itselt with a curried timeout.
This causes our chunks to be smoothly delivered. 

The general idea: we want to call a funcition with a certain timeout, AFTER its previous call has finished work.
Thus, the function must call setTimeout with ITSELF.
*/

///From this example, we showed how to basically stream text to our UI console. Our chunks can be large (100s of text words).
//So we don't need any special controller or Reader options to handle this...assuming we can use JSON.parse() on our chunk data
//reliably.
var sendAndSleep = function (response, counter, jsonObj) {
  if (counter > 20) {
    response.end();
  } else {
    jsonObj.value=counter;
    jsonObj.field1="test".repeat(counter);
    response.write(JSON.stringify(jsonObj));
    counter=counter+2;
    setTimeout(function () {
      sendAndSleep(response, counter,jsonObj);
    }, 200)
  };
};

//Test Stream route.
app.get("/api/stream", async (req, res) => {
  res.setHeader('Content-Type', 'application/json'); //text/html; charset=utf-8
  res.setHeader('Transfer-Encoding', 'chunked');

  sendAndSleep(res,0,{value:0,field1:"t",field2:"constant string..."});

});




server.listen(port, () => console.log(`Listening on port ${port}`));


/* References:
Node-HTTP Streaming Code: https://stackoverflow.com/questions/38788721/how-do-i-stream-response-in-express
Usage of Fetch and readible stream: https://stackoverflow.com/questions/44493340/reading-files-in-chunks-using-ajax-javascript






*/