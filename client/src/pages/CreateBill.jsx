import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import CustomerAutocomplete from '../components/CustomerAutocomplete'

const API = 'http://localhost:5001'

const productLibrary = {
  'Procto Tub':      { hsn: '94029090', price: '2500.00' },
  'Perianal support':{ hsn: '90189099', price: '170.00'  },
  'Perianal Cushion':{ hsn: '90189099', price: '400.00'  },
}

const emptyRow = () => ({ desc:'', hsn:'', qty:'', rate:'', cgst:'', cgstAmt:'', sgst:'', sgstAmt:'', igst:'', igstAmt:'' })

function todayDDMMYYYY() {
  const d = new Date()
  return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), d.getFullYear()].join('/')
}

function numberToWords(num) {
  const a = ['','one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
  const b = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
  function conv(n) {
    if (n < 20)       return a[n]
    if (n < 100)      return b[Math.floor(n/10)] + (n%10 ? ' '+a[n%10] : '')
    if (n < 1000)     return a[Math.floor(n/100)] + ' hundred' + (n%100 ? ' and '+conv(n%100) : '')
    if (n < 100000)   return conv(Math.floor(n/1000)) + ' thousand' + (n%1000 ? ' '+conv(n%1000) : '')
    if (n < 10000000) return conv(Math.floor(n/100000)) + ' lakh' + (n%100000 ? ' '+conv(n%100000) : '')
    return 'too large'
  }
  return conv(num).replace(/^./, c => c.toUpperCase())
}

export default function CreateBill() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    to:'', toAddress:'', gstNo:'',
    billNo:'', billDate: todayDDMMYYYY(),
    orderNo:'', orderDate:'', dcNo:'', dcDate:'',
    extraReason:'', extraCharges:'0',
  })
  const [rows, setRows] = useState([emptyRow()])
  const [summary, setSummary] = useState({ totalBeforeTax:'0.00', totalCGST:'0.00', totalSGST:'0.00', totalIGST:'0.00', totalAfterTax:'0.00', amountInWords:'' })
  const [saving, setSaving] = useState(false)

  // Fetch next bill number on mount
  useEffect(() => {
    axios.get(`${API}/api/bills/next-number`)
      .then(r => setForm(f => ({ ...f, billNo: String(r.data.nextBillNo) })))
      .catch(e => console.error('Failed to fetch next bill number', e))
  }, [])

  // Recalculate whenever rows or extraCharges changes
  useEffect(() => {
    let tBefore=0, tCGST=0, tSGST=0, tIGST=0
    const updated = rows.map(r => {
      const qty  = parseFloat(r.qty)  || 0
      const rate = parseFloat(r.rate) || 0
      const base = qty * rate
      const cA = (base * (parseFloat(r.cgst)||0)) / 100
      const sA = (base * (parseFloat(r.sgst)||0)) / 100
      const iA = (base * (parseFloat(r.igst)||0)) / 100
      tBefore += base; tCGST += cA; tSGST += sA; tIGST += iA
      return { ...r, cgstAmt: cA.toFixed(2), sgstAmt: sA.toFixed(2), igstAmt: iA.toFixed(2) }
    })
    const extra  = parseFloat(form.extraCharges) || 0
    const tAfter = tBefore + tCGST + tSGST + tIGST + extra
    setSummary({
      totalBeforeTax: tBefore.toFixed(2),
      totalCGST:      tCGST.toFixed(2),
      totalSGST:      tSGST.toFixed(2),
      totalIGST:      tIGST.toFixed(2),
      totalAfterTax:  tAfter.toFixed(2),
      amountInWords:  tAfter > 0 ? numberToWords(Math.round(tAfter)) + ' only' : '',
    })
    // patch computed amt cols back (avoid re-trigger)
    const same = updated.every((r,i) => r.cgstAmt===rows[i]?.cgstAmt && r.sgstAmt===rows[i]?.sgstAmt && r.igstAmt===rows[i]?.igstAmt)
    if (!same) setRows(updated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map(r=>`${r.qty}|${r.rate}|${r.cgst}|${r.sgst}|${r.igst}`).join(','), form.extraCharges])

  function handleForm(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  function handleRow(idx, field, val) {
    setRows(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: val }
      // Product auto-fill
      if (field === 'desc' && productLibrary[val]) {
        next[idx].hsn  = productLibrary[val].hsn
        next[idx].rate = productLibrary[val].price
      }
      return next
    })
  }

  function addRow()      { setRows(p => [...p, emptyRow()]) }
  function removeRow(i)  { setRows(p => p.filter((_,idx) => idx!==i)) }

  async function handleGenerate() {
    if (!form.to.trim()) { alert('Please enter buyer name'); return }
    setSaving(true)
    try {
      // 1. Auto-save/update customer details
      await axios.post(`${API}/api/customers/upsert`, {
        name: form.to,
        address: form.toAddress.split(',')[0]?.trim() || form.toAddress, // rough heuristic
        city: form.toAddress.split(',')[1]?.trim() || '',
        gst: form.gstNo
      }).catch(e => console.error('Failed to auto-save customer', e));

      // 2. Generate the bill
      const payload = { ...form, ...summary, products: rows }
      const res = await axios.post(`${API}/api/bills`, payload)
      navigate(`/bills/${res.data._id}`)
    } catch(e) {
      alert('Failed to save bill: ' + (e.response?.data?.message || e.message))
    } finally { setSaving(false) }
  }

  const inputCol = 'style="width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text-main);padding:5px 8px;border-radius:6px;font-size:12px;"'

  return (
    <div style={{ maxWidth:1400 }}>
      {/* Header */}
      <div className="grid-mobile-stack" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700 }}>🧾 Create Tax Invoice</h2>
          <p className="hide-mobile" style={{ color:'var(--text-dim)', fontSize:12, marginTop:3 }}>Fill details and click Generate to save &amp; preview</p>
        </div>
        <button className="btn btn-success" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', justifyContent:'center' }} onClick={handleGenerate} disabled={saving}>
          {saving ? '⏳ Saving...' : '✅ Generate Bill'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Buyer Info ── */}
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Buyer Information</h3>
          <div className="grid-3" style={{ gap:14 }}>
            <div>
              <label className="form-label">To (Buyer Name) *</label>
              <CustomerAutocomplete
                value={form.to}
                onChange={val => setForm(p=>({...p, to:val}))}
                onSelect={c  => setForm(p=>({...p, toAddress:[c.address,c.city].filter(Boolean).join(', '), gstNo:c.gst||''}))}
              />
            </div>
            <div>
              <label className="form-label">Address &amp; City</label>
              <input className="form-input" name="toAddress" value={form.toAddress} onChange={handleForm} placeholder="Auto-filled or type manually" />
            </div>
            <div>
              <label className="form-label">GST No.</label>
              <input className="form-input" name="gstNo" value={form.gstNo} onChange={handleForm} placeholder="Auto-filled..." />
            </div>
          </div>
        </div>

        {/* ── Bill Meta ── */}
        <div className="card" style={{ background:'var(--bg-body)' }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-dim)', marginBottom:14, textTransform:'uppercase', letterSpacing:0.5 }}>Invoice Details</h3>
          <div className="grid-4" style={{ gap:12 }}>
            <style>{`
              @media (min-width: 1200px) {
                .invoice-details-grid { grid-template-columns: repeat(6, 1fr) !important; }
              }
            `}</style>
            <div className="grid-4 invoice-details-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, width:'100%', gridColumn:'1/-1' }}>
              {[
                ['billNo','Bill No.',''],
                ['billDate','Bill Date','DD/MM/YYYY'],
                ['orderNo','Order No.',''],
                ['orderDate','Order Date','DD/MM/YYYY'],
                ['dcNo','D.C. No.',''],
                ['dcDate','D.C. Date','DD/MM/YYYY'],
              ].map(([name,label,ph]) => (
                <div key={name}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" name={name} value={form[name]} onChange={handleForm} placeholder={ph} style={{ fontSize:12, padding:'7px 10px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Product Table ── */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:0.5 }}>Products</h3>
            <button className="btn btn-ghost btn-sm" onClick={addRow}>＋ Add Row</button>
          </div>
          <div className="responsive-table">
            <table className="product-table mobile-cards" style={{ minWidth: window.innerWidth > 768 ? 900 : '100%' }}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ minWidth:180 }}>Description</th>
                  <th rowSpan="2" style={{ minWidth:90 }}>HSN</th>
                  <th rowSpan="2" style={{ minWidth:70 }}>Qty</th>
                  <th rowSpan="2" style={{ minWidth:80 }}>Rate</th>
                  <th colSpan="2">CGST</th>
                  <th colSpan="2">SGST</th>
                  <th colSpan="2">IGST</th>
                  <th rowSpan="2" style={{ width:40 }}>Del</th>
                </tr>
                <tr>
                  <th>%</th><th style={{ minWidth:75 }}>Amt</th>
                  <th>%</th><th style={{ minWidth:75 }}>Amt</th>
                  <th>%</th><th style={{ minWidth:75 }}>Amt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i) => (
                  <tr key={i}>
                    <td data-label="Description">
                      <input list="prodList" className="form-input" style={{ fontSize:12, padding:'5px 8px' }}
                        value={r.desc} onChange={e=>handleRow(i,'desc',e.target.value)} placeholder="Product name" />
                    </td>
                    {[
                      ['hsn','HSN'],['qty','Qty'],['rate','Rate'],['cgst','CGST %'],['cgstAmt','CGST Amt'],
                      ['sgst','SGST %'],['sgstAmt','SGST Amt'],['igst','IGST %'],['igstAmt','IGST Amt']
                    ].map(([f, label]) => (
                      <td key={f} data-label={label}>
                        <input className="form-input" style={{ fontSize:12, padding:'5px 8px', textAlign:'right' }}
                          value={r[f]} readOnly={f.endsWith('Amt')}
                          onChange={e=>handleRow(i,f,e.target.value)} />
                      </td>
                    ))}
                    <td data-label="Action">
                      <button onClick={()=>removeRow(i)} style={{ background:'none', border:'none', color:'var(--danger)', fontSize:18, cursor:'pointer', width: '100%', textAlign: 'center' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="prodList">{Object.keys(productLibrary).map(n=><option key={n} value={n}/>)}</datalist>
          </div>
        </div>

        {/* ── Extra Charges + Summary ── */}
        <div className="grid-2" style={{ gap:20, alignItems:'start' }}>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="card">
              <h3 style={{ fontSize:12, fontWeight:700, color:'var(--text-dim)', marginBottom:12, textTransform:'uppercase' }}>Extra Charges</h3>
              <div className="grid-2" style={{ gap:10 }}>
                <div>
                  <label className="form-label">Reason</label>
                  <input className="form-input" name="extraReason" value={form.extraReason} onChange={handleForm} placeholder="Courier" />
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <input className="form-input" type="number" name="extraCharges" value={form.extraCharges} onChange={handleForm} style={{ textAlign:'right' }} />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Amount in Words</label>
              <textarea className="form-input" rows={2} readOnly value={summary.amountInWords} style={{ resize:'none', fontSize: 12 }} />
            </div>
          </div>

          <div className="summary-box">
            {[
              ['Before Tax', summary.totalBeforeTax, false],
              ['Total CGST', summary.totalCGST, false],
              ['Total SGST', summary.totalSGST, false],
              ['Total IGST', summary.totalIGST, false],
              ['Total Payable', summary.totalAfterTax, true],
            ].map(([label, val, bold]) => (
              <div className="summary-row" key={label}>
                <span className="summary-label" style={{ fontSize: 12 }}>{label}</span>
                <span className="summary-val" style={bold?{color:'var(--accent)',fontSize:18,fontWeight:800}:{fontSize: 14}}>
                  ₹ {val}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
