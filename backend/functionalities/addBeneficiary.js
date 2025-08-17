const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");
const addBeneficiaries = async (req, res) => {
  const currentUser = await tempUser.findOne({ userid: req.body.userid });
  const BeneUser = await tempUser.findOne({
    userid: req.body.beneficiaryUserid,
  });
  if (!BeneUser) return res.send("Beneficiary not found enter proper userid");
  if (BeneUser.userid == currentUser.userid)
    return res.send("Cannot add yourself to beneficiaries");
  else {
    bcrypt
      .compare(req.body.profilePass, currentUser.profilePass)
      .then((result) => {
        if (!result) res.send("Incorrect profile password");
        else {
          const bene = {
            beneUserid: req.body.beneficiaryUserid,
            limit: req.body.Limit,
          };
          let found = 0;
          currentUser.beneficiaries.forEach((element) => {
            if (element.beneUserid == bene.beneUserid) {
              found = 1;
              return;
            }
          });
          if (found == 0) {
            tempUser
              .updateOne(
                { userid: currentUser.userid },
                { $push: { beneficiaries: bene } }
              )
              .then(() => {
                return res.send("Beneficiary added successfully");
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            return res.send("User already present in beneficiary list");
          }
        }
      })
      .catch((error) => {
        res.status(400).send(error);
      });
  }
};

module.exports = { addBeneficiaries };
