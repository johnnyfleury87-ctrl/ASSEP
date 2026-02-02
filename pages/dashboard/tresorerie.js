// pages/dashboard/tresorerie.js
// Gestion trésorerie globale (liste entrées/sorties + solde)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../components/Button'
import TransactionForm from '../../components/TransactionForm'
import safeLog from '../../lib/logger'
import { getTreasuryBalance } from '../../lib/treasuryBalance'

export default function Tresorerie() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(0)
  const [startingBalance, setStartingBalance] = useState(0)
  const [startingBalanceDate, setStartingBalanceDate] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [showStartingBalanceModal, setShowStartingBalanceModal] = useState(false)
  const [tempStartingBalance, setTempStartingBalance] = useState('')
  const [tempStartingBalanceDate, setTempStartingBalanceDate] = useState('')
  const [userRole, setUserRole] = useState(null)

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

    setUserRole(profileData.role)
    await loadAllData()
  }

  const loadAllData = async () => {
    // Charger transactions et solde en parallèle
    await Promise.all([
      loadTransactions(),
      loadBalanceFromAPI()
    ])
  }

  const loadBalanceFromAPI = async () => {
    try {
      const balanceData = await getTreasuryBalance()
      setStartingBalance(balanceData.startingBalance)
      setStartingBalanceDate(balanceData.startingBalanceDate)
      setBalance(balanceData.transactionsTotal)
    } catch (err) {
      safeLog.error('❌ Load balance error:', err)
    }
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
    } catch (err) {
      safeLog.error('❌ Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }



  const handleUpdateStartingBalance = async () => {
    setError(null)
    setMessage(null)

    const newBalance = parseFloat(tempStartingBalance)
    if (isNaN(newBalance)) {
      setError('Veuillez saisir un montant valide')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/finance/starting-balance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          starting_balance: newBalance,
          starting_balance_date: tempStartingBalanceDate || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      setMessage('Solde de départ mis à jour avec succès !')
      setShowStartingBalanceModal(false)
      setTempStartingBalance('')
      setTempStartingBalanceDate('')
      await loadBalanceFromAPI()
    } catch (err) {
      safeLog.error('❌ handleUpdateStartingBalance error:', err)
      setError(err.message || 'Erreur lors de la mise à jour du solde de départ')
    }
  }

  const openStartingBalanceModal = () => {
    setTempStartingBalance(startingBalance.toString())
    setTempStartingBalanceDate(startingBalanceDate || '')
    setShowStartingBalanceModal(true)
    setError(null)
    setMessage(null)
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

      // Vérifier le content-type avant de parser le JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        safeLog.error('Réponse non-JSON reçue:', response.status, contentType)
        throw new Error('Erreur serveur : réponse invalide')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      setMessage('Transaction créée avec succès !')
      setShowForm(false)
      await loadAllData() // Recharger tout pour cohérence
    } catch (err) {
      safeLog.error('❌ handleCreate error:', err)
      setError(err.message || 'Erreur lors de la création')
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
await loadAllData() // Recharger tout pour cohérence
      // Vérifier le content-type avant de parser le JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        safeLog.error('Réponse non-JSON reçue:', response.status, contentType)
        throw new Error('Erreur serveur : réponse invalide')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      setMessage('Transaction modifiée avec succès !')
      setShowForm(false)
      setEditingTransaction(null)
      await loadAllData() // Recharger tout pour cohérence
    } catch (err) {
      safeLog.error('❌ handleUpdate error:', err)
      setError(err.message || 'Erreur lors de la modification')
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

      // Vérifier le content-type avant de parser le JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        safeLog.error('Réponse non-JSON reçue:', response.status, contentType)
        throw new Error('Erreur serveur : réponse invalide')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setMessage('Transaction supprimée avec succès !')
      await loadAllData() // Recharger tout pour cohérence
    } catch (err) {
      safeLog.error('❌ handleDelete error:', err)
      setError(err.message || 'Erreur lors de la suppression')
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

  // Calculer le solde total : solde de départ + somme des transactions
  const totalBalance = startingBalance + balance

  // Vérifier si l'utilisateur peut gérer le solde de départ
  const canManageStartingBalance = ['tresorier', 'vice_tresorier', 'president', 'vice_president'].includes(userRole)

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
      {!showForm && !showStartingBalanceModal && (
        <>
          <div style={{ 
            padding: '30px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Solde actuel</p>
            <p style={{ fontSize: '48px', fontWeight: 'bold', color: totalBalance >= 0 ? '#4CAF50' : '#f44336', margin: 0 }}>
              {totalBalance.toFixed(2)} €
            </p>
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              <p style={{ margin: '5px 0' }}>
                Solde de départ : <strong>{startingBalance.toFixed(2)} €</strong>
                {startingBalanceDate && (
                  <span style={{ marginLeft: '10px', fontSize: '12px' }}>
                    (au {new Date(startingBalanceDate).toLocaleDateString('fr-FR')})
                  </span>
                )}
              </p>
              <p style={{ margin: '5px 0' }}>
                Total des transactions : <strong>{balance.toFixed(2)} €</strong>
              </p>
            </div>
          </div>

          {canManageStartingBalance && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button
                onClick={openStartingBalanceModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✏️ Définir solde de départ
              </button>
            </div>
          )}

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

      {/* Modal Solde de départ */}
      {showStartingBalanceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Définir le solde de départ</h2>
            
            <p style={{ color: '#666', fontSize: '14px' }}>
              Le solde actuel sera calculé comme : <strong>Solde de départ + Total des transactions</strong>
            </p>

            {error && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '15px',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Montant du solde de départ (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={tempStartingBalance}
                onChange={(e) => setTempStartingBalance(e.target.value)}
                placeholder="Ex: 10000.00"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Date du solde de départ (optionnel)
              </label>
              <input
                type="date"
                value={tempStartingBalanceDate}
                onChange={(e) => setTempStartingBalanceDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowStartingBalanceModal(false)
                  setError(null)
                  setTempStartingBalance('')
                  setTempStartingBalanceDate('')
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateStartingBalance}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
