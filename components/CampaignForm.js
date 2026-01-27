// components/CampaignForm.js
// Formulaire de création/édition d'une campagne email

import { useState, useEffect } from 'react'
import Button from './Button'

export default function CampaignForm({ campaign, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    recipient_type: 'all',
    recipient_emails: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        subject: campaign.subject || '',
        content: campaign.content || '',
        recipient_type: campaign.recipient_type || 'all',
        recipient_emails: campaign.recipient_emails ? campaign.recipient_emails.join('\n') : ''
      })
    }
  }, [campaign])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la campagne est requis'
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est requis'
    }

    if (formData.recipient_type === 'custom' && !formData.recipient_emails.trim()) {
      newErrors.recipient_emails = 'Liste d\'emails requise pour le type "personnalisé"'
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
      // Préparer les données
      const submitData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        recipient_type: formData.recipient_type
      }

      // Si custom, parser les emails (un par ligne)
      if (formData.recipient_type === 'custom') {
        submitData.recipient_emails = formData.recipient_emails
          .split('\n')
          .map(email => email.trim())
          .filter(email => email.length > 0)
      }

      await onSubmit(submitData)
      
      // Réinitialiser le formulaire après création (mais pas en édition)
      if (!campaign) {
        setFormData({
          name: '',
          subject: '',
          content: '',
          recipient_type: 'all',
          recipient_emails: ''
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
        {campaign ? 'Modifier la campagne' : 'Nouvelle campagne email'}
      </h3>

      {/* Nom de la campagne */}
      <div style={styles.field}>
        <label htmlFor="name" style={styles.label}>
          Nom de la campagne <span style={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Infolettre Janvier 2026"
          style={errors.name ? { ...styles.input, ...styles.inputError } : styles.input}
          disabled={loading}
        />
        {errors.name && <span style={styles.error}>{errors.name}</span>}
        <small style={styles.hint}>Usage interne (non visible par les destinataires)</small>
      </div>

      {/* Sujet de l'email */}
      <div style={styles.field}>
        <label htmlFor="subject" style={styles.label}>
          Sujet de l&apos;email <span style={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Prochains événements ASSEP"
          style={errors.subject ? { ...styles.input, ...styles.inputError } : styles.input}
          disabled={loading}
        />
        {errors.subject && <span style={styles.error}>{errors.subject}</span>}
        <small style={styles.hint}>
          {formData.subject.length} caractères (recommandé : 40-60)
        </small>
      </div>

      {/* Contenu de l'email */}
      <div style={styles.field}>
        <label htmlFor="content" style={styles.label}>
          Contenu de l&apos;email <span style={styles.required}>*</span>
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="<p>Bonjour,</p><p>Voici les prochains événements...</p>"
          rows={10}
          style={errors.content ? { ...styles.textarea, ...styles.inputError } : styles.textarea}
          disabled={loading}
        />
        {errors.content && <span style={styles.error}>{errors.content}</span>}
        <small style={styles.hint}>Accepte le HTML (balises p, strong, em, ul, li, a, etc.)</small>
      </div>

      {/* Type de destinataires */}
      <div style={styles.field}>
        <label htmlFor="recipient_type" style={styles.label}>
          Destinataires
        </label>
        <select
          id="recipient_type"
          name="recipient_type"
          value={formData.recipient_type}
          onChange={handleChange}
          style={styles.input}
          disabled={loading}
        >
          <option value="all">Tous (membres + bénévoles opt-in)</option>
          <option value="members">Membres seulement</option>
          <option value="custom">Liste personnalisée</option>
        </select>
        <small style={styles.hint}>
          Seuls les contacts ayant accepté les communications (opt-in RGPD) recevront l&apos;email
        </small>
      </div>

      {/* Liste d'emails personnalisée (si custom) */}
      {formData.recipient_type === 'custom' && (
        <div style={styles.field}>
          <label htmlFor="recipient_emails" style={styles.label}>
            Liste d&apos;emails <span style={styles.required}>*</span>
          </label>
          <textarea
            id="recipient_emails"
            name="recipient_emails"
            value={formData.recipient_emails}
            onChange={handleChange}
            placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
            rows={5}
            style={errors.recipient_emails ? { ...styles.textarea, ...styles.inputError } : styles.textarea}
            disabled={loading}
          />
          {errors.recipient_emails && <span style={styles.error}>{errors.recipient_emails}</span>}
          <small style={styles.hint}>Un email par ligne</small>
        </div>
      )}

      {/* RGPD Warning */}
      <div style={styles.warning}>
        <strong>⚠️ Conformité RGPD :</strong> Seuls les contacts ayant explicitement accepté 
        de recevoir les communications ASSEP (opt-in) recevront cet email.
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
          {loading ? 'Enregistrement...' : (campaign ? 'Mettre à jour' : 'Créer le brouillon')}
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
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical'
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
  warning: {
    padding: '12px 16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#856404',
    marginBottom: '20px'
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
