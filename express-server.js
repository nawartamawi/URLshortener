//adding the express library
const express = require("express");
var app = express();

//Specify what Port to use
var PORT = process.env.PORT || 8080;
//Import the random string Genrator
const generateRandomString = require("./generateRandomString");

//adding the middleware bodyparser library
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Specify the engine to render pages (EJS)
app.set("view engine", "ejs");

//our in memory db
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//redirecting to /urls when requesting /
app.get('/', (req, res) => {
  res.redirect('/urls');
});

//Render urls_index.ejs to an HTML page when getting a GET request of root path of ./urls
app.get('/urls', (req, res) => {
  let templateVars = {url: urlDatabase};
  res.render("urls_index", templateVars);
});

//Render urls_new to an HTML page when getting a GET request of root path of ./urls/new
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Render urls_show to an HTML page when getting a GET request with the shortURL embedded in the URL like locahost/urls/:nd33nz
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = "http://"+longURL;
// redirect to the url/shorturl
  res.redirect('/urls/' + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  // let longURL = ...
  // res.send(req.params.shortURL);
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  if (longURL === undefined) {
    res.status(404).send(`${shortURL} is not found`);
    return;
  }
//redirect to the long url found in DB
  res.redirect(longURL);
});


//Keeping the server running 
app.listen(PORT);
console.log("server is running");