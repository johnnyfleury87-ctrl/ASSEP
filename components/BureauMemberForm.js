// components/BureauMemberForm.js
// Formulaire de création/édition d'un membre du bureau

import { useState, useEffect } from 'react'
import Button from './Button'

export default function BureauMemberForm({ member, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    photo_url: '',
    display_order: 100,
    is_active: true
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (member) {
      setFormData({
        title: member.title || '',
        name: member.name || '',
        photo_url: member.photo_url || '',
        display_order: member.display_order || 100,
        is_active: member.is_active !== false
      })
    }
  }, [member])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis'
    }
    
    if (formData.display_order < 0) {
      newErrors.display_order = "L'ordre doit être >= 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      // Réinitialiser le formulaire après création (mais pas en édition)
      if (!member) {
        setFormData({
          title: '',
          name: '',
          photo_url: '',
          display_order: 100,
          is_active: true
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.title}>
        {member ? 'Modifier le membre du bureau' : 'Ajouter un membre du bureau'}
      </h3>

      {/* Titre (fonction) */}
      <div style={styles.field}>
        <label htmlFor="title" style={styles.label}>
          Titre / Fonction <span style={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ex: Président, Trésorière, Secrétaire..."
          style={errors.title ? { ...styles.input, ...styles.inputError } : styles.input}
          disabled={loading}
        />
        {errors.title && <span style={styles.error}>{errors.title}</span>}
      </div>

      {/* Nom */}
      <div style={styles.field}>
        <label htmlFor="name" style={styles.label}>
          Nom complet (optionnel)
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Jean Dupont"
          style={styles.input}
          disabled={loading}
        />
        <small style={styles.hint}>
          Si vide, seul le titre sera affiché sur le site public
        </small>
      </div>

      {/* Photo URL */}
      <div style={styles.field}>
        <label htmlFor="photo_url" style={styles.label}>
          URL de la photo (optionnel)
        </label>
        <input
          type="text"
          id="photo_url"
          name="photo_url"
          value={formData.photo_url}
          onChange={handleChange}
          placeholder="https://example.com/photo.jpg"
          style={styles.input}
          disabled={loading}
        />
        <small style={styles.hint}>
          URL publique de la photo (ou laisser vide)
        </small>
      </div>

      {/* Ordre d'affichage */}
      <div style={styles.field}>
        <label htmlFor="display_order" style={styles.label}>
          Ordre d&apos;affichage
        </label>
        <input
          type="number"
          id="display_order"
          name="display_order"
          value={formData.display_order}
          onChange={handleChange}
          min="0"
          style={errors.display_order ? { ...styles.input, ...styles.inputError } : styles.input}
          disabled={loading}
        />
        {errors.display_order && <span style={styles.error}>{errors.display_order}</span>}
        <small style={styles.hint}>
          Plus le nombre est petit, plus le membre apparaît en premier
        </small>
      </div>

      {/* Visible */}
      <div style={styles.field}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={loading}
            style={styles.checkbox}
          />
          Visible sur le site public
        </label>
      </div>

      {/* Boutons */}
      <div style={styles.actions}>
        <Button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={styles.cancelButton}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : (member ? 'Mettre à jour' : 'Ajouter')}
        </Button>
      </div>
    </form>
  )
}

const styles = {
  form: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px'
  },
  title: {
    marginTop: 0,
    marginBottom: '24px',
    color: '#333'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
  },
  required: {
    color: '#e74c3c'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  inputError: {
    borderColor: '#e74c3c'
  },
  hint: {
    display: 'block',
    marginTop: '4px',
    fontSize: '13px',
    color: '#666'
  },
  error: {
    display: 'block',
    marginTop: '4px',
    fontSize: '13px',
    color: '#e74c3c'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#333'
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    borderColor: '#95a5a6'
  }
}
