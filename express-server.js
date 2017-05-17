//adding the express library
const express = require("express");
var app = express();

//Specify what Port to use
var PORT = process.env.PORT || 8080;
//Import the random string Genrator and URls for a spcific user functions
const generateRandomString = require("./generateRandomString");
const urlsForUser = require("./urlsForUser");

//adding the middleware bodyparser, cookie-parser and password hashing libraries
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
app.use(bodyParser.urlencoded({extended: true}));
var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['tyrannosaurus', 'triceratops', 'pterodactyl', 'velociraptor']
}));
//Authntication function to pass to the route
// const auth = (req, res, next) => {
//   if(req.session.user_id){
//     next();
//   } else {
    
//     res.status(401).send("cannot access this page, login first");

//   }
// };

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
  if(req.session.user_id) {
    res.redirect('/urls');
    return;
  } else {
    res.redirect('/login');
    return;
  }
});

//Render urls_index.ejs to an HTML page when getting a GET request of root path of ./urls
app.get('/urls', (req, res) => {
  let userLoggedin = req.session.user_id;
  if (userLoggedin) {
    res.status(200);
    let templateVars = {
      url: urlsForUser(urlDatabase, req.session.user_id),
      user: users[req.session.user_id]
    };
    
    res.render("urls_index", templateVars);
  } else {
    res.status(401);
    res.render("urls_nolog");
  }
});

//Render urls_new to an HTML page when getting a GET request of root path of ./urls/new
app.get("/urls/new", (req, res) => {
  let userLoggedin = req.session.user_id;
  if (userLoggedin) {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.status(401);
    res.render("urls_nolog");
  }
});

//Render urls_show to an HTML page when getting a GET request with the shortURL embedded in the URL like locahost/urls/:nd33nz
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].long,
    user: users[req.session.user_id]
  };

  if (req.params.id in urlDatabase) {
    let userLoggedin = req.session.user_id;
    
    urlDatabase[req.params.id].long;
    
    if (userLoggedin) {
      if (req.session.user_id === urlDatabase[req.params.id].userID) {
        res.render("urls_show", templateVars);
      } else {
        res.send("You can't access this page");
      }
    } else {
      res.status(401);
      res.render("urls_nolog");
    }
  } else {
    res.status(404);
    res.render("urls_notExist");
  }
  
  // res.render("urls_show", templateVars);
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
//redirect to the long url found in DB
  res.redirect(longURL.long);
});

//removes a URL resource by using the shortURL passed as Params.
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//edit the database with the new input (from coming from the form) and go back to /urls
app.post('/urls/:id', (req, res) => {
  let userLoggedin = req.session.user_id;
  if (userLoggedin) {
    urlDatabase[req.params.id] = {
      long: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect('/urls');
  } else {
    res.send('forbidden');
  }
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
  res.redirect('/urls');
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
  //
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
console.log("server is running ....");