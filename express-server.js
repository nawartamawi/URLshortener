//adding the express library
const express = require("express");
var app = express();

//Specify what Port to use
var PORT = process.env.PORT || 8080;
//Import the random string Genrator and URls for a spcific user functions
const generateRandomString = require("./generateRandomString");
const urlsForUser = require("./urlsForUser");

//adding the middleware bodyparser and cookie-parser libraries
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//Authntication function to pass to the route
const auth = (req, res, next) => {
  if(req.cookies["user_id"]){
    next();
  } else {
    res.status(401).send("cannot access this page, login first");

  }
};

//Specify the engine to render pages (EJS)
app.set("view engine", "ejs");

//new in memory db stracture
var urlDatabase = {
  'b2xVn2': {
    long: "http://www.lighthouselabs.ca",
    userID: "2"
  },
  '9sm5xK': {
    long: "http://www.google.com",
    userID: '234'
  }
};

const users = {
  "234": {
    id: "234",
    email: "nawartamawi@ygmail.com",
    password: "lighthouse"
  },
  "2": {
    id: "2",
    email: "ahmedadil@yahoo.com",
    password: "gagfreak"
  }
};

//redirecting to /urls when requesting /
app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.use('/urls/new', auth);
//Render urls_index.ejs to an HTML page when getting a GET request of root path of ./urls
app.get('/urls', (req, res) => {
  let templateVars = {
    url: urlsForUser(urlDatabase, req.cookies["user_id"]),
    user: users[req.cookies['user_id']]
  };
  res.render("urls_index", templateVars);
});

//Render urls_new to an HTML page when getting a GET request of root path of ./urls/new
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"].userID]
  };
  console.log("here");
  res.render("urls_new", templateVars);
});

//Render urls_show to an HTML page when getting a GET request with the shortURL embedded in the URL like locahost/urls/:nd33nz
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].long,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});
//Adding new short URL
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    long: longURL,
    userID: req.cookies["user_id"] };
// redirect to the url/shorturl
  res.redirect('/urls/' + shortURL);
});
//redirecting route
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  if (longURL === undefined) {
    res.status(404).send(`${shortURL} is not found`);
    return;
  }
//redirect to the long url found in DB
  res.redirect(longURL.long);
});

//removes a URL resource by using the shortURL passed as Params.
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//edit the database with the new input (from coming from the form) and go back to /urls
app.post('/urls/:id', auth, (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

//Login POST
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = Object.keys(users).find((key) => users[key].email === email);
  console.log(userID, typeof userID);
  if (userID){
    if (password === users[userID].password) {
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else {
      res.status(403).send('Password Doesnt Match !!!!!!');
    }
  } else {
    res.status(403).send("enter a valid username and password");
  }
});
//login GET
app.get('/login', (req, res) => {
  res.render('urls_login');
});
// logout Handler. Delete the cooke
app.post('/logout', (req, res) => {
  res.clearCookie('user_id', { path: '/' });
  res.redirect('/urls');
});

//TODO registration page get request
app.get('/register', (req, res, next) => {
  res.render('urls_register');
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  let password  = req.body.password;
  let id = generateRandomString();
  // cheakcing if the user dont input anything
  if( !email || !password ){
    res.status(400).send("Enter email and password");
    return;
  }
// check email existance in DB
  for ( let key in users ) {
    if (users[key].email === email){
      res.status(400).send("user exist");
      return;
    }
  }

//everything is look ok. Create new user
  users[id] = {
    "id": id,
    "email": email,
    "password": password
  };
  res.cookie('user_id', id);
  res.redirect('/');
});
//Keeping the server listening
app.listen(PORT);
console.log("server is running");