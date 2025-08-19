const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");

const showBalance = async (req, res) => {
  const tempuser = await tempUser.findOne({ userid: req.body.userid });

  bcrypt.compare(req.body.profilePass, tempuser.profilePass).then((result) => {
    if (result) {
      res.send("your balance is: " + tempuser.balance);
    } else {
      res.send("incorrect profile password");
      return;
    }
  });
};
module.exports = { showBalance };
