const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

//think about an if incases where the user does not add


app.set("view engine", "ejs"); //sets ejs template

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
}

const findUserById = (id, db) => {
  for (let userId in db) {
    const user = db[userId]; // => retrieve the value

    if (user.id === id) {
      return user;
    }
  }

  return false;
};

const findUserByEmail = (email, db) => {
  for (let userId in db) {
    const user = db[userId]; // => retrieve the value

    if (user.email === email) {
      return user;
    }
  }

  return false;
};

var cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.post("/register", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  


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
    password,
  };

  users[userId] = newUser;

  res.cookie('user_id', userId);

  console.log(users);

  res.redirect('/urls');

})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email, users);
  if (!user) {
    res.status(403).send('Sorry, a user with that email does not exist!');
    return;
  }
  if (user.password !== password) {
    res.status(403).send('Sorry, that password is incorrect!');
    return;
  }
  res.cookie('user_id', user.id);
  res.redirect("/urls");
})

app.post("/urls/:id", (req, res) => {
   urlDatabase[req.params.id] = req.body.longURL;
   res.redirect(`/urls/${req.params.id}`);
})

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/login", (req,res) => {
  let user = findUserById(req.cookies["user_id"], users);
  const templateVars = { 
    user: user,
    users:req.cookies["users"] 
  }; 
res.render("login", templateVars);
})

app.get("/register", (req,res) => {
  let user = findUserById(req.cookies["user_id"], users);
  const templateVars = { 
    user: user,
    users:req.cookies["users"] 
  }; 
res.render("register", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get("/urls/new", (req, res) => { 
  let user = findUserById(req.cookies["user_id"], users);
  const templateVars = { 
    user: user,
    users:req.cookies["users"]
   };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let user = findUserById(req.cookies["user_id"], users);
  const templateVars = { 
    user: user,
    shortURL, 
    longURL: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let user = findUserById(req.cookies["user_id"], users);
  const templateVars = { 
    user: user,
    urls: urlDatabase };
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
  a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});