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
}

/*
const urlsForUser = (id, db) => {
  for (let urlsId in db) {
    const urls = db[urlsId]; // => retrieve the value

    if (urls.id === id) {
      return user;
    }
  }
  return false;
}

sdlknas, urlDatabase
*/
const urlsForUser = (id, db) => {
  let urls = {};
Object.keys(db).forEach(key => {
  if (db[key].userID === id) {
  	urls[key] = {
      ...db[key]
    }
  }
});
return urls;
}

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
  let user = req.cookies["user_id"];
  if (user !== urlDatabase[req.params.id].userID) {
    res.status(403).send('Sorry, you need to be the owner of this url!');
    return;
  }
   urlDatabase[req.params.id].longURL = req.body.longURL;
   res.redirect(`/urls/${req.params.id}`);
})

//makes the new urls
app.post("/urls", (req, res) => {
  let user = findUserById(req.cookies["user_id"], users);
  if (user === false) {
    res.status(403).send('Sorry, you need to be logged in to use this feature!');
    return;
  }
  

  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
	longURL: req.body.longURL,
  userID: req.cookies['user_id']
}
  console.log(urlDatabase);
  console.log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let user = req.cookies["user_id"];
  if (user !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send('Sorry, you need to be the owner of this url!');
    return;
  }
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
  if (urlDatabase[req.params.shortURL] === undefined){
    res.status(400).send('This short URL does not exist!');
  }
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

app.get("/urls/new", (req, res) => { 
  let user = findUserById(req.cookies["user_id"], users);
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

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!Object.keys(urlDatabase).includes(shortURL)) {
    res.status(400).send('This short URL does not exist!');
  }
  let user = findUserById(req.cookies["user_id"], users);
  const templateVars = { 
    user: user,
    shortURL, 
    longURL: urlDatabase[shortURL].longURL,
    userID: urlDatabase[shortURL].userID
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let user = findUserById(req.cookies["user_id"], users);
  let urlId = urlsForUser(req.cookies["user_id"], urlDatabase);
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
  a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
