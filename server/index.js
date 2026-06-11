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

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

function getDistance(startId, destinationId, segments) {
  const graph = {};

  for (const segment of segments) {
    if (!graph[segment.station1_id]) {
      graph[segment.station1_id] = [];
    }

    if (!graph[segment.station2_id]) {
      graph[segment.station2_id] = [];
    }

    graph[segment.station1_id].push(segment.station2_id);
    graph[segment.station2_id].push(segment.station1_id);
  }

  const queue = [{ id: startId, distance: 0 }];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.id === destinationId) {
      return current.distance;
    }

    for (const next of graph[current.id] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, distance: current.distance + 1 });
      }
    }
  }

  return Infinity;
}

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

app.get("/api/network/full", isLoggedIn, async (req, res) => {
  try {
    const stations = await dao.getStations();
    const lines = await dao.getLines();
    const lineStations = await dao.getLineStations();

    res.json({ stations, lines, lineStations });
  } catch(err){
    res.status(500).json({ error: "Database error "});
  }
});

app.get("/api/network/planning", isLoggedIn, async (req, res) => {
  try {
    const stations = await dao.getStations();
    const segments = await dao.getSegments();

    res.json( { stations, segments });
  } catch(err){
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/ranking", isLoggedIn, async (req, res) => {
  try {
    const rankings = await dao.getRanking();

    res.json(rankings);
  } catch(err){
    res.status(500).json({ error: "Database error "});
  }
})

app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const stations = await dao.getStations();
    const segments = await dao.getSegments();

    const possiblePairs = [];

    for (const start of stations) {
      for (const destination of stations) {
        if (start.id !== destination.id) {
          const distance = getDistance(start.id, destination.id, segments);

          if (distance >= 3 && distance !== Infinity) {
            possiblePairs.push({ start, destination });
          }
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * possiblePairs.length);
    const pair = possiblePairs[randomIndex];

    const game = await dao.createGame(
      req.user.id,
      pair.start.id,
      pair.destination.id
    );

    res.status(201).json({
      id: game.id,
      startStation: pair.start,
      destinationStation: pair.destination,
      status: game.status,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});