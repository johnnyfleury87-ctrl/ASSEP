// pages/dashboard/tresorerie.js
// Gestion trésorerie globale (liste entrées/sorties + solde)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Tresorerie() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileData || !['tresorier', 'vice_tresorier', 'president', 'vice_president'].includes(profileData.role)) {
      router.push('/dashboard')
      return
    }

    const { data: ledgerData } = await supabase
      .from('ledger_entries')
      .select('*, events(title)')
      .order('entry_date', { ascending: false })

    if (ledgerData) {
      setEntries(ledgerData)
      
      let total = 0
      ledgerData.forEach(entry => {
        if (entry.type === 'income') {
          total += entry.amount_cents
        } else {
          total -= entry.amount_cents
        }
      })
      setBalance(total / 100)
    }

    setLoading(false)
  }

  const exportCSV = () => {
    if (entries.length === 0) return

    const headers = ['Date', 'Type', 'Libellé', 'Montant (€)', 'Événement']
    const rows = entries.map(e => [
      new Date(e.entry_date).toLocaleDateString('fr-FR'),
      e.type === 'income' ? 'Recette' : 'Dépense',
      e.label,
      (e.amount_cents / 100).toFixed(2),
      e.events?.title || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tresorerie-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard">
          <a style={{ color: '#4CAF50' }}>← Retour au dashboard</a>
        </Link>
        <h1 style={{ marginTop: '20px' }}>Trésorerie</h1>
      </header>

      <div style={{ 
        padding: '30px',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Solde actuel</p>
        <p style={{ fontSize: '48px', fontWeight: 'bold', color: balance >= 0 ? '#4CAF50' : '#f44336', margin: 0 }}>
          {balance.toFixed(2)} €
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={exportCSV}
          disabled={entries.length === 0}
          style={{ 
            padding: '10px 20px',
            backgroundColor: entries.length === 0 ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: entries.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          📥 Exporter en CSV
        </button>
      </div>

      <h2>Historique des opérations</h2>

      {entries.length === 0 ? (
        <p>Aucune opération enregistrée.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Libellé</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Événement</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    {new Date(entry.entry_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: entry.type === 'income' ? '#4CAF50' : '#f44336',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {entry.type === 'income' ? 'Recette' : 'Dépense'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{entry.label}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                    {entry.events?.title || '-'}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: entry.type === 'income' ? '#4CAF50' : '#f44336'
                  }}>
                    {entry.type === 'income' ? '+' : '-'}
                    {(entry.amount_cents / 100).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
