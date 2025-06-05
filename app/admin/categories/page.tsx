'use client'
import { useEffect, useState } from 'react'

interface Category {
  _id: string
  title: string
  type: 'movie' | 'tv'
  order: number
  enabled: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<Partial<Category>>({})

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(data)
  }

  useEffect(() => { fetchCategories() }, [])

  const submit = async () => {
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({})
    fetchCategories()
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Categories</h1>
      <ul className="mb-6">
        {categories.map(c => (
          <li key={c._id}>{c.title} ({c.type}) {c.enabled ? '✅' : '❌'}</li>
        ))}
      </ul>
      <div className="space-y-2">
        <input className="border p-1" placeholder="id" value={form._id||''} onChange={e=>setForm({...form,_id:e.target.value})}/>
        <input className="border p-1" placeholder="title" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/>
        <select className="border p-1" value={form.type||''} onChange={e=>setForm({...form,type:e.target.value as 'movie'|'tv'})}>
          <option value="">type</option>
          <option value="movie">movie</option>
          <option value="tv">tv</option>
        </select>
        <input className="border p-1" placeholder="order" type="number" value={form.order||''} onChange={e=>setForm({...form,order:Number(e.target.value)})}/>
        <label><input type="checkbox" checked={form.enabled||false} onChange={e=>setForm({...form,enabled:e.target.checked})}/> enabled</label>
        <button className="bg-blue-500 text-white px-2" onClick={submit}>Save</button>
      </div>
    </div>
  )
}
