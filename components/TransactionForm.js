// components/TransactionForm.js
// Formulaire de création/édition de transaction financière

import { useState, useEffect } from 'react'
import Button from './Button'

export default function TransactionForm({ transaction, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    event_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type || 'expense',
        category: transaction.category || '',
        amount: transaction.amount ? transaction.amount.toString() : '',
        description: transaction.description || '',
        transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
        event_id: transaction.event_id || ''
      })
    }
  }, [transaction])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.type) {
      setError('Le type est requis.')
      return false
    }

    if (!formData.category || formData.category.trim() === '') {
      setError('La catégorie est requise.')
      return false
    }

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Le montant doit être un nombre positif.')
      return false
    }

    if (!formData.description || formData.description.trim() === '') {
      setError('La description est requise.')
      return false
    }

    if (!formData.transaction_date) {
      setError('La date est requise.')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        ...(transaction?.id && { id: transaction.id }),
        type: formData.type,
        category: formData.category.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        transaction_date: formData.transaction_date,
        event_id: formData.event_id || null
      })
    } catch (err) {
      setError(err.message || 'Erreur lors de la soumission du formulaire.')
      setLoading(false)
    }
  }

  // Catégories prédéfinies
  const incomeCategories = [
    'Adhésion',
    'Subvention',
    'Don',
    'Vente',
    'Événement',
    'Autre'
  ]

  const expenseCategories = [
    'Matériel',
    'Communication',
    'Événement',
    'Administratif',
    'Assurance',
    'Location',
    'Autre'
  ]

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '2rem auto'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>
        {transaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c00',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Type */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            Type <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          >
            <option value="income">Recette</option>
            <option value="expense">Dépense</option>
          </select>
        </div>

        {/* Catégorie */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            Catégorie <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">-- Sélectionner --</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            Montant (€) <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            disabled={loading}
            required
            min="0.01"
            step="0.01"
            placeholder="ex: 150.00"
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            Description <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            required
            rows={3}
            placeholder="Décrivez la transaction..."
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Date */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            Date <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* ID Événement (optionnel) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            ID Événement (optionnel)
          </label>
          <input
            type="text"
            name="event_id"
            value={formData.event_id}
            onChange={handleChange}
            disabled={loading}
            placeholder="UUID de l'événement lié"
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            Laissez vide si la transaction n&apos;est pas liée à un événement spécifique.
          </small>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            type="button"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'En cours...' : (transaction ? 'Mettre à jour' : 'Créer')}
          </Button>
        </div>
      </form>
    </div>
  )
}
