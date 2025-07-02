require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");
const fileUpload = require("express-fileupload");
require("./config/mongo");

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      ttl: 24 * 60 * 60,
    }),
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));

app.use((req, res, next) => {
  console.log(`[${req.method}] > ${req.url}`);
  next();
});
app.get("/", (req, res) => {
  return res.send("Hello World!");
});
app.use("/", require("./routes"));

app.listen(port, "0.0.0.0", () => {
  console.log(`running on http://localhost:${port}`);
});
