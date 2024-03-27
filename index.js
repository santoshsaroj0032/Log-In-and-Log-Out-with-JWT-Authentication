import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb+srv://santoshsaroj:kQv8zSrUF8AVCyQu@cluster0.mkmko1i.mongodb.net/", {
  dbName: "backend",
})
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

// Define message schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});


// Create Message model
const User = mongoose.model("User", userSchema);

// Set view engine to EJS
app.set("view engine", "ejs");

// Serve static files from the public directory
app.use(express.static(path.join(path.resolve(), "public")));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Use cookie parser middleware
app.use(cookieParser());

// Middleware to check authentication
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {

    const decoded = jwt.verify(token, "sdjasdbajsdbjasd")
    // console.log(decoded);

    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }
};



app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});


app.get("/login", (req, res) => {
  res.render("login");
})


app.get("/register", (req, res) => {
  res.render("register");
});



app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) return res.redirect("/register");

  const isMatch =  await bcrypt.compare(password, user.password);
  if (!isMatch) return res.render("login", { email, message: "Incorrect Password" });

  const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd");
  // console.log(token);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000), // Set token expiration time
  });
  res.redirect("/");
});


// Handle login request
app.post("/register", async (req, res) => {

  // we are using req.body for  the access the data from login page 
  // console.log(req.body);
  console.log(req.body);
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

const hashedPassword= await bcrypt.hash(password,10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd");
  // console.log(token);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000), // Set token expiration time
  });
  res.redirect("/");
});

// Handle logout request
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
