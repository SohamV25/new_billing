import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function CustomerAutocomplete({ value, onChange, onSelect }) {
  const [query, setQuery]       = useState(value || '')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const wrapRef = useRef(null)

  // Sync external value
  useEffect(() => { setQuery(value || '') }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch suggestions
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/api/customers?q=${encodeURIComponent(query)}`)
        setResults(res.data)
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(customer) {
    setQuery(customer.name)
    onChange(customer.name)
    onSelect(customer)
    setOpen(false)
    setResults([])
  }

  function handleChange(e) {
    setQuery(e.target.value)
    onChange(e.target.value)
    if (!e.target.value) onSelect({ name: '', address: '', city: '', gst: '' })
  }

  return (
    <div className="autocomplete-wrap" ref={wrapRef}>
      <input
        type="text"
        className="form-input"
        placeholder="Type to search customer..."
        value={query}
        onChange={handleChange}
        onFocus={() => results.length && setOpen(true)}
      />
      {loading && (
        <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)', fontSize:11 }}>
          searching...
        </div>
      )}
      {open && results.length > 0 && (
        <div className="autocomplete-list">
          {results.map(c => (
            <div key={c._id} className="autocomplete-item" onClick={() => handleSelect(c)}>
              <div>{c.name}</div>
              <div className="ac-sub">{[c.city, c.gst].filter(Boolean).join(' · ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
