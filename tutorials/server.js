const express = require("express");
const bodyParser = require("body-parser");
const util = require("util");
const request = require("request");
const path = require("path");

const socketIo = require("socket.io");
const http = require("http");

const app = express();
let port = process.env.PORT || 3000;
//So our get and post requests are wrapped in a promise.
const post = util.promisify(request.post);
const get = util.promisify(request.get);

//these let us load middleware modules. All of our requests will pass though these functions, in sequence.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Create a server that accepts http requests at port 3000, using our express middleware instance.
const server = http.createServer(app);
const io = socketIo(server);

//This must be loaded for all node.js scripts. No import visible for this. Just setup .env file with string tokens.
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
let timeout = 0;

//URL and canned responses objects, instead of in-line string entry (sloppy).
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

//Sleep with a ms parameter. Nice Arrow funciton usage here - very terse.
const sleep = async (delay) => {
  return new Promise((resolve) => setTimeout(() => resolve(true), delay));
};

//We are not making a get request, we are handling one. This is a route handler
app.get("/api/rules", async (req, res) => {
  //Check if our token was loaded.
  if (!BEARER_TOKEN) {
    res.status(400).send(authMessage);
  }

  const token = BEARER_TOKEN;
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token,
    },
    json: true,
  };

  try {
    //Send our request to twitter, get our rules packet.
    const response = await get(requestConfig);

    //These catch if the request screwed up. 200 is OK.
    if (response.statusCode !== 200) {
      if (response.statusCode === 403) { //This is forbidden.
        res.status(403).send(response.body); //our res is for our client. our response is from twitter.
      } else { //For everything else that is not 200, throw a standard error to console!
        throw new Error(response.body.error.message);
      }
    }

    //It is 200, lets send what we got from twitter, to our client.
    res.send(response);
  } catch (e) {
    res.send(e);
  }
});

//Similar to app.get() above, but with a post request.
app.post("/api/rules", async (req, res) => {
  if (!BEARER_TOKEN) {
    res.status(400).send(authMessage);
  }

  const token = BEARER_TOKEN;
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token,
    },
    json: req.body,
  };

  try {
    const response = await post(requestConfig);

    if (response.statusCode === 200 || response.statusCode === 201) {
      res.send(response);
    } else {
      throw new Error(response);
    }
  } catch (e) {
    res.send(e);
  }
});

//This is what we are mainly what we want to do, with this script. Core reason.

const streamTweets = (socket, token) => {
  let stream;

  //set it up. Stream URL, and our token we loaded
  const config = {
    url: streamURL,
    auth: {
      bearer: token,
    },
    timeout: 31000,
  };
  //Send it to twitter.
  try {
    
    const stream = request.get(config);

    stream
      .on("data", (data) => {
        try {
          const json = JSON.parse(data);
          if (json.connection_issue) {
            socket.emit("error", json);
            reconnect(stream, socket, token);
          } else {
            if (json.data) {
              socket.emit("tweet", json);
            } else {
              socket.emit("authError", json);
            }
          }
        } catch (e) {
          socket.emit("heartbeat");
        }
      })
      .on("error", (error) => {
        // Connection timed out
        socket.emit("error", errorMessage);
        reconnect(stream, socket, token);
      });
  } catch (e) {
    socket.emit("authError", authMessage);
  }
};

const reconnect = async (stream, socket, token) => {
  timeout++;
  stream.abort();
  await sleep(2 ** timeout * 1000);
  streamTweets(socket, token);
};

//This would be our main driver function.
//stream tweets 
io.on("connection", async (socket) => {
  try {
    const token = BEARER_TOKEN;
    io.emit("connect", "Client connected");
    const stream = streamTweets(io, token);
  } catch (e) {
    io.emit("authError", authMessage);
  }
});

console.log("NODE_ENV is", process.env.NODE_ENV);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../build")));
  app.get("*", (request, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
} else {
  port = 3001;
}

server.listen(port, () => console.log(`Listening on port ${port}`));
