const inquirer = require("inquirer");
const Balance = require("./showBalance");
const deposit = require("./deposit");
const withdraw = require("./withdraw");
const lastTrans = require("./lastTrans");
const fs = require("fs");
const addBene = require("./addBene");
const removeBene = require("./removeBene");
const transfer = require("./transfer");
const logout = require("./logout");
const showallbene = require("./showAllbene");

const redirector = async () => {
  const postLogChoices = [
    "CHECK BALANCE",
    "DEPOSIT MONEY",
    "WITHDRAW MONEY",
    "VIEW ALL TRANSACTIONS",
    "SHOW ALL BENEFICIARIES",
    "ADD BENEFICIARIES",
    "REMOVE BENEFICIARIES",
    "TRANSFER AMOUNT",
    "LOGOUT",
  ];
  if (!fs.existsSync("./token.json")) console.log("LOGIN REQUIRED");
  else {
    inquirer
      .prompt([
        {
          type: "list",
          name: "postLogChoice",
          choices: postLogChoices,
        },
      ])
      .then((ans) => {
        const loggedUserDetails = JSON.parse(
          fs.readFileSync("./token.json", "utf-8")
        );
        const token = loggedUserDetails.token;
        const userid = loggedUserDetails.userid;
        const check = ans.postLogChoice;
        if (check === "CHECK BALANCE") Balance(userid, token);
        if (check === "DEPOSIT MONEY") deposit(userid, token);
        if (check === "WITHDRAW MONEY") withdraw(userid, token);
        if (check === "VIEW ALL TRANSACTIONS") lastTrans(userid, token);
        if (check === "ADD BENEFICIARIES") addBene(userid, token);
        if (check === "REMOVE BENEFICIARIES") removeBene(userid, token);
        if (check === "TRANSFER AMOUNT") transfer(userid, token);
        if (check === "LOGOUT") logout();
        if (check === "SHOW ALL BENEFICIARIES") showallbene(userid, token);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

module.exports = redirector;
      