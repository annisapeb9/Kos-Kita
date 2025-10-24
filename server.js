// server.js
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { randomUUID } = require('crypto')
const db = require('./db')

const app = express()
const PORT = process.env.PORT || 3030

app.use(cors())
app.use(bodyParser.json())
app.use(express.static('public'))

// GET /api/listings  -> list all with optional query parameters
app.get('/api/listings', (req, res) => {
  const q = req.query.q || ''
  const area = req.query.area || ''
  const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null
  const gender = req.query.gender || ''
  const filters = []
  let sql = 'SELECT * FROM listings WHERE 1=1'
  if(q){ sql += ' AND (title LIKE ? OR area LIKE ? OR owner LIKE ?)'; filters.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  if(area){ sql += ' AND area LIKE ?'; filters.push(`%${area}%`) }
  if(maxPrice){ sql += ' AND price <= ?'; filters.push(maxPrice) }
  if(gender){ sql += ' AND gender = ?'; filters.push(gender) }
  db.all(sql, filters, (err, rows) => {
    if(err) return res.status(500).json({error:err.message})
    res.json(rows)
  })
})

// GET single listing
app.get('/api/listings/:id', (req, res) => {
  db.get('SELECT * FROM listings WHERE id = ?', [req.params.id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message})
    if(!row) return res.status(404).json({error:'Not found'})
    res.json(row)
  })
})

// POST create listing
app.post('/api/listings', (req,res)=>{
  const { title, area, price, owner, gender, ac, wifi, bath, img } = req.body
  const id = req.body.id || randomUUID()
  db.run('INSERT INTO listings (id,title,area,price,owner,gender,ac,wifi,bath,img) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [id,title,area,price,owner,gender,ac?1:0,wifi?1:0,bath?1:0,img||''], function(err){
      if(err) return res.status(500).json({error:err.message})
      res.json({id})
    })
})

// POST review
app.post('/api/listings/:id/reviews', (req,res)=>{
  const listingId = req.params.id
  const { name, rating, comment } = req.body
  const id = randomUUID()
  const created_at = new Date().toISOString()
  db.run('INSERT INTO reviews (id,listing_id,name,rating,comment,created_at) VALUES (?,?,?,?,?,?)', [id,listingId,name,rating,comment,created_at], function(err){
    if(err) return res.status(500).json({error:err.message})
    res.json({id})
  })
})

// GET reviews
app.get('/api/listings/:id/reviews', (req,res)=>{
  db.all('SELECT * FROM reviews WHERE listing_id = ? ORDER BY created_at DESC', [req.params.id], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message})
    res.json(rows)
  })
})

// Start server
app.listen(PORT, ()=> console.log(`KosKita server listening on http://localhost:${PORT}`))
