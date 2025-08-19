const tempUser = require("../model/tempUser");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const transfer = async (req, res) => {
  const currentUser = await tempUser.findOne({ userid: req.body.userid });
  const reciever = await tempUser.findOne({ userid: req.body.recieverUserid });
  bcrypt
    .compare(req.body.profilePass, currentUser.profilePass)
    .then((result) => {
      if (!result) {
        res.status(203).send("Incorrest profile password");
      } else {
        const amount = req.body.amount;
        if (amount > currentUser.balance)
          res.send("Balance low for transaction");
        else {
          let limit;
          let flag;
          currentUser.beneficiaries.forEach((element) => {
            if (element.beneUserid == reciever.userid) {
              limit = element.limit;
              flag = 1;
            }
          });
          if (flag == 1) {
            if (amount > limit)
              res.send("Transfer amount greater than benficiary limit");
            else {
              const d = new Date();
              const date = `${d.getDate()}-${
                d.getMonth() + 1
              }-${d.getFullYear()}`;
              const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
              let object = {
                Tid: uuidv4(),
                Date: date,
                Time: time,
                Amount: amount,
                Type: "Money transfer",
                To: `id: ${reciever.userid} name: ${reciever.name}`,
              };
              tempUser
                .updateOne(
                  { userid: currentUser.userid },
                  {
                    $push: { transactions: object },
                    $inc: { balance: amount * -1 },
                  }
                )
                .then(() => {
                  object["To"] = object["From"];
                  delete object["To"];
                  object["From"] = `${currentUser.userid}-${currentUser.name}`;

                  tempUser
                    .updateOne(
                      { userid: reciever.userid },
                      {
                        $push: { transactions: object },
                        $inc: { balance: amount },
                      }
                    )
                    .then(() => {
                      res.status(200).send("Transaction done successfully.");
                    });
                });
            }
          } else {
            res.status(201).send("Reciever not in beneficairy list");
          }
        }
      }
    });
};
module.exports = transfer;
