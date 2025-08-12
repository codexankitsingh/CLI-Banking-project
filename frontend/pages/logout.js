const fs = require("fs");
const logout = async (req, res) => {
  console.log("SEE YOU LATER. LOGGED OUT SUCCESSFULLY");
  fs.unlink("./token.json", (err) => {
    if (err) console.log(err.message);
  });
};
module.exports = logout;
