const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");
const last = async (req, res) => {
  const currentUser = await tempUser.findOne({ userid: req.body.userid });
  bcrypt
    .compare(req.body.profilePass, currentUser.profilePass)
    .then((result) => {
      if (result) {
        if (currentUser.transactions.length === 0)
          res.send("You haven't done any Transaction or recieved any money");
        else res.send(currentUser.transactions);
      } else res.send("User not found");
    })
    .catch((error) => {
      console.log(error);
    });
};
module.exports = { last };
