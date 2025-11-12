import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Wallet, Plus, Trash2, Shield, LogIn } from 'lucide-react'

const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/70 backdrop-blur border border-white/40 shadow-sm">
      <div className={`p-3 rounded-xl ${color} text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{formatIDR(value)}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 })
  const [form, setForm] = useState({ tanggal: '', penghuni: '', kamar: '', keterangan: '', jumlah: '', tipe: 'pemasukan' })
  const [adminToken, setAdminToken] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    const res = await fetch(`${API_BASE}/api/transactions`)
    const data = await res.json()
    setItems(data.items || [])
    const sres = await fetch(`${API_BASE}/api/stats`)
    const sdata = await sres.json()
    setStats(sdata)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogin = () => {
    // Simple token login; admin gets token from env
    if (adminToken) setIsAdmin(true)
  }

  const addTransaction = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const payload = {
        ...form,
        jumlah: Number(form.jumlah),
        tanggal: new Date(form.tanggal).toISOString(),
      }
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.detail || 'Gagal menambah transaksi')
        return
      }
      setForm({ tanggal: '', penghuni: '', kamar: '', keterangan: '', jumlah: '', tipe: 'pemasukan' })
      await fetchData()
    } finally {
      setLoading(false)
    }
  }

  const deleteTx = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return
    const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': adminToken },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.detail || 'Gagal menghapus')
      return
    }
    await fetchData()
  }

  const sorted = useMemo(() => items, [items])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 border-b border-white/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow"><Wallet size={22} /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Keuangan Asrama</h1>
              <p className="text-xs text-gray-500">Pemantauan realtime pemasukan, pengeluaran, dan saldo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <span className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full"><Shield size={16}/> Admin</span>
            ) : (
              <div className="flex items-center gap-2">
                <input value={adminToken} onChange={(e)=>setAdminToken(e.target.value)} placeholder="Masukkan token admin" className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring w-48"/>
                <button onClick={handleLogin} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"><LogIn size={16}/> Masuk</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={ArrowUpCircle} label="Total Pemasukan" value={stats.pemasukan} color="bg-emerald-500" />
          <StatCard icon={ArrowDownCircle} label="Total Pengeluaran" value={stats.pengeluaran} color="bg-rose-500" />
          <StatCard icon={Wallet} label="Saldo" value={stats.saldo} color="bg-indigo-600" />
        </section>

        {isAdmin && (
          <section className="bg-white/70 backdrop-blur border border-white/40 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Tambah Transaksi</h2>
            <form onSubmit={addTransaction} className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input type="date" className="border rounded-lg px-3 py-2 md:col-span-1" value={form.tanggal} onChange={(e)=>setForm({...form, tanggal:e.target.value})} required />
              <input type="text" placeholder="Penghuni (opsional)" className="border rounded-lg px-3 py-2 md:col-span-1" value={form.penghuni} onChange={(e)=>setForm({...form, penghuni:e.target.value})} />
              <input type="text" placeholder="Kamar (opsional)" className="border rounded-lg px-3 py-2 md:col-span-1" value={form.kamar} onChange={(e)=>setForm({...form, kamar:e.target.value})} />
              <input type="text" placeholder="Keterangan" className="border rounded-lg px-3 py-2 md:col-span-2" value={form.keterangan} onChange={(e)=>setForm({...form, keterangan:e.target.value})} required />
              <input type="number" step="1" min="0" placeholder="Jumlah (Rp)" className="border rounded-lg px-3 py-2 md:col-span-1" value={form.jumlah} onChange={(e)=>setForm({...form, jumlah:e.target.value})} required />
              <select className="border rounded-lg px-3 py-2 md:col-span-1" value={form.tipe} onChange={(e)=>setForm({...form, tipe:e.target.value})}>
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
              <button disabled={loading} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg md:col-span-1"><Plus size={18}/> Tambah</button>
            </form>
          </section>
        )}

        <section className="bg-white/70 backdrop-blur border border-white/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>
            <p className="text-sm text-gray-500">Realtime: data otomatis diperbarui setelah perubahan</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Penghuni</th>
                  <th className="py-2">Kamar</th>
                  <th className="py-2">Keterangan</th>
                  <th className="py-2 text-right">Jumlah</th>
                  <th className="py-2">Tipe</th>
                  {isAdmin && <th className="py-2">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => (
                  <tr key={tx.id} className="border-t border-gray-100 hover:bg-white">
                    <td className="py-2">{new Date(tx.tanggal || tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="py-2">{tx.penghuni || '-'}</td>
                    <td className="py-2">{tx.kamar || '-'}</td>
                    <td className="py-2">{tx.keterangan}</td>
                    <td className="py-2 text-right font-medium">{formatIDR(tx.jumlah)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${tx.tipe === 'pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{tx.tipe}</span>
                    </td>
                    {isAdmin && (
                      <td className="py-2">
                        <button onClick={()=>deleteTx(tx.id)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"><Trash2 size={16}/> Hapus</button>
                      </td>
                    )}
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-gray-500" colSpan={isAdmin ? 7 : 6}>Belum ada transaksi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">© {new Date().getFullYear()} Keuangan Asrama • Dibuat dengan cinta</footer>
    </div>
  )
}
