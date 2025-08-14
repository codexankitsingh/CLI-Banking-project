const inquirer = require("inquirer");
const axios = require("axios");
const showallbene = async (userid, token) => {
  inquirer
    .prompt({
      type: "password",
      name: "profilePass",
      message: "Enter profile password ",
    })
    .then((result) => {
      axios({
        method: "post",
        url: "https://cli-banking.vercel.app/showallbene",
        headers: {
          "auth-token": token,
        },
        data: {
          userid: userid,
          profilePass: result.profilePass.trim(),
        },
      })
        .then(async (response) => {
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
module.exports = showallbene;
