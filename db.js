// db.js
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'koskita.db')
const db = new sqlite3.Database(dbPath, (err)=>{ if(err) console.error('DB error',err) })
module.exports = db
