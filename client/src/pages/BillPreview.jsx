import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import InvoiceTemplate from '../components/InvoiceTemplate'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function BillPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bill, setBill]       = useState(null)
  const [loading, setLoading] = useState(true)
  const templateRef = useRef(null)

  useEffect(() => {
    axios.get(`${API}/api/bills/${id}`)
      .then(r => setBill(r.data))
      .catch(() => alert('Bill not found'))
      .finally(() => setLoading(false))
  }, [id])

  function downloadPDF() {
    if (!bill) return;

    // Save the bill data to localStorage exactly like the old_bill project does
    const invoiceData = {
      to: bill.to || '',
      toAddress: bill.toAddress || '',
      gstNo: bill.gstNo || '',
      billNo: bill.billNo || '',
      billDate: bill.billDate || '',
      orderNo: bill.orderNo || '',
      orderDate: bill.orderDate || '',
      dcNo: bill.dcNo || '',
      dcDate: bill.dcDate || '',
      amountInWords: bill.amountInWords || '',
      totalBeforeTax: bill.totalBeforeTax || '0',
      totalCGST: bill.totalCGST || '0',
      totalSGST: bill.totalSGST || '0',
      totalIGST: bill.totalIGST || '0',
      totalAfterTax: bill.totalAfterTax || '0',
      extraCharges: bill.extraCharges || '0',
      extraReason: bill.extraReason || '',
      products: (bill.products || []).map(p => ({
        desc: p.desc || '',
        hsn: p.hsn || '',
        qty: p.qty || 0,
        rate: p.rate || 0,
        cgst: p.cgst || '',
        cgstAmt: p.cgstAmt || '0',
        sgst: p.sgst || '',
        sgstAmt: p.sgstAmt || '0',
        igst: p.igst || '',
        igstAmt: p.igstAmt || '0',
      }))
    };

    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));

    // Open the standalone print.html page in a new tab
    // This is the EXACT same approach as old_bill project
    window.open('/print.html', '_blank');
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:80, color:'var(--text-dim)' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
      <p>Loading bill...</p>
    </div>
  )

  if (!bill) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <p>Bill not found.</p>
    </div>
  )

  return (
    <div>
      {/* Action Bar */}
      <div className="grid-mobile-stack" style={{ display:'flex', gap:10, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
        <button className="btn btn-ghost" style={{ flexGrow: window.innerWidth < 640 ? 1 : 0, justifyContent: 'center' }} onClick={() => navigate('/bills')}>← Back</button>
        <button className="btn btn-primary" style={{ flexGrow: window.innerWidth < 640 ? 1 : 0, justifyContent: 'center' }} onClick={() => navigate('/create')}>➕ New Bill</button>
        <button className="btn btn-success" style={{ width: window.innerWidth < 640 ? '100%' : 'auto', justifyContent: 'center' }} onClick={downloadPDF}>
          📥 Download PDF
        </button>
        <div className="show-desktop" style={{ marginLeft:'auto', color:'var(--text-dim)', fontSize:12, fontWeight:500 }}>
          Bill #{bill.billNo || '—'} · {bill.to}
        </div>
      </div>

      <div className="card" style={{ overflowX:'auto', background:'var(--bg-active)', padding: window.innerWidth < 640 ? 10 : 20, borderRadius:12 }}>
        <div style={{ minWidth: 800 }}>
          <InvoiceTemplate data={bill} ref={templateRef} />
        </div>
      </div>
    </div>
  )
}
