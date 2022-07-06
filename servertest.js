var express = require('express');
var app = express();

//Here, our exported router object has been renamed things.
var things = require("./things.js");

//when we hit the things path, the things object contains our callbacks.
app.use("/things", things);

//specifies a get request pointing to the root path.
//Request and response object are exposed, and can be manipulated by us.
app.get('/:id', function(req, res) {

  res.send('The id you specified is ' + req.params.id);

});

app.get('/:p1/:p2', function(req, res) {

  res.send("Parameter 1:" + req.params.p1 + "Parameter 2" + req.params.p2);

});


app.post('/hello', function(req, res){
   res.send("You just called the post method at '/hello'!\n"); //Interesting: Doesn't wrap in html - just plaintext.
});

//Use all for our middleware?
app.all("/other", function(req, res) {
  res.send("A GET, POST, DELETE, etc... will trigger this message");
})

app.listen(3000); //just listen on standard port, no callback.
