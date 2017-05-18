//adding the express library
const express = require("express");
const urlsForUser = require("./urlsForUser");
const generateRandomString = require("./generateRandomString");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
var cookieSession = require('cookie-session');
var PORT = process.env.PORT || 8080;

var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['tyrannosaurus', 'triceratops', 'pterodactyl', 'velociraptor']
}));

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
    email: "1@1.com",
    password: "1"
  },
  "2": {
    id: "2",
    email: "2@2.com",
    password: "1"
  }
};

// User Authntication
const auth = (req, res, next) => {
  if(req.session.user_id){
    next();
  } else {
    res.status(401).render("urls_nolog");
  }
};

const linkBelongToUser = (req, res, next) => {
  console.log(req.params);
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).render("urls_notExist");
  } else if (req.session.user_id === urlDatabase[req.params.id].userID) {
    next();
  } else {
    res.status(403).render("urls_forbid");
  }
};


//redirecting to /urls when requesting /
app.get('/', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
    return;
  } else {
    res.redirect('/login');
    return;
  }
});

//Render urls_index.ejs to an HTML page when getting a GET request of root path of ./urls
app.get('/urls', auth, (req, res) => {
  let templateVars = {
    url: urlsForUser(urlDatabase, req.session.user_id),
    user: users[req.session.user_id]
  };
  res.status(200);
  res.render("urls_index", templateVars);
});

//Render urls_new to an HTML page when getting a GET request of root path of ./urls/new
app.get("/urls/new", auth, (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

//Render urls_show to an HTML page when getting a GET request with the shortURL embedded in the URL like locahost/urls/:nd33nz
app.get('/urls/:id', auth, linkBelongToUser, (req, res) => {
  // if (req.params.id in urlDatabase) {
  const currentUser = req.session.user_id;
  urlDatabase[req.params.id].long;

  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].long,
    user: users[currentUser]
  };

  res.render("urls_show", templateVars);
});
//Adding new short URL
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    long: longURL,
    userID: req.session.user_id };
// redirect to the url/shorturl
  res.redirect('/urls/' + shortURL);
});

//redirecting route
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  if (longURL === undefined) {
    res.status(404);
    res.render("urls_notExist");
    return;
  }
  res.redirect(longURL.long);
});

//removes a URL resource by using the shortURL passed as Params.
app.post('/urls/:id/delete', auth, linkBelongToUser,  (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//edit the database with the new input (from coming from the form) and go back to /urls
app.post('/urls/:id', auth, linkBelongToUser, (req, res) => {
  urlDatabase[req.params.id] = {
    long: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect('/urls');
});

//Login POST
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = Object.keys(users).find((key) => users[key].email === email);

  if (userID){
    if (bcrypt.compareSync(password, users[userID].password))  {
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      res.status(403).render('urls_password.ejs');
    }
  } else {
    res.status(403).render('urls_invalidUser.ejs');
  }
});
//login GET
app.get('/login', (req, res) => {
  if (!req.session.user_id){
    res.render('urls_login');
  } else {
    res.redirect('/');
  }
});
// logout Handler. Delete the cooke
app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/');
});

//TODO registration page get request
app.get('/register', (req, res, next) => {
  if (!req.session.user_id) {
    res.render('urls_register');
  } else {
    res.redirect('/');
  }
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  let password  = hashedPassword;
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
  //setting session user ID
  req.session.user_id = id;
  res.redirect('/');
});
//Keeping the server listening
app.listen(PORT);
console.log(`server is running at port ${PORT}`);