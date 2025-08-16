const jwt = require("jsonwebtoken");
const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");
const dohash = async (text) => {
  return bcrypt.hash(text, 10).then((hash) => {
    return hash;
  });
};

const signUp = async (req, res) => {
  const tempuser = await tempUser.findOne({ userid: req.body.userid });
  if (tempuser) {
    res.send(
      "User already exists, please Sign in Or choose try again with another Userid"
    );
  } else {
    const user = new tempUser({
      userid: req.body.userid,
      password: req.body.password,
      profilePass: req.body.profilePass,
      name: req.body.name,
      balance: 0,
    });
    user.password = await dohash(user.password);
    user.profilePass = await dohash(user.profilePass);
    console.log(user.password, user.profilePass);
    try {
      user.save().then((data, err) => {
        if (err) console.log(err);
        else res.send("Congrats! You have successfully Registered. Login!");
      });
    } catch (error) {
      console.log(error);
    }
  }
};

const signIn = async (req, res) => {
  const tempuser = await tempUser.findOne({ userid: req.body.userid });
  if (!tempuser) {
    return res.status(203).send("User does not exists, please Sign Up");
  } else {
    const validPass = await bcrypt.compare(
      req.body.password,
      tempuser.password
    );
    if (!validPass) {
      return res.status(202).send("password incorrect");
    } else {
      const token = jwt.sign(
        { userid: tempuser.userid },
        process.env.SECRET_KEY
      );
      res.status(201).send(token);
    }
  }
};

module.exports = { signUp, signIn };
