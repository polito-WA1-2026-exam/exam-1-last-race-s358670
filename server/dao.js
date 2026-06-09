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
            line_stations.station_id, stations_name AS station_name,
            line_stations.position
        FROM line_stations
        JOIN lines ON line_stations.line_id = lines.id
        JOIN stations ON line_stations.station_id = station.id
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
