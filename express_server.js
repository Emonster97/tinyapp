
const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

//email id function, identify user in database by email 
const findUserByEmail = require("./helpers.js");


function generateRandomString() {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() *
 charactersLength));
  }
  return result;
}

//think about an if incases where the user does not add


app.set("view engine", "ejs"); //sets ejs template

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//identify user from database by their id
const findUserById = (id, db) => {
  for (let userId in db) {
    const user = db[userId]; // => retrieve the value

    if (user.id === id) {
      return user;
    }
  }

  return false;
};

//Function to ensure urls belong to the user
const urlsForUser = (id, db) => {
  let urls = {};
  Object.keys(db).forEach(key => {
    if (db[key].userID === id) {
      urls[key] = {
        ...db[key]
      };
    }
  });
  return urls;
};

//cookie session init
let cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["very-secret-string"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//cookie parser init
let cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//registration function
app.post("/register", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = findUserByEmail(email, users);
  if (user) {
    res.status(400).send('Sorry, a user with that email already exists!');
    return;
  }
  if (email === '' || password === '') {
    res.status(400).send('Please fill out the entire form!');
    return;
  }

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    name,
    email,
    password:hashedPassword,
  };

  users[userId] = newUser;

  //res.cookie('user_id', userId);
  req.session.user_id = userId;
  console.log(users);

  res.redirect('/urls');

});

//logout function
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//login function
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email, users);
  if (!user) {
    res.status(403).send('Sorry, a user with that email does not exist!');
    return;
  }
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send('Sorry, that password is incorrect!');
    return;
  }
  //res.cookie('user_id', user.id);
  req.session.user_id = user.id;
  res.redirect("/urls");
});

//shorturl
app.post("/urls/:id", (req, res) => {
  let user =  req.session.user_id;
  if (user !== urlDatabase[req.params.id].userID) {
    res.status(403).send('Sorry, you need to be the owner of this url!');
    return;
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

//makes the new urls
app.post("/urls", (req, res) => {
  let user = findUserById(req.session.user_id, users);
  if (user === false) {
    res.status(403).send('Sorry, you need to be logged in to use this feature!');
    return;
  }
  

  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  console.log(urlDatabase);
  console.log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});


//deletes urls
app.post("/urls/:shortURL/delete", (req, res) => {
  let user = req.session.user_id;
  if (user !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send('Sorry, you need to be the owner of this url!');
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//get handler for the login page
app.get("/login", (req,res) => {
  let user = findUserById(req.session.user_id, users);
  const templateVars = {
    user: user,
    users:req.session.users
  };
  res.render("login", templateVars);
});

//get handler for the registration page
app.get("/register", (req,res) => {
  let user = findUserById(req.session.user_id, users);
  const templateVars = {
    user: user,
    users:req.session.users
  };
  res.render("register", templateVars);
});

//get handler for the new shorturl pages
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('This short URL does not exist!');
  }
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

//get handler to redirect logged out users, and then setup the create new url page
app.get("/urls/new", (req, res) => {
  let user = findUserById(req.session.user_id, users);
  if (user === false) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: user,
    users:req.cookies["users"]
  };
  res.render("urls_new", templateVars);
});

//get handler for the page displaying the shorturl, as long as it exists and user owns it and is logged in
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!Object.keys(urlDatabase).includes(shortURL)) {
    res.status(400).send('This short URL does not exist!');
  }
  let user = findUserById(req.session.user_id, users);
  const templateVars = {
    user: user,
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    userID: urlDatabase[shortURL].userID
  };
  res.render("urls_show", templateVars);
});

//get handler for the index page
app.get("/urls", (req, res) => {
  let user = findUserById(req.session.user_id, users);
  let urlId = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    user: user,
    urls: urlId };
  res.render("urls_index", templateVars);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  let a = 1;
  res.send(`a = ${a}`);
});
 
app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
