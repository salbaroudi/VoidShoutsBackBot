const express = require("express");
const bodyParser = require("body-parser");
const util = require("util");
const request = require("request");
const path = require("path");
const cors = require("cors")
const socketIo = require("socket.io");
const http = require("http");
const fs = require("fs");

//Load our config file into the process.env varible:
//-------------------------------------------------------
require("dotenv").config();
let PORT;
let BEARER_TOKEN;
let FILE_PATH;
if (process.env.PORT) {
  PORT = process.env.PORT || 3002;
  BEARER_TOKEN = process.env.BEARER_TOKEN;
  FILE_PATH = process.env.FILE_PATH;
  console.log("Port#: " + PORT);
  console.log("Using root file path: " + FILE_PATH);
} else {
  throw Error("Configuration file (.env) NOT loaded. Please check project configuration.")
}


let fileNamePrefix = "";
//------------------------
//URL and canned responses objects.
//--------------------------------
const streamURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=created_at,public_metrics&expansions=author_id,referenced_tweets.id"
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
const noPathMessage = {
  title: "Could not load file path.",
  details: [
    'Could not find filepath! Check your .env and dotenv setup!'
  ],
  type: "Problematic .env",
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
//These errors will appear when we start our first query, not onLoad.
app.use(function (req, res, next) {
  if (!BEARER_TOKEN) {
    res.status(400).send(authMessage);
  }
  if (!FILE_PATH) {
    res.status(400).send(authMessage);
  }
  next();
});
//Create a server that accepts http requests at port 3001, using our express middleware instance.
const server = http.createServer(app);
const io = socketIo(server);


//Route for Listed Rules.
app.get("/api/rules", async (req, res) => {
  try {
    const response = await get({ url: rulesURL, auth: { bearer: BEARER_TOKEN }, json: true });

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
  }
});

//Our route to submit rules to our twitter account.
app.post("/api/rules", async (req, res) => {
  if (!req.body) {
    res.status(400).send("ERROR: POST Body is empty!");
  }

  let ruleChanges = { add: req.body };
  try {
    const response = await post({ url: rulesURL, auth: { bearer: BEARER_TOKEN }, json: ruleChanges });
    console.log(response.body);
    res.send(response.body);
    //If there is a rule error, we still get status 200 ...:/
    if (response.statusCode === 200 || response.statusCode === 201) {
      if (response.body.errors) {
        res.status(400).send(response.body.errors);
      }
    }
    else {
      console.log("Unknown Error detected in rules POST route.");
      throw new Error(response);
    }
  } catch (e) {
    res.send(e);
  }
});

//This is fucked. Why?
//This route is used  to delete all our rules. We hide ID's from user UI, for simiplicity. 
app.get("/api/rules/delete", async (req, res) => {
  const idArray = [];

  try {
    const response = await get({ url: rulesURL, auth: { bearer: BEARER_TOKEN }, json: true });

    if (response.statusCode !== 200) {
      if (response.statusCode === 403) {
        res.status(403).send(response.body);
      } else {
        throw new Error(response.body.error.message);
      }
    }

    //We get this far and then FREEZE. WHY?
    //No Errors, pull the IDs
    idArray = (response.body.data).map((entry) => entry.id);
    console.log("IDs found:: " + idArray);
    //Now lets make a delete request.
    let ruleChanges = { delete: { ids: idArray } };

    const response2 = await post({ url: rulesURL, auth: { bearer: BEARER_TOKEN, }, json: ruleChanges });

    if (response2.statusCode === 200 || response2.statusCode === 201) {
      if (response2.body.errors) {
        res.status(400).send(response2.body.errors);
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

app.get("/api/stream/:fileName", async (req, res) => {
  //getfilenamefrom parameters.
  let fileName = req.params.fileName;
  if (!fileName){
    res.status(400).send("Error: No fileName in URL string!");
  }

  if (fileName.includes(".") || fileName.includes("/")) {
    res.status(400).send("Error: FileName cannot contain dots or slashes. Just a name with no spaces only.");
    res.end();
  }
  //Set global filename variable.
  let filepath = FILE_PATH + fileName + ".twts";
  console.log("Filepath for tweet capture: " + filepath);

  function streamConnect(retryAttempt, clientResponse) {
    const config = {
      url: streamURL,
      auth: {
        bearer: BEARER_TOKEN,
      },
      timeout: 31000,
    };

    //Stream should be a Response object handed to us by the twitter end-point.
    const stream = request.get(config);

    //The data we get back is in ArrayBuffer form - but apparently JSON.parse still handles it (?)
    //middling-ware I don't know about ???
    stream.on('data', data => {
      try {
        clientResponse.write(data);
        const jsonObj = JSON.parse(data);
        fs.writeFile(filepath, JSON.stringify(jsonObj)+"\r\n", { flag: 'a' }, err => {});
        console.log(jsonObj);
        retryAttempt = 0;
      } catch (e) {
        if (data.detail === "This stream is currently at the maximum allowed connection limit.") {

          console.log(data.detail)
          process.exit(1)
        } else {
          // Keep alive signal received. Do nothing.
        }
      }
    }).on('err', error => {
      if (error.code !== 'ECONNRESET') {
        console.log(error.code);
        process.exit(1);
      } else {
        // To avoid rate limits, this logic implements exponential backoff, so the wait time
        setTimeout(() => {
          console.warn("A connection error occurred. Reconnecting...")
          streamConnect(++retryAttempt);
        }, 2 ** retryAttempt)
      }
    });

    return stream;
  }
  res.setHeader('Content-Type', 'application/json'); //text/html; charset=utf-8
  res.setHeader('Transfer-Encoding', 'chunked');
  console.log("stream about to connect");
  let streamObject = streamConnect(0, res); //not async. We sit with returned stream object with .on() events connected.
  //For now, we terminate all this with a terminate process command via cmd line. /:(
  
});


server.listen(PORT, () => console.log(`Listening on port ${PORT}`));


/* References:
Large code snippets have been taken from the following sources, and modified accordingly:

Node-HTTP Streaming Code: https://stackoverflow.com/questions/38788721/how-do-i-stream-response-in-express
Usage of Fetch and readible stream: https://stackoverflow.com/questions/44493340/reading-files-in-chunks-using-ajax-javascript
Twitter SDK Examples with Typescript: https://github.com/twitterdev/twitter-api-typescript-sdk
Tony Vu's real-time-tweet-streamer (React+Sockets): https://github.com/twitterdev/real-time-tweet-streamer/blob/master/server/server.js
Filewriting with Node: https://nodejs.dev/learn/writing-files-with-nodejs
*/