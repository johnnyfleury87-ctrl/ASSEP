// pages/dashboard/bureau.js
// Gestion du bureau (JETC Solution - présidents uniquement)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function BureauManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])

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

    if (!profileData || !['president', 'vice_president'].includes(profileData.role)) {
      router.push('/dashboard')
      return
    }

    const { data: bureauData } = await supabase
      .from('bureau_members')
      .select('*')
      .order('sort_order', { ascending: true })

    setMembers(bureauData || [])
    setLoading(false)
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
        <h1 style={{ marginTop: '20px' }}>Gestion du Bureau</h1>
        <p style={{ color: '#666' }}>
          Configuration des membres du bureau affichés sur le site public + gestion des rôles utilisateurs
        </p>
      </header>

      <section style={{ marginBottom: '60px' }}>
        <h2>Carte "Le Bureau"</h2>
        <p style={{ marginBottom: '20px' }}>
          Gérer l'affichage des membres du bureau sur la page d'accueil.
        </p>

        <div style={{ 
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffc107'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            ⚠️ <strong>Fonctionnalité à implémenter :</strong> Interface CRUD pour gérer les membres du bureau.
            Utilisez l'API <code>/api/admin/bureau</code> (GET, POST, PUT, DELETE).
          </p>
        </div>

        {members.length === 0 ? (
          <p>Aucun membre du bureau configuré.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {members.map(member => (
              <div key={member.id} style={{ 
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                textAlign: 'center'
              }}>
                {member.photo_url && (
                  <img 
                    src={member.photo_url} 
                    alt={member.name || member.title}
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      marginBottom: '10px'
                    }}
                  />
                )}
                <h4 style={{ margin: '5px 0' }}>{member.title}</h4>
                {member.name && <p style={{ margin: '5px 0', color: '#666' }}>{member.name}</p>}
                <p style={{ 
                  fontSize: '12px',
                  color: member.is_visible ? '#4CAF50' : '#999',
                  marginTop: '10px'
                }}>
                  {member.is_visible ? '✓ Visible' : '✗ Masqué'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Gestion des rôles utilisateurs</h2>
        <p style={{ marginBottom: '20px' }}>
          Modifier les rôles des membres inscrits (accès JETC Solution).
        </p>

        <div style={{ 
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffc107'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            ⚠️ <strong>Fonctionnalité à implémenter :</strong> Interface pour lister les profils et modifier leur rôle.
            Utilisez l'API <code>/api/admin/roles</code> (PUT).
          </p>
        </div>
      </section>
    </div>
  )
}
