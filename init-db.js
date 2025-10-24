// init-db.js
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const dbFile = './koskita.db'
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
const db = new sqlite3.Database(dbFile)

db.serialize(() => {
  db.run(`CREATE TABLE listings (
    id TEXT PRIMARY KEY,
    title TEXT,
    area TEXT,
    price INTEGER,
    owner TEXT,
    gender TEXT,
    ac INTEGER,
    wifi INTEGER,
    bath INTEGER,
    img TEXT
  )`)

  db.run(`CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    name TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TEXT,
    FOREIGN KEY(listing_id) REFERENCES listings(id)
  )`)

  const sample = [
    ['k1','Kos Putri UNAND Residence','UNAND',550000,'+6281234567890','putri',1,1,0,''],
    ['k2','Kost dekat UNP - Kamar AC','UNP',750000,'+6281398765432','campur',1,0,1,''],
    ['k3','Kos Ekonomi UIN','UIN Imam Bonjol',350000,'+6281212345678','putri',0,0,0,''],
    ['k4','Kost Mahasiswa Politeknik','Politeknik Negeri Padang',450000,'+6281300112233','putra',0,1,1,'']
  ]

  const stmt = db.prepare('INSERT INTO listings VALUES (?,?,?,?,?,?,?,?,?,?)')
  sample.forEach(s => stmt.run(...s))
  stmt.finalize()

  console.log('Database initialized with sample listings -> koskita.db')
})

db.close()
