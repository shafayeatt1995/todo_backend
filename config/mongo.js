const mongoose = require("mongoose");
const AutoIncrementFactory = require("mongoose-sequence");
const time = Date.now();

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URL, { autoIndex: false })
  .then(() => {})
  .catch((err) => console.error("Error connecting to mongo", err))
  .finally(() =>
    console.log("Mongo connected time", (Date.now() - time) / 1000 + "sec")
  );

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

connection.on("error", (error) => console.error(error));
mongoose.Promise = global.Promise;

if (process.env.MONGO_LOGS === "1") {
  mongoose.set("debug", true);
}

module.exports = { mongoose, AutoIncrement, connection };
