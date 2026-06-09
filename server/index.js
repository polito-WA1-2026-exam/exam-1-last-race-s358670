// imports
import express from "express";
import cors from "cors";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import crypto from "crypto";
import * as dao from "./dao.js";

const app = new express();
const port = 3001;

app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true,
}));

app.use(session({
  secret: "last race secret",
  resave: false,
  saveUninitialized: false,
}));

passport.use(new LocalStrategy( {usernameField: "email"}, async function verify(email, password, cb){
  try {
    const user = await dao.getUserByEmail(email);

    if(!user){
      return cb(null, false, "Incorrect email or password.");
    }

    const hash = crypto.scryptSync(password, user.salt, 32).toString("hex");

    if(hash !== user.hash){
      return cb(null, false, "Incorrect email or password.");
    }

    return cb(null, {
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    return cb(err);
  }
}

));

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try{
    const user = await dao.getUserById(id);
    cb(null, user);
  } catch(err){
    cb(err);
  }
});

app.use(passport.authenticate("session"));

app.post("/api/sessions", passport.authenticate("local"), (req, res) => {
  res.status(201).json(req.user);
});

app.get("/api/sessions/current", (req, res) => {
  if(req.isAuthenticated()){
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});