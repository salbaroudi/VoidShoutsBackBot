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

const app = express();
//Note: These are used to relay requests from client to Twitter API.
const post = util.promisify(request.post);
const get = util.promisify(request.get);

//Standard middleware modules.
app.use(cors());
//app.use(express.json());
//will pull out our stringified JSON, and convert it to a JSON object.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Create a server that accepts http requests at port 3001, using our express middleware instance.
const server = http.createServer(app);
const io = socketIo(server); 

//URL and canned responses objects, instead of in-line string entry (sloppy).
//--------------------------------
const streamURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=context_annotations&expansions=author_id"
);
const rulesURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream/rules"
);
const errorMessage = {
  title: "Please Wait",
  detail: "Waiting for new Tweets to be posted...",
};
const authMessage = {
  title: "Could not authenticate",
  details: [
    `Please make sure your bearer token is correct.
      If using Glitch, remix this app and add it to the .env file`,
  ],
  type: "https://developer.twitter.com/en/docs/authentication",
};
//---------------------------------


async function getRules() {
  let response = await get({
    url: rulesURL,
    auth: {
      bearer: BEARER_TOKEN,
    },
    json: true,
  });
  return response;
}


//Basic Route to get our listed rules.
app.get("/api/rules", async (req, res) => {
  try {
    const response = await getRules();
    if (response.statusCode !== 200) {
      if (response.statusCode === 403) { //This is forbidden.
        res.status(403).send(response.body); //our res is for our client. our response is from twitter.
      } else { //For everything else that is not 200, throw a standard error to console!
        throw new Error(response.body.error.message);
      }
    }
    //It is 200, lets send what we got from twitter, to our client.
    res.status(200).send(response.body.data);
} catch (e) {
    res.send(e);
}
});

async function pushRuleChanges(ruleChanges) {  
    const response = await post({
      url: rulesURL,
      auth: {
        bearer: BEARER_TOKEN,
      },
      json: ruleChanges,
    });

}

//Our route to submit rules to our twitter account.
//This also handles rule clearning (submit null object).
app.post("/api/rules", async (req, res) => {
  if (!BEARER_TOKEN) {
    res.status(400).send(authMessage);
  }
  
  try {
    const response = await pushRuleChanges({ add: req.body });

    //Strangely, malformed and duplicate rules give status 200 (!!)
    if (response.statusCode === 200 || response.statusCode === 201) {
      let rbe = response.body.errors;
      res.status(400);
      res.send(rbe); 
    }
     else {
      console.log("We detected an unspecified error");
      throw new Error(response);
    }
  } catch (e) {
    res.send(e);
  }
});

//This custom path does not match twitter API. Used to delete all our rules with simple 
//to understand code
app.get("/api/rules/delete", async (req, res) => {
  var idArray = [];
  try {
    const response = await getRules();
    if (response.statusCode !== 200) {
      if (response.statusCode === 403) { //This is forbidden.
        res.status(403).send(response.body); //our res is for our client. our response is from twitter.
      } else { //For everything else that is not 200, throw a standard error to console!
        throw new Error(response.body.error.message);
      }
    }

  //No Errors, pull the IDs
  idArray = (response.body.data).map((entry) => entry.id);
  console.log(idArray); 
  //Now lets make a delete request.

  const response2 = await pushRuleChanges({delete:{ ids:idArray }});

  if (response2.statusCode === 200 || response2.statusCode === 201) {
    let rbe2 = response2.body.errors;
    res.status(400);
    res.send(rbe2); 
  }
   else {
    console.log("We detected an unspecified error");
    throw new Error(response);
  }
} catch (e) {
  res.send(e);
}
});

server.listen(port, () => console.log(`Listening on port ${port}`));
