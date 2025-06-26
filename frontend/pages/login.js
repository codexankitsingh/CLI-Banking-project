const axios = require("axios");
const inquirer = require("inquirer");
const fs = require("fs");
const redirector = require("./redirector");
const register = require("./register");
const login = async () => {
  if (!fs.existsSync("./token.json")) {
    inquirer
      .prompt([
        {
          type: "input",
          name: "userid",
          message: "enter userid for login: ",
        },
        {
          type: "password",
          name: "password",
          message: "enter password for login: ",
        },
      ])
      .then((ans) => {
        axios({
          method: "post",
          url: "https://cli-banking.vercel.app/login",
          data: {
            userid: ans.userid.trim(),
            password: ans.password.trim(),
          },
        })
          .then((response) => {
            if (response.status === 201) {
              const data = {
                userid: ans.userid.trim(),
                token: response.data,
              };
              fs.writeFileSync("./token.json", JSON.stringify(data));
              redirector();
            } else {
              if (response.status === 203 || response.status === 202)
                console.log(response.data);
              inquirer
                .prompt([
                  {
                    type: "list",
                    message: "choose an option ",
                    name: "option",
                    choices: ["RETRY LOGIN", "REGISTER", "EXIT"],
                  },
                ])
                .then(async (answer) => {
                  if (answer.option === "REGISTER") {
                    register();
                  }
                  if (answer.option === "RETRY LOGIN") {
                    login();
                  }
                  if (answer.option === "EXIT") {
                    console.log("SEE YOU LATER");
                  }
                })
                .catch((err) => {
                  console.log(err.message);
                });
            }
          })
          .catch((err) => {
            console.log(err.message);
          });
      })
      .catch((err) => {
        console.log(err.message);
      });
  } else {
    console.log("ALREADY LOGGED IN GO TO OPTIONS DIRECTLY OR EXIT");
  }
};

module.exports = login;
