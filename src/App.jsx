import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function PropertyForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || {
    title: '', description: '', price: 0, location: '', bedrooms: 0, bathrooms: 0, area_sqm: 0, images: []
  })
  const [imageInput, setImageInput] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    const isNew = !initial?.id
    const url = isNew ? `${API_BASE}/api/properties` : `${API_BASE}/api/properties/${initial.id}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
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
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
        <input className="input" placeholder="Location" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} required />
        <input className="input" type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price: parseFloat(e.target.value)})} required />
        <input className="input" type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms: parseInt(e.target.value||0)})} />
        <input className="input" type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={e=>setForm({...form, bathrooms: parseFloat(e.target.value||0)})} />
        <input className="input" type="number" placeholder="Area (sqm)" value={form.area_sqm} onChange={e=>setForm({...form, area_sqm: parseFloat(e.target.value||0)})} />
      </div>
      <textarea className="input" placeholder="Description" value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})} />
      <div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Image URL" value={imageInput} onChange={e=>setImageInput(e.target.value)} />
          <button type="button" onClick={addImage} className="btn">Add Image</button>
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

function App() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchProps = async () => {
    setLoading(true)
    const res = await fetch(`${API_BASE}/api/properties`)
    const data = await res.json()
    setProperties(data)
    setLoading(false)
  }
  useEffect(()=>{ fetchProps() },[])

  const remove = async (id) => {
    if (!confirm('Delete this property?')) return
    const res = await fetch(`${API_BASE}/api/properties/${id}`, { method: 'DELETE' })
    if (res.ok) setProperties(prev=>prev.filter(p=>p.id!==id))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Robinsons Land Properties</h1>
          <button className="btn" onClick={()=>setShowCreate(true)}>Add Property</button>
        </header>

        {loading ? (
          <div className="text-blue-200">Loading...</div>
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
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-sm" onClick={()=>{ setEditing(p); setShowCreate(true) }}>Edit</button>
                    <button className="btn-sm danger" onClick={()=>remove(p.id)}>Delete</button>
                  </div>
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
              <BookingForm property={selected} onSubmitted={()=>{ alert('Inquiry submitted. If calendar is configured, an event will be created.'); setSelected(null) }} />
            </div>
          </div>
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
