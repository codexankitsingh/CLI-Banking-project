const inquirer = require("inquirer");
const axios = require("axios");
const addBene = async (userid, token) => {
  inquirer
    .prompt([
      {
        type: "password",
        name: "profilePass",
        message: "Enter profile Password ",
      },
      {
        type: "input",
        name: "beneficiaryUserid",
        message: "Enter Userid of Beneficiary",
      },
      {
        type: "number",
        name: "Limit",
        message: "Enter Limit of Beneficary",
      },
    ])
    .then((result) => {
      axios({
        method: "post",
        url: "https://cli-banking.vercel.app/addbene",
        headers: {
          "auth-token": token,
        },
        data: {
          userid: userid.trim(),
          profilePass: result.profilePass.trim(),
          Limit: result.Limit,
          beneficiaryUserid: result.beneficiaryUserid.trim(),
        },
      })
        .then((response) => {
          console.log(response.data);
        })
        .catch((err) => {
          console.log(err.message);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
module.exports = addBene;
