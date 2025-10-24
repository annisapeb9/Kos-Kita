// public/app.js
const apiBase = '' // sama origin

function fmt(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }

async function fetchListings(){
  const q = document.getElementById('q').value
  const gender = document.getElementById('gender').value
  const maxPrice = document.getElementById('maxPrice').value
  const params = new URLSearchParams()
  if(q) params.set('q', q)
  if(gender) params.set('gender', gender)
  if(maxPrice) params.set('maxPrice', maxPrice)
  const res = await fetch('/api/listings?' + params.toString())
  return res.json()
}

function placeholder(title){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='%23eef6ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='34' fill='%231f8fff' font-family='Arial,Helvetica'>${escapeHtml(title)}</text></svg>`
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg)
}
function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

async function render(){
  const list = await fetchListings()
  const el = document.getElementById('listings')
  el.innerHTML = ''
  if(list.length===0){ el.innerHTML = '<div class="card">Tidak ada hasil</div>'; return }
  list.forEach(l=>{
    const d = document.createElement('div'); d.className='card listing'
    d.innerHTML = `<img src="${l.img||placeholder(l.title)}" alt="" /><div class="meta"><strong>${escapeHtml(l.title)}</strong><div class="small">${escapeHtml(l.area)} • ${facilityText(l)}</div><div class="price">Rp ${fmt(l.price)}</div><div style="margin-top:8px"><button data-id="${l.id}" class="btnDetail">Detail</button> <button data-id="${l.id}" class="btnChat">Chat</button></div></div>`
    el.appendChild(d)
  })
  document.querySelectorAll('.btnDetail').forEach(b=> b.addEventListener('click', ()=> openDetail(b.dataset.id)))
  document.querySelectorAll('.btnChat').forEach(b=> b.addEventListener('click', ()=> openChatPrefill(b.dataset.id)))
}

function facilityText(l){ return [(l.ac? 'AC':''),(l.wifi? 'WiFi':''),(l.bath? 'Kamar Mandi':'')].filter(Boolean).join(' • ') }

// Tambah listing
document.getElementById('formAdd').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const body = {
    title: document.getElementById('f_title').value,
    area: document.getElementById('f_area').value,
    price: parseInt(document.getElementById('f_price').value),
    owner: document.getElementById('f_owner').value,
    gender: document.getElementById('f_gender').value,
    ac: document.getElementById('f_ac').checked,
    wifi: document.getElementById('f_wifi').checked,
    bath: document.getElementById('f_bath').checked,
    img: document.getElementById('f_img').value
  }
  const res = await fetch('/api/listings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  if(res.ok){ alert('Listing berhasil ditambahkan'); e.target.reset(); render() }
  else alert('Gagal menambahkan')
})

document.getElementById('btnSearch').addEventListener('click', render)

// modal
const modal = document.getElementById('modal')
const modalClose = document.getElementById('modalClose')
modalClose.addEventListener('click', ()=> modal.classList.remove('show'))

async function openDetail(id){
  const res = await fetch('/api/listings/' + id)
  if(!res.ok) return alert('Listing tidak ditemukan')
  const l = await res.json()
  document.getElementById('m_title').innerText = l.title
  document.getElementById('m_area').innerText = l.area
  document.getElementById('m_price').innerText = 'Rp ' + fmt(l.price)
  document.getElementById('m_facilities').innerText = facilityText(l)
  document.getElementById('m_img').src = l.img || placeholder(l.title)

  // Tambah reviews
  const r = await fetch('/api/listings/' + id + '/reviews')
  const reviews = await r.json()
  const revEl = document.getElementById('m_reviews'); revEl.innerHTML = ''
  if(reviews.length===0) revEl.innerHTML = '<div class="small">Belum ada ulasan</div>'
  reviews.forEach(rv=>{
    const div = document.createElement('div'); div.className='card small'; div.style.marginTop='8px'
    div.innerHTML = `<strong>${escapeHtml(rv.name)}</strong> • ${rv.rating} ★ <div>${escapeHtml(rv.comment||'')}</div><div class="muted">${new Date(rv.created_at).toLocaleString()}</div>`
    revEl.appendChild(div)
  })

  // formulir review
  const form = document.getElementById('m_review_form')
  form.onsubmit = async (e)=>{
    e.preventDefault()
    const payload = { name: document.getElementById('r_name').value||'Anonim', rating: parseInt(document.getElementById('r_rating').value), comment: document.getElementById('r_text').value }
    const resp = await fetch('/api/listings/' + id + '/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    if(resp.ok){ alert('Terima kasih untuk ulasan!'); document.getElementById('r_name').value=''; document.getElementById('r_text').value=''; openDetail(id) }
  }

  modal.classList.add('show')
}

// simuasi chat
function loadChat(){
  const msgs = JSON.parse(localStorage.getItem('koskita_chat')||'[]')
  const el = document.getElementById('chatBox'); el.innerHTML = ''
  msgs.forEach(m=>{
    const d = document.createElement('div'); d.className = 'card small'; d.style.marginTop = '6px'; d.innerText = (m.me? 'Anda: ':'Pemilik: ') + m.text
    el.appendChild(d)
  })
}

document.getElementById('chatSend').addEventListener('click', ()=>{
  const t = document.getElementById('chatInput').value.trim(); if(!t) return
  const msgs = JSON.parse(localStorage.getItem('koskita_chat')||'[]')
  msgs.push({id:Date.now(),me:true,text:t})
  msgs.push({id:Date.now()+1,me:false,text:'Terima kasih, pemilik akan menghubungi Anda.'})
  localStorage.setItem('koskita_chat', JSON.stringify(msgs))
  document.getElementById('chatInput').value=''
  loadChat()
})

function openChatPrefill(id){
  fetch('/api/listings/' + id).then(r=>r.json()).then(l=>{
    document.getElementById('chatInput').value = `Halo, saya tertarik dengan ${l.title} di ${l.area}. Mohon info ketersediaan.`
    window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'})
  })
}

// initial
render(); loadChat()
