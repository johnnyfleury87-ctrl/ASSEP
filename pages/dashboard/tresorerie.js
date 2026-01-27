// pages/dashboard/tresorerie.js
// Gestion trésorerie globale (liste entrées/sorties + solde)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../components/Button'
import TransactionForm from '../../components/TransactionForm'
import safeLog from '../../lib/logger'

export default function Tresorerie() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
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

    loadTransactions()
  }

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/finance/transactions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `Erreur ${response.status}`
        safeLog.error('API error:', errorMsg, errorData)
        throw new Error(errorMsg)
      }

      const data = await response.json()
      safeLog.debug('✅ Transactions chargées:', data)
      setTransactions(data.transactions || [])
      setBalance(data.balance || 0)
    } catch (err) {
      safeLog.error('❌ Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (formData) => {
    setError(null)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      setMessage('Transaction créée avec succès !')
      setShowForm(false)
      loadTransactions()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const handleUpdate = async (formData) => {
    setError(null)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/finance/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la modification')
      }

      setMessage('Transaction modifiée avec succès !')
      setShowForm(false)
      setEditingTransaction(null)
      loadTransactions()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const handleDelete = async (transactionId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/finance/transactions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: transactionId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      setMessage('Transaction supprimée avec succès !')
      loadTransactions()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
    setMessage(null)
    setError(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
    setError(null)
  }

  const exportCSV = () => {
    if (transactions.length === 0) return

    const headers = ['Date', 'Type', 'Catégorie', 'Description', 'Montant (€)', 'Événement']
    const rows = transactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString('fr-FR'),
      t.type === 'income' ? 'Recette' : 'Dépense',
      t.category,
      t.description,
      t.amount.toFixed(2),
      t.events?.name || ''
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
        <Link href="/dashboard" style={{ color: '#4CAF50' }}>
          ← Retour au dashboard
        </Link>
        <h1 style={{ marginTop: '20px' }}>Trésorerie</h1>
      </header>

      {/* Messages */}
      {message && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={editingTransaction ? handleUpdate : handleCreate}
          onCancel={handleCancelForm}
        />
      )}

      {/* Solde */}
      {!showForm && (
        <>
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

          {/* Actions */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <Button onClick={() => setShowForm(true)}>
              ➕ Nouvelle transaction
            </Button>
            <button 
              onClick={exportCSV}
              disabled={transactions.length === 0}
              style={{ 
                padding: '10px 20px',
                backgroundColor: transactions.length === 0 ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: transactions.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              📥 Exporter en CSV
            </button>
          </div>

          {/* Liste des transactions */}
          <h2>Historique des transactions</h2>

          {transactions.length === 0 ? (
            <p>Aucune transaction enregistrée.</p>
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
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Catégorie</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Événement</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Montant</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(transaction.transaction_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px',
                          backgroundColor: transaction.type === 'income' ? '#4CAF50' : '#f44336',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {transaction.type === 'income' ? 'Recette' : 'Dépense'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{transaction.category}</td>
                      <td style={{ padding: '12px' }}>{transaction.description}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                        {transaction.events?.name || '-'}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: transaction.type === 'income' ? '#4CAF50' : '#f44336'
                      }}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toFixed(2)} €
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(transaction)}
                          style={{
                            padding: '4px 8px',
                            marginRight: '4px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
