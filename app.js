// if in development, require the .env
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

// Routes
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");

const MongoDBStore = require("connect-mongo")(session);

// const { MongoClient } = require("mongodb");

const ejsMate = require("ejs-mate");
const ExpressError = require("./helper/ExpressError");

const dbURL = process.env.DB_URL || "mongodb://127.0.0.1:27017/yelp-camp";
// const dbURL = "mongodb://127.0.0.1:27017/yelp-camp";

mongoose.set("strictQuery", false);
// connection to MongoDB
mongoose.connect(dbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate);
// Set
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Use
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const store = new MongoDBStore({
  url: dbURL,
  secret,
  touchAfter: 24 * 60 * 60, // in secs
});

store.on("error", function (e) {
  console.log("Session Store Error");
});

const sessionConfig = {
  store,
  name: "session",
  secret: "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/dzxos3ymq/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

// passport should come after session!
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// to store and de-store user from the session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware yg bisa ngejalanin flash
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found!", 404));
});

app.use((err, req, res, next) => {
  let { message = "Something went wrong", statusCode = 500 } = err;

  if (!err.message) {
    err.message = "Oh no! Something went wrong!";
  }
  //received status code from app.all('*')
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;

// const uri = process.env.MONGO_CONNECTION_STRING;
// const client = new MongoClient(uri);

// client.connect((err) => {
//   if (err) {
//     console.error(err);
//     return false;
//   }
//   // connection to mongo is successful, listen for requests
//   app.listen(PORT, () => {
//     console.log("listening for requests");
//   });
// });

app.listen(port, () => {
  console.log(`LISTENING ON PORT ${port}`);
});
