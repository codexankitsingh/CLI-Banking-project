const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");

const showAllBeneficiaries = async (req, res) => {
  const currentUser = await tempUser.findOne({ userid: req.body.userid });

  bcrypt
    .compare(req.body.profilePass, currentUser.profilePass)
    .then((result) => {
      if (!result) res.send("Incorrect profile password");
      else {
        if (currentUser.beneficiaries.length === 0)
          res.send("You dont have any Beneficiaries added to the list.");
        else {
          res.send(currentUser.beneficiaries);
        }
      }
    })
    .catch((error) => {
      res.status(400).send(error);
    });
};
module.exports = { showAllBeneficiaries };
