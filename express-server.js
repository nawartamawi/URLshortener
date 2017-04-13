//adding the express library 
const express = require("express");
var app = express();


//Specify what Port to use
var PORT = process.env.PORT || 8080;
//Import the random string Genrator
const generateRandomString = require("./generateRandomString");

//adding the middleware bodyparser and cookie-parser libraries
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


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
  let templateVars = {
    url: urlDatabase,
    username: req.cookies['username']
  };
  res.render("urls_index", templateVars);
});

//Render urls_new to an HTML page when getting a GET request of root path of ./urls/new
app.get("/urls/new", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//Render urls_show to an HTML page when getting a GET request with the shortURL embedded in the URL like locahost/urls/:nd33nz
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
// redirect to the url/shorturl
  res.redirect('/urls/' + shortURL);
});

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  if (longURL === undefined) {
    res.status(404).send(`${shortURL} is not found`);
    return;
  }
//redirect to the long url found in DB
  res.redirect(longURL);
});

//removes a URL resource by using the shortURL passed as Params.
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//edit the database with the new input (from coming from the form) and go back to /urls
app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

//Saving username cookies here
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username', { path: '/' });
  res.redirect('/urls');
});

//Keeping the server running
app.listen(PORT);
console.log("server is running");