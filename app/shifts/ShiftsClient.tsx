'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
const inputStyle = { padding: '12px', color: '#111', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }

export default function ShiftsClient() {
  const [shifts, setShifts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [openingCash, setOpeningCash] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')

  async function load() {
    const { data: sh } = await supabase.from('shifts').select('*').order('opened_at', { ascending: false })
    setShifts(sh || [])
    const { data: s } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(500)
    setSales(s || [])
  }
  useEffect(() => { load() }, [])

  const openShift = shifts.find(s => s.status === 'open')

  function salesForShift(shift: any) {
    return sales.filter(s => {
      if (s.status === 'refunded') return false
      if (shift.closed_at) return s.created_at >= shift.opened_at && s.created_at <= shift.closed_at
      return s.created_at >= shift.opened_at
    })
  }

  function totalsFor(shift: any) {
    const list = salesForShift(shift)
    const cash = list.filter(s => s.payment_method === 'Cash').reduce((a, s) => a + Number(s.total || 0), 0)
    const cardSales = list.filter(s => s.payment_method === 'Card').reduce((a, s) => a + Number(s.total || 0), 0)
    const eft = list.filter(s => s.payment_method === 'EFT').reduce((a, s) => a + Number(s.total || 0), 0)
    return { cash, card: cardSales, eft, total: cash + cardSales + eft, count: list.length }
  }

  async function openNewShift() {
    const { error } = await supabase.from('shifts').insert([{ opening_cash: Number(openingCash || 0), status: 'open' }])
    if (error) alert(error.message)
    else { setOpeningCash(''); load() }
  }

  async function closeShift() {
    if (!openShift) return
    const t = totalsFor(openShift)
    const expected = Number(openShift.opening_cash || 0) + t.cash
    const { error } = await supabase.from('shifts').update({
      closed_at: new Date().toISOString(),
      closing_cash: Number(closingCash || 0),
      expected_cash: expected,
      cash_sales: t.cash,
      card_sales: t.card,
      eft_sales: t.eft,
      total_sales: t.total,
      status: 'closed',
      notes
    }).eq('id', openShift.id)
    if (error) alert(error.message)
    else { setClosingCash(''); setNotes(''); load() }
  }

  const live = openShift ? totalsFor(openShift) : null
  const liveExpected = openShift && live ? Number(openShift.opening_cash || 0) + live.cash : 0

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: 0 }}>Cash Shifts / Daily Close</h1>
      <p style={{ color: '#64748b' }}>Open in the morning, close at night. Know exactly what should be in the till.</p>

      {!openShift ? (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>☀️ Open New Shift</h3>
          <p style={{ color: '#64748b' }}>How much cash is in the till right now?</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input style={inputStyle} type="number" placeholder="Opening cash e.g. 500" value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
            <button onClick={openNewShift} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: '800', cursor: 'pointer' }}>Open Shift</button>
          </div>
        </div>
      ) : (
        <div style={{ ...card, marginTop: 16, borderLeft: '4px solid #16a34a' }}>
          <h3 style={{ marginTop: 0 }}>🟢 Shift Open - Since {new Date(openShift.opened_at).toLocaleString()}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
            <div><small style={{ color: '#64748b', fontWeight: '700' }}>OPENING CASH</small><h2 style={{ margin: '4px 0' }}>N${Number(openShift.opening_cash).toFixed(2)}</h2></div>
            <div><small style={{ color: '#64748b', fontWeight: '700' }}>CASH SALES</small><h2 style={{ margin: '4px 0', color: '#16a34a' }}>N${live?.cash.toFixed(2)}</h2></div>
            <div><small style={{ color: '#64748b', fontWeight: '700' }}>CARD / EFT</small><h2 style={{ margin: '4px 0' }}>N${((live?.card || 0) + (live?.eft || 0)).toFixed(2)}</h2></div>
            <div><small style={{ color: '#64748b', fontWeight: '700' }}>EXPECTED IN TILL</small><h2 style={{ margin: '4px 0' }}>N${liveExpected.toFixed(2)}</h2></div>
          </div>
          <p style={{ color: '#64748b' }}>{live?.count} sales this shift • Total sales N${live?.total.toFixed(2)}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <input style={inputStyle} type="number" placeholder="Cash counted at close" value={closingCash} onChange={e => setClosingCash(e.target.value)} />
            <input style={inputStyle} placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
            <button onClick={closeShift} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: '800', cursor: 'pointer' }}>Close Shift</button>
          </div>
          {closingCash !== '' && <p style={{ fontWeight: '700', color: Number(closingCash) - liveExpected >= 0 ? '#16a34a' : '#dc2626' }}>Difference: N${(Number(closingCash) - liveExpected).toFixed(2)} {Number(closingCash) - liveExpected >= 0 ? '(over)' : '(short)'}</p>}
        </div>
      )}

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>📋 Past Shifts</h3>
        {shifts.length === 0 && <p style={{ color: '#94a3b8' }}>No shifts yet. Open your first one above.</p>}
        {shifts.map(s => {
          const t = s.status === 'closed' ? { cash: Number(s.cash_sales), card: Number(s.card_sales), eft: Number(s.eft_sales), total: Number(s.total_sales) } : totalsFor(s)
          return (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span><b>{new Date(s.opened_at).toLocaleDateString()}</b> • {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'OPEN'}</span>
              <span>{s.status === 'open' ? <b style={{ color: '#16a34a' }}>OPEN</b> : <span>Total N${t.total.toFixed(2)} • Cash N${t.cash.toFixed(2)} • Counted N${Number(s.closing_cash || 0).toFixed(2)} • Diff N${(Number(s.closing_cash || 0) - Number(s.expected_cash || 0)).toFixed(2)}</span>}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}