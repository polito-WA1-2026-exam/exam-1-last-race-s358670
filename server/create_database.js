"use strict";

import sqlite3 from "sqlite3";
import crypto from "crypto";

const db = new sqlite3.Database("last_race.sqlite", (err) => {
  if (err) {
    throw err;
  }
});

function createPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");

  return { salt, hash };
}

db.serialize(() => {
  db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            salt TEXT NOT NULL,
            hash TEXT NOT NULL
            )
        `);

  db.run(`
            CREATE TABLE lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL
        ) 
            `);

  db.run(`
            CREATE TABLE stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
        )
            `);

  db.run(`
            CREATE TABLE line_stations (
                line_id INTEGER NOT NULL,
                station_id INTEGER NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (line_id, station_id),
                FOREIGN KEY (line_id) REFERENCES lines(id),
                FOREIGN KEY (station_id) REFERENCES stations(id)
            )
            `);

  db.run(`
            CREATE TABLE events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                effect INTEGER NOT NULL
            )
            `);

  db.run(`
            CREATE TABLE games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                start_station_id INTEGER NOT NULL,
                destination_station_id INTEGER NOT NULL,
                score INTEGER,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (start_station_id) REFERENCES stations(id),
                FOREIGN KEY (destination_station_id) REFERENCES stations(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            `);

  db.run(`
            CREATE TABLE game_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                step_number INTEGER NOT NULL,
                from_station_id INTEGER NOT NULL,
                to_station_id INTEGER NOT NULL,
                event_id INTEGER NOT NULL,
                coins_after INTEGER NOT NULL,
                FOREIGN KEY (from_station_id) REFERENCES stations(id),
                FOREIGN KEY (to_station_id) REFERENCES stations(id),
                FOREIGN KEY (game_id) REFERENCES games(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
            `);

  const users = [
    ["alice@studenti.it", "Alice", "password"],
    ["bob@studenti.it", "Bob", "password"],
    ["carol@studenti.it", "Carol", "password"],
  ];

  for (const user of users) {
    const password = createPassword(user[2]);

    db.run("INSERT INTO users(email, name, salt, hash) VALUES (?,?,?,?)", [
      user[0],
      user[1],
      password.salt,
      password.hash,
    ]);
  }

  db.run(`
                INSERT INTO lines(name, color) VALUES 
                ('Red Line', 'red'),
                ('Blue Line', 'blue'),
                ('Green Line', 'green'),
                ('Yellow Line', 'yellow')
                `);

  db.run(`
                    INSERT INTO stations(name) VALUES
                    ('Sabotino'),
                    ('Porta Palazzo'),
                    ('Monte del Capuccine'),
                    ('Mole'),
                    ('Milano Centrale'),
                    ('Grugliasco'),
                    ('Vittorio Emmanuele II'),
                    ('Superga'),
                    ('Porta Nuova'),
                    ('Porta Susa'),
                    ('Lago Como'),
                    ('Stadio Olimpico'),
                    ('San Siro')
                    `);

  db.run(`
                    INSERT INTO line_stations(line_id, station_id, position) VALUES
                    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4),
                    (2, 1, 1), (2, 5, 2), (2, 6, 3), (2, 7, 4),
                    (3, 2, 1), (3, 8, 2), (3, 9, 3), (3, 10, 4),
                    (4, 4, 1), (4, 11, 2), (4, 12, 3), (4, 13, 4), (4, 7, 5)
                    `);

  db.run(`
                    INSERT INTO events(description, effect) VALUES
                    ('Quiet journey', 0),
                    ('Wrong platform', -2),
                    ('Kind passenger', 1),
                    ('Found a lost ticket', 2),
                    ('Crowded train', -1),
                    ('Internet connection', 3),
                    ('Ticket inspection fine', -4),
                    ('Lucky shortcut', 4)
                    `);

  db.run(`
    INSERT INTO games(user_id, start_station_id, destination_station_id, score, status, created_at) VALUES
    (1, 1, 7, 24, 'completed', datetime('now', '-3 days')),
    (1, 2, 10, 18, 'completed', datetime('now', '-2 days')),
    (2, 4, 7, 15, 'completed', datetime('now', '-1 day'))
  `);
});

db.close((err) => {
  if (err) throw err;
  console.log("Database created.");
});
