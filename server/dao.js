import sqlite3 from "sqlite3";
import crypto from "crypto";

const db = new sqlite3.Database("last_race.sqlite", (err) => {
    if(err) throw err;
});

export function getUserByEmail(email){
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE email=?";

        db.get(sql, [email], (err, row) => {
            if(err) reject(err);
            else resolve(row);
        });
    });
}

export function getUserById(id){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, email, name FROM users WHERE id = ?";

        db.get(sql, [id], (err, row) => {
            if(err) reject(err);
            else resolve(row);
        });
    });
}

export function getStations(){
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM stations ORDER BY name";

        db.all(sql, [], (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

export function getLines(){
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM lines ORDER BY id";

        db.all(sql, [], (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

export function getEvents(){
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM events ORDER BY id";

        db.all(sql, [], (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

export function getLineStations(){
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT line_stations.line_id, lines.name AS line_name,
            line_stations.station_id, stations.name AS station_name,
            line_stations.position
        FROM line_stations
        JOIN lines ON line_stations.line_id = lines.id
        JOIN stations ON line_stations.station_id = stations.id
        ORDER BY line_stations.line_id, line_stations.position
        `;

        db.all(sql, [], (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

export function getRanking(){
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT users.id, users.name, MAX(games.score) AS best_score
        FROM users
        JOIN games ON users.id=games.user_id
        WHERE games.status = 'completed'
        GROUP BY users.id, users.name
        ORDER BY best_score DESC, users.name
        `;

        db.all(sql, [], (err, rows) => {
            if(err) reject(err);
            else resolve(rows);
        });
    });
}

export function getSegments() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT s1.id AS station1_id,
        s1.name AS station1_name,
        s2.id AS station2_id,
        s2.name AS station2_name
      FROM line_stations ls1 JOIN line_stations ls2
        ON ls1.line_id = ls2.line_id
        AND ls2.position = ls1.position + 1
      JOIN stations s1 ON ls1.station_id = s1.id
      JOIN stations s2 ON ls2.station_id = s2.id
      ORDER BY s1.name, s2.name
    `;

    db.all(sql, [], (err, rows) => {
      if(err) reject(err);
      else resolve(rows);
    });
  });
}

export function createGame(userId, startStationId, destinationStationId) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO games(user_id, start_station_id, destination_station_id, score, status, created_at)
      VALUES (?, ?, ?, NULL, 'planning', datetime('now'))
    `;

    db.run(sql, [userId, startStationId, destinationStationId], function (err) {
      if (err) reject(err);
      else resolve({
        id: this.lastID,
        start_station_id: startStationId,
        destination_station_id: destinationStationId,
        status: "planning",
      });
    });
  });
}