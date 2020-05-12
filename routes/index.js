var express = require("express");
var router = express.Router();
var passport = require("passport");
var bcrypt = require("bcryptjs");
const userAuthenticate = require("./middleware/userAuthenticate");
const globvar = require("../globalvar");
const jwt = require("jsonwebtoken");

const saltRounds = 10;

//Get home page
router.get("/", userAuthenticate.method(), (req, res) => {
  res.redirect("home");
});

// //Get home page
// router.get("/home", userAuthenticate.method(), (req, res) => {
//   console.log("global variable=" + globvar.clientid);
//   res.send("home");
// });

//Get Login page
router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

router.post(
  "/login/api",
  passport.authenticate("local", {
    successRedirect: "/jwttken/1",
    failureRedirect: "/jwttken/0",
  })
);

router.get("/jwttken/:id", (req, res) => {
  if (req.params.id == 0) {
    res.status(200).send({ error: "Unsucessfull Login", clientid: 0 });
  } else {
    const id = globvar.clientid;
    const seckey = globvar.seceretkey;
    const token = jwt.sign({ id: id }, seckey);

    const getval = jwt.verify(token, seckey);

    res.status(200).send({ error: undefined, token: token, clientid: id });
  }
});

//Get Logout page
router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

//Get registration page
router.get("/register", (req, res, next) => {
  res.render("register", { title: "Registration" });
});

router.post("/register", (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const password2 = req.body.password2;

  const db = require("../db.js");

  bcrypt.hash(password2, saltRounds, (err, hash) => {
    db.query(
      "insert into client (clientname,password,password1) values(?,?,?)",
      [username, password, hash],
      (err, results, fields) => {
        if (err) throw err;
        //Get last inserted ClientID of the user registered.
        db.query(
          "select last_inserted_id() as user_id",
          (err, results, fields) => {
            res.render("register", { title: "Registration Complete" });
            if (err) throw err;

            const user_id = results[0];
            //this user_id will be passed to the serializeUser function
            req.login(user_id, (err) => {
              res.redirect("/");
            });
          }
        );
      }
    );
  });
});

//serializedUser will store userid in session variable
//DeserializedUser will retreive userid from session variable
passport.serializeUser((user_id, done) => {
  done(null, user_id);
});

passport.deserializeUser((user_id, done) => {
  done(null, user_id);
});

module.exports = router;
