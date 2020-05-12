const globvar = require("../../globalvar");
const jwt = require("jsonwebtoken");

const jwtAuth = (req, res, next) => {
  try {
    const seckey = globvar.seceretkey;

    const token = req.headers.token;
    const decoded = jwt.verify(token, globvar.seceretkey);
    globvar.clientid = decoded.id;
    console.log(decoded);
    next();
  } catch (error) {
    res.status(401).send({ error: "Authentication failed" });
  }
};

module.exports = jwtAuth;
