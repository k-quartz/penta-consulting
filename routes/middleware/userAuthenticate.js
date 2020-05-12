const express = require("express");
const router = express.Router();
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const globvar = require("../../globalvar");
const saltRounds = 10;

passport.use(
  //after login page is submitted passport.authenticate("local".. will call this function
  //username and password parameter are the name of the fields in the login form
  //function done will return a false if username and password are incorrect
  //if function done result true or a string user will be redirected to profile page
  new LocalStrategy((username, password, done) => {
    const db = require("../../db.js");
    db.query(
      "select agentid as clientid,password from agent where agent =?",
      [username],
      (err, results, fields) => {
        if (err) {
          done(err);
        } else {
          if (results.length == 0) {
            done(null, false);
          } else {
            const hash = results[0].password.toString();
            const userid = results[0].clientid;
            globvar.clientid = userid;
            bcrypt.compare(password, hash, (err, response) => {
              if (response === true) {
                return done(null, { user_id: userid });
              } else {
                return done(null, false);
              }
            });
          }
        }
      }
    );
  })
);

//serializedUser will store userid in session variable
//DeserializedUser will retreive userid from session variable
passport.serializeUser((user_id, done) => {
  done(null, user_id);
});

passport.deserializeUser((user_id, done) => {
  done(null, user_id);
});

//This function will give access to user who is logged in
//this function will determine which page should have restricted access.
const UserAuthenticate = function authenticationMiddleware() {
  return (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  };
};

module.exports = {
  method: UserAuthenticate,
};
