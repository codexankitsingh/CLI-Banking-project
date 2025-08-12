const inquirer = require("inquirer");
const axios = require("axios");
const removeBene = async (userid, token) => {
  inquirer
    .prompt([
      {
        type: "password",
        name: "profilePass",
        message: "Enter profile password ",
      },
      {
        type: "input",
        name: "beneficiaryUserid",
        message: "Enter the Userid to be removed",
      },
    ])
    .then((result) => {
      axios({
        method: "post",
        url: "https://cli-banking.vercel.app/removebene",
        headers: {
          "auth-token": token,
        },
        data: {
          userid: userid,
          profilePass: result.profilePass.trim(),
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
module.exports = removeBene;
