// pages/dashboard/evenements/[id]/produits.js
// Gestion des produits de la buvette

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import safeLog from '../../../../lib/logger'

export default function EventProducts() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [event, setEvent] = useState(null)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    is_active: true
  })

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Charger événement
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (eventError || !eventData) {
        setError('Événement non trouvé')
        setLoading(false)
        return
      }

      if (!eventData.buvette_active) {
        setError('La buvette n\'est pas activée pour cet événement')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Charger produits
      const { data: productsData, error: productsError } = await supabase
        .from('event_products')
        .select('*')
        .eq('event_id', id)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (productsError) {
        safeLog.error('Error loading products:', productsError)
      } else {
        setProducts(productsData || [])
      }

      setLoading(false)
    } catch (err) {
      safeLog.error('Error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      is_active: true
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || '',
      stock: product.stock !== null ? product.stock : '',
      is_active: product.is_active
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category || null,
        stock: formData.stock ? parseInt(formData.stock) : null,
        is_active: formData.is_active
      }

      if (editingProduct) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from('event_products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (updateError) {
          if (updateError.message.includes('événement publié')) {
            setError('❌ Impossible de modifier : l\'événement est publié. Repassez-le en brouillon d\'abord.')
          } else {
            setError(updateError.message)
          }
          setSaving(false)
          return
        }

        setSuccess('✅ Produit mis à jour')
      } else {
        // Création
        const { error: insertError } = await supabase
          .from('event_products')
          .insert({
            ...productData,
            event_id: id
          })

        if (insertError) {
          if (insertError.message.includes('événement publié')) {
            setError('❌ Impossible d\'ajouter : l\'événement est publié. Repassez-le en brouillon d\'abord.')
          } else {
            setError(insertError.message)
          }
          setSaving(false)
          return
        }

        setSuccess('✅ Produit ajouté')
      }

      resetForm()
      await loadData()
      setSaving(false)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('event_products')
        .delete()
        .eq('id', productId)

      if (deleteError) {
        if (deleteError.message.includes('événement publié')) {
          setError('❌ Impossible de supprimer : l\'événement est publié. Repassez-le en brouillon d\'abord.')
        } else {
          setError(deleteError.message)
        }
        return
      }

      setSuccess('✅ Produit supprimé')
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        Chargement...
      </div>
    )
  }

  if (!event) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <p style={{ color: 'red' }}>{error || 'Événement non trouvé'}</p>
        <Link href="/dashboard/evenements" style={{ color: '#4CAF50' }}>
          ← Retour aux événements
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href={`/dashboard/evenements/${id}/edit`} style={{ color: '#4CAF50' }}>
          ← Retour à l'événement
        </Link>
        <h1 style={{ marginTop: '20px' }}>🍺 Gestion de la buvette</h1>
        <p style={{ color: '#666' }}>{event.name}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <span style={{
            padding: '6px 12px',
            backgroundColor: event.status === 'published' ? '#4CAF50' : '#999',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {event.status === 'draft' ? '📝 Brouillon' : 
             event.status === 'published' ? '✅ Publié' : event.status}
          </span>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      {event.status === 'published' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ffc107'
        }}>
          ⚠️ <strong>Événement publié :</strong> Les produits sont figés. 
          Pour modifier, <Link href={`/dashboard/evenements/${id}/edit`} style={{ color: '#856404', textDecoration: 'underline' }}>
            repassez l'événement en brouillon
          </Link>.
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={event.status === 'published'}
            style={{
              padding: '12px 24px',
              backgroundColor: event.status === 'published' ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: event.status === 'published' ? 'not-allowed' : 'pointer'
            }}
          >
            ➕ Ajouter un produit
          </button>
        ) : (
          <button
            onClick={resetForm}
            style={{
              padding: '12px 24px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✖ Annuler
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0 }}>
            {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Eau minérale"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Prix (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="Ex: 2.50"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Catégorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Boisson, Nourriture"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Stock (optionnel)
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="Ex: 50"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ marginRight: '10px', width: '18px', height: '18px' }}
              />
              <span>Produit actif (visible sur la buvette)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {saving ? 'Enregistrement...' : (editingProduct ? '💾 Mettre à jour' : '➕ Ajouter')}
          </button>

          {editingProduct && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: '12px 24px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
          )}
        </form>
      )}

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
          <h3 style={{ margin: 0 }}>
            Produits ({products.length})
          </h3>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            Aucun produit. Cliquez sur "Ajouter un produit" pour commencer.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Produit</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Catégorie</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Prix</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Statut</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{product.name}</td>
                  <td style={{ padding: '12px', color: '#666' }}>{product.category || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                    {product.price ? product.price.toFixed(2) : '0.00'} €
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                    {product.stock !== null ? product.stock : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: product.is_active ? '#d4edda' : '#f8d7da',
                      color: product.is_active ? '#155724' : '#721c24',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {product.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(product)}
                      disabled={event.status === 'published'}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: event.status === 'published' ? '#ccc' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: event.status === 'published' ? 'not-allowed' : 'pointer',
                        marginRight: '5px'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={event.status === 'published'}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: event.status === 'published' ? '#ccc' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: event.status === 'published' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
