// components/BureauMemberForm.js
// Formulaire de création/édition d'un membre du bureau

import { useState, useEffect } from 'react'
import Button from './Button'

export default function BureauMemberForm({ member, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    bio: '',
    photo_url: '',
    email: '',
    phone: '',
    display_order: 0,
    is_active: true
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (member) {
      setFormData({
        role: member.role || '',
        name: member.name || '',
        bio: member.bio || '',
        photo_url: member.photo_url || '',
        email: member.email || '',
        phone: member.phone || '',
        display_order: member.display_order || 0,
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
    
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis'
    }
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
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
          role: '',
          name: '',
          bio: '',
          photo_url: '',
          email: '',
          phone: '',
          display_order: 0,
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

      {/* Rôle */}
      <div style={styles.field}>
        <label htmlFor="role" style={styles.label}>
          Rôle <span style={styles.required}>*</span>
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={errors.role ? { ...styles.input, ...styles.inputError } : styles.input}
          disabled={loading}
        >
          <option value="">-- Sélectionner un rôle --</option>
          <option value="president">Président</option>
          <option value="vice_president">Vice-Président</option>
          <option value="tresorier">Trésorier</option>
          <option value="vice_tresorier">Vice-Trésorier</option>
          <option value="secretaire">Secrétaire</option>
          <option value="vice_secretaire">Vice-Secrétaire</option>
        </select>
        {errors.role && <span style={styles.error}>{errors.role}</span>}
      </div>

      {/* Nom */}
      <div style={styles.field}>
        <label htmlFor="name" style={styles.label}>
          Nom complet <span style={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Jean Dupont"
          style={errors.name ? { ...styles.input, ...styles.inputError } : styles.input}
          disabled={loading}
        />
        {errors.name && <span style={styles.error}>{errors.name}</span>}
      </div>

      {/* Bio */}
      <div style={styles.field}>
        <label htmlFor="bio" style={styles.label}>
          Biographie (optionnel)
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Courte présentation..."
          rows="4"
          style={styles.input}
          disabled={loading}
        />
        <small style={styles.hint}>
          Texte affiché sous le nom sur le site public
        </small>
      </div>

      {/* Email */}
      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>
          Email (optionnel)
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com"
          style={styles.input}
          disabled={loading}
        />
        <small style={styles.hint}>
          Email de contact public
        </small>
      </div>

      {/* Téléphone */}
      <div style={styles.field}>
        <label htmlFor="phone" style={styles.label}>
          Téléphone (optionnel)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+33 6 12 34 56 78"
          style={styles.input}
          disabled={loading}
        />
        <small style={styles.hint}>
          Téléphone de contact public
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
