import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function LoginModal({ onClose, onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Login failed')
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_email', data.email)
      onLoggedIn({ token: data.token, email: data.email })
      onClose()
    } catch (e) {
      alert(e.message)
    } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Admin Login</h2>
          <button className="btn-sm danger" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="btn w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  )
}

function PropertyForm({ initial, onCancel, onSaved, adminToken }) {
  const [form, setForm] = useState(initial || {
    title: '', description: '', price: 0, location: '', bedrooms: 0, bathrooms: 0, area_sqm: 0, images: []
  })
  const [imageInput, setImageInput] = useState('')
  const [file, setFile] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    const isNew = !initial?.id
    const url = isNew ? `${API_BASE}/api/properties` : `${API_BASE}/api/properties/${initial.id}`
    const method = isNew ? 'POST' : 'PUT'
    const headers = { 'Content-Type': 'application/json' }
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) {
      onSaved(data)
    } else {
      alert(data?.detail || 'Failed to save')
    }
  }
  const addImage = () => {
    if (!imageInput.trim()) return
    setForm({ ...form, images: [...(form.images||[]), imageInput.trim()] })
    setImageInput('')
  }
  const uploadFile = async () => {
    if (!file) return
    if (!adminToken) { alert('Login required to upload'); return }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` }, body: fd })
    const data = await res.json()
    if (res.ok && data.url) {
      // if backend serves /uploads, concatenate API_BASE for absolute URL
      const absolute = data.url.startsWith('http') ? data.url : `${API_BASE}${data.url}`
      setForm({ ...form, images: [...(form.images||[]), absolute] })
      setFile(null)
    } else {
      alert(data?.detail || 'Upload failed')
    }
  }
  useEffect(()=>{ setForm(initial || { title:'', description:'', price:0, location:'', bedrooms:0, bathrooms:0, area_sqm:0, images:[] }) }, [initial])
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
        <input className="input" placeholder="Location" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} required />
        <input className="input" type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price: parseFloat(e.target.value || 0)})} required />
        <input className="input" type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms: parseInt(e.target.value||0)})} />
        <input className="input" type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={e=>setForm({...form, bathrooms: parseFloat(e.target.value||0)})} />
        <input className="input" type="number" placeholder="Area (sqm)" value={form.area_sqm} onChange={e=>setForm({...form, area_sqm: parseFloat(e.target.value||0)})} />
      </div>
      <textarea className="input" placeholder="Description" value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})} />
      <div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Image URL" value={imageInput} onChange={e=>setImageInput(e.target.value)} />
          <button type="button" onClick={addImage} className="btn">Add URL</button>
        </div>
        <div className="flex gap-2 mt-2 items-center">
          <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} className="text-sm" />
          <button type="button" onClick={uploadFile} className="btn">Upload Image</button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {(form.images||[]).map((img, idx)=> (
            <div key={idx} className="relative">
              <img src={img} className="w-24 h-16 object-cover rounded" />
              <button type="button" className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6" onClick={()=>setForm({...form, images: form.images.filter((_,i)=>i!==idx)})}>×</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn">{initial?.id ? 'Update' : 'Create'}</button>
      </div>
    </form>
  )
}

function BookingForm({ property, onSubmitted }) {
  const [form, setForm] = useState({
    property_id: property.id,
    name: '', email: '', phone: '', message: '', preferred_datetime: ''
  })
  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, preferred_datetime: form.preferred_datetime ? new Date(form.preferred_datetime).toISOString() : null }
    const res = await fetch(`${API_BASE}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (res.ok) {
      onSubmitted(data)
    } else {
      alert(data?.detail || 'Failed to submit')
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="input" placeholder="Your name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
      <input className="input" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
      <input className="input" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
      <textarea className="input" placeholder="Message" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} />
      <label className="block text-sm text-blue-200">Preferred viewing date & time</label>
      <input className="input" type="datetime-local" value={form.preferred_datetime} onChange={e=>setForm({...form, preferred_datetime:e.target.value})} />
      <div className="text-right">
        <button className="btn" type="submit">Send Inquiry</button>
      </div>
    </form>
  )
}

function Filters({ value, onChange, onApply }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
      <input className="input" placeholder="Search" value={value.q} onChange={e=>onChange({ ...value, q: e.target.value })} />
      <input className="input" placeholder="Location" value={value.location} onChange={e=>onChange({ ...value, location: e.target.value })} />
      <input className="input" type="number" placeholder="Min Price" value={value.minPrice} onChange={e=>onChange({ ...value, minPrice: e.target.value })} />
      <input className="input" type="number" placeholder="Max Price" value={value.maxPrice} onChange={e=>onChange({ ...value, maxPrice: e.target.value })} />
      <input className="input" type="number" placeholder="Min Bedrooms" value={value.minBedrooms} onChange={e=>onChange({ ...value, minBedrooms: e.target.value })} />
      <div className="md:col-span-5 text-right">
        <button className="btn" onClick={onApply} type="button">Apply Filters</button>
      </div>
    </div>
  )
}

function App() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ q: '', location: '', minPrice: '', maxPrice: '', minBedrooms: '' })
  const [showLogin, setShowLogin] = useState(false)
  const [admin, setAdmin] = useState({ token: localStorage.getItem('admin_token') || '', email: localStorage.getItem('admin_email') || '' })

  const fetchProps = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.location) params.set('location', filters.location)
    if (filters.minPrice) params.set('min_price', filters.minPrice)
    if (filters.maxPrice) params.set('max_price', filters.maxPrice)
    if (filters.minBedrooms) params.set('min_bedrooms', filters.minBedrooms)
    const url = `${API_BASE}/api/properties${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    setProperties(data)
    setLoading(false)
  }
  useEffect(()=>{ fetchProps() },[])

  const remove = async (id) => {
    if (!confirm('Delete this property?')) return
    const headers = {}
    if (admin.token) headers['Authorization'] = `Bearer ${admin.token}`
    const res = await fetch(`${API_BASE}/api/properties/${id}`, { method: 'DELETE', headers })
    if (res.ok) setProperties(prev=>prev.filter(p=>p.id!==id))
    else {
      const data = await res.json().catch(()=>({}))
      alert(data?.detail || 'Failed to delete (are you logged in?)')
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_email')
    setAdmin({ token: '', email: '' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Robinsons Land Properties</h1>
          <div className="flex items-center gap-2">
            {admin.token ? (
              <>
                <span className="text-blue-200 text-sm hidden sm:block">{admin.email}</span>
                <button className="btn-outline" onClick={()=>setShowCreate(true)}>Add Property</button>
                <button className="btn-sm danger" onClick={logout}>Logout</button>
              </>
            ) : (
              <button className="btn" onClick={()=>setShowLogin(true)}>Admin Login</button>
            )}
          </div>
        </header>

        <Filters value={filters} onChange={setFilters} onApply={fetchProps} />

        {loading ? (
          <div className="text-blue-200">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="text-blue-200">No properties found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(p => (
              <div key={p.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                {p.images?.[0] && <img src={p.images[0]} className="w-full h-40 object-cover rounded mb-3" />}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold">{p.title}</h3>
                    <p className="text-blue-200 text-sm">{p.location}</p>
                    <p className="mt-1">₱{Number(p.price).toLocaleString()}</p>
                    <p className="text-sm text-blue-300 mt-1">{p.bedrooms ?? 0} beds • {p.bathrooms ?? 0} baths • {p.area_sqm ?? 0} sqm</p>
                  </div>
                  {admin.token && (
                    <div className="flex gap-2">
                      <button className="btn-sm" onClick={()=>{ setEditing(p); setShowCreate(true) }}>Edit</button>
                      <button className="btn-sm danger" onClick={()=>remove(p.id)}>Delete</button>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <button className="btn-outline w-full" onClick={()=>setSelected(p)}>Book / Inquire</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{editing ? 'Edit Property' : 'Add Property'}</h2>
                <button className="btn-sm danger" onClick={()=>{ setShowCreate(false); setEditing(null) }}>Close</button>
              </div>
              <PropertyForm
                initial={editing}
                adminToken={admin.token}
                onCancel={()=>{ setShowCreate(false); setEditing(null) }}
                onSaved={(saved)=>{
                  setShowCreate(false); setEditing(null)
                  setProperties(prev=>{
                    const idx = prev.findIndex(p=>p.id===saved.id)
                    if (idx>=0) { const copy=[...prev]; copy[idx]=saved; return copy }
                    return [saved, ...prev]
                  })
                }}
              />
            </div>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Book / Inquire</h2>
                <button className="btn-sm danger" onClick={()=>setSelected(null)}>Close</button>
              </div>
              <BookingForm property={selected} onSubmitted={()=>{ alert('Inquiry submitted. If calendar and email are configured, an event and confirmation will be sent.'); setSelected(null) }} />
            </div>
          </div>
        )}

        {showLogin && (
          <LoginModal onClose={()=>setShowLogin(false)} onLoggedIn={(adm)=>setAdmin(adm)} />
        )}
      </div>

      <style>{`
        .input{ background:#0f172a; border:1px solid #1e293b; border-radius:0.75rem; padding:0.6rem 0.8rem; width:100%; color:white }
        .btn{ background:#2563eb; color:white; padding:0.6rem 1rem; border-radius:0.75rem }
        .btn:hover{ background:#1d4ed8 }
        .btn-outline{ border:1px solid #334155; color:#e2e8f0; padding:0.6rem 1rem; border-radius:0.75rem }
        .btn-sm{ background:#334155; color:white; padding:0.35rem 0.6rem; border-radius:0.5rem; font-size:0.85rem }
        .btn-sm.danger{ background:#b91c1c }
        .danger{ background:#b91c1c }
      `}</style>
    </div>
  )
}

export default App
