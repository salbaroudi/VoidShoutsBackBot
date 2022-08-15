## Building a Flitered Stream Twitter Bot.

Before I dive into building the bot, I need to get some filtered stream data and test filtering strings,
to narrow down my selected tweet stream. From this, I need to use data analysis + metrics to quantify
how "good" my narrowed stream is, and come up with a once-a-day tweet selector criteria.

For the first stage of this project, I need to

1) Access the Twitter API V2 with a dynamic console that I will build myself.

2) Find a rough parameter set that gives us "good enough" tweets.

3) Collect tweets using a dedicated connection, and write them to JSON files.

Tweets will be inspected manually, and our filtering rules will be refined.
There is potential for a Jupyter Data Project here...but one thing at a time.


## Proposed Browser Console:

Will use the following technologies.

- HTML+CSS3+JS+JQuery => To send requests to our middleware/back-end.

- Express.js: will interface with our Twitter Endpoints, gather tweets and act as middleware.

Technically, the fastest way to do this would be to just copy and tweak the following [official Twitter tutorial](https://developer.twitter.com/en/docs/tutorials/building-an-app-to-stream-tweets), which merges common React patterns and Express to achieve a similar result. [This tutorial](https://www.tutorialspoint.com/expressjs/index.htm) is also used to setup my project 

However...my understanding of Express is shoddy, and completely intertwined with React usage.

Instead, I will use jQuery to talk to an Express Middleware and Back-end, to get our tweets. This is more involved, but will fill in a lot of holes in my
web dev understanding. This is also required because Twitter APIv2 will trigger CORS requests - it cannot easily be run in browser. As I can find no obvious 
Parcel/Browserify solutions, the endpoints must be called from a back-end script. A back-end request statement should in theory not trigger CORS, as far as I am aware.
