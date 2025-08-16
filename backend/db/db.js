const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const connectdb = (URI) => {
  return mongoose.connect(URI);
};

module.exports = connectdb;
