const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");
const delBene = async (req, res) => {
  const currentUser = await tempUser.findOne({ userid: req.body.userid });

  const beneficiaryUserid = req.body.beneficiaryUserid;
  let flag = 0;
  currentUser.beneficiaries.forEach((element) => {
    if (element.beneUserid === beneficiaryUserid) {
      flag = 1;
      return;
    }
  });
  if (flag == 0) {
    return res.send("User not found in Beneficiary list");
  } else {
    bcrypt
      .compare(req.body.profilePass, currentUser.profilePass)
      .then((result) => {
        if (!result) return res.send("Incorrect profile pass");
        else {
          tempUser
            .updateOne(
              { userid: currentUser.userid },
              {
                $pull: { beneficiaries: { beneUserid: beneficiaryUserid } },
              }
            )
            .then(() => {
              return res.send("Beneficiary removed successfully.");
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((error) => {
        return res.status(400).send(error.message);
      });
  }
};

module.exports = { delBene };
