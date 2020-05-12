const express = require("express");
const router = express.Router();
const conn = require("./../db");
const globvar = require("../globalvar");
const jwtAuthe = require("./middleware/jwtAuthenticate");

router.get("/api", jwtAuthe, (req, res) => {
  const clientid = 1; // globvar.clientid;

  let sql =
    "select email_ID,password from client where clientid=" + clientid + "";

  conn.query(sql, (error, data) => {
    res
      .status(200)
      .send({ email: data[0].email_ID, password: data[0].password });
  });
});

router.post("/api", jwtAuthe, (req, res) => {
  const clientid = globvar.clientid;
  const password = req.body.password;

  conn
    .promise()
    .query(
      "update client set password='" +
        password +
        "' where clientid=" +
        clientid +
        ""
    )
    .then((rows, field) => {
      res.status(200).send({ data: "Data updated scucessfully" });
    })
    .catch(error => {
      res.status(500).send({ data: "Error while updating the data" });
    });
});

module.exports = router;
