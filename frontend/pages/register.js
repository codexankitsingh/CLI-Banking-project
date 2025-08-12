const axios = require("axios");
const inquirer = require("inquirer");
const logout = require("./logout");
const fs = require("fs");
const register = async () => {
  if (fs.existsSync("./token.json")) {
    logout();
  }
  await inquirer
    .prompt([
      {
        type: "input",
        name: "userid",
        message: "Enter Userid to register: ",
      },
      {
        type: "password",
        name: "password",
        message: "Enter password: ",
      },
      {
        type: "password",
        name: "profilePass",
        message: "Enter Profile password: ",
      },
      {
        type: "input",
        name: "name",
        message: "Enter your name: ",
      },
    ])
    .then((ans) => {
      axios({
        method: "post",
        url: "https://cli-banking.vercel.app/register",
        data: {
          userid: ans.userid.trim(),
          password: ans.password.trim(),
          name: ans.name.trim(),
          profilePass: ans.profilePass.trim(),
        },
      })
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = register;
