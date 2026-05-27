const inquirer = require("inquirer");
const axios = require("axios");
const transfer = async (userid, token) => {
  inquirer
    .prompt([
      {
        type: "password",
        name: "profilePass",
        message: "Enter profile password",
      },
      {
        type: "input",
        name: "recieverUserid",
        message: "Enter Userid of reciever",
      },
      {
        type: "number",
        name: "amount",
        message: "Enter amount to be transferred",
      },
    ])
    .then((result) => {
      const { v4: uuidv4 } = require('uuid');
      const idempotencyKey = uuidv4();
      
      axios({
        method: "post",
        url: "http://localhost:3000/transfer", // Updated to local backend for testing
        headers: {
          "auth-token": token,
          "Idempotency-Key": idempotencyKey
        },
        data: {
          userid: userid,
          profilePass: result.profilePass.trim(),
          amount: result.amount,
          recieverUserid: result.recieverUserid.trim(),
        },
      }).then((response) => {
        console.log(response.data);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
module.exports = transfer;
