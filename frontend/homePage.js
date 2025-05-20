#!/usr/bin/env node
require("dotenv").config();
const inquirer = require("inquirer");
const login = require("./pages/login");
const register = require("./pages/register");
const fs = require("fs");
const redirector = require("./pages/redirector");

inquirer
  .prompt([
    {
      type: "list",
      message: "choose an option ",
      name: "homeOptions",
      choices: ["LOGIN", "OPTIONS", "REGISTER", "EXIT"],
    },
  ])
  .then((answer) => {
    if (answer.homeOptions == "LOGIN") {
      login();
    }
    if (answer.homeOptions == "REGISTER") {
      register();
    }
    if (answer.homeOptions == "EXIT") {
      if (fs.existsSync("./token.json")) {
        fs.unlink("./token.json", (err) => {
          if (err) console.log("LOGIN REQUIRED");
          else console.log("SEE YOU LATER");
        });
      } else console.log("SEE YOU LATER");
    }
    if (answer.homeOptions == "OPTIONS") {
      redirector();
    }
  });
