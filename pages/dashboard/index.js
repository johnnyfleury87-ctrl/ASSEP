// pages/dashboard/index.js
// Dashboard principal - redirige selon le rôle

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import safeLog from '../../lib/logger'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    totalVolunteers: 0,
    balance: 0
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profileData) {
      router.push('/login')
      return
    }

    setProfile(profileData)
    await loadStats()
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      // Compter les événements à venir
      const { count: eventsCount } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString())

      // Compter les bénévoles inscrits
      const { count: volunteersCount } = await supabase
        .from('signups')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')

      // Récupérer le solde de trésorerie depuis l'API centralisée
      let balance = 0
      try {
        const balanceResponse = await fetch('/api/treasury/balance')
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          balance = balanceData.currentBalance || 0
        }
      } catch (balanceError) {
        safeLog.error('Error loading treasury balance:', balanceError)
        // En cas d'erreur, balance reste à 0
      }

      setStats({
        upcomingEvents: eventsCount || 0,
        totalVolunteers: volunteersCount || 0,
        balance: balance
      })
    } catch (error) {
      safeLog.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  const canManageEvents = ['secretaire', 'vice_secretaire', 'president', 'vice_president'].includes(profile.role)
  const canManageFinance = ['tresorier', 'vice_tresorier', 'president', 'vice_president'].includes(profile.role)
  const isAdmin = ['president', 'vice_president'].includes(profile.role)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '40px',
        paddingBottom: '20px',
        borderBottom: '1px solid #ddd'
      }}>
        <div>
          <h1>Dashboard ASSEP</h1>
          <p>Bienvenue, {profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.email}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Rôle : <strong>{profile.role.replace('_', ' ')}</strong>
          </p>
        </div>
        <div>
          <Link href="/" style={{ marginRight: '20px', color: '#4CAF50' }}>
            Voir le site public
          </Link>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Statistiques */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ 
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #90caf9'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Événements à venir</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{stats.upcomingEvents}</p>
          </div>

          <div style={{ 
            padding: '20px',
            backgroundColor: '#f3e5f5',
            borderRadius: '8px',
            border: '1px solid #ce93d8'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Bénévoles inscrits</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{stats.totalVolunteers}</p>
          </div>

          {canManageFinance && (
            <div style={{ 
              padding: '20px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              border: '1px solid #81c784'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Solde trésorerie</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                {stats.balance.toFixed(2)} €
              </p>
              <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                Solde de départ inclus
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Navigation */}
      <section>
        <h2>Accès rapide</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {canManageEvents && (
            <>
              <Link href="/dashboard/evenements" style={{ 
                padding: '20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                📅 Gérer les événements
              </Link>
            </>
          )}

          {canManageFinance && (
            <>
              <Link href="/dashboard/tresorerie" style={{ 
                padding: '20px',
                backgroundColor: '#2196F3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                💰 Trésorerie
              </Link>
            </>
          )}

          {(isAdmin || ['secretaire', 'vice_secretaire'].includes(profile.role)) && (
            <Link href="/dashboard/communications" style={{ 
              padding: '20px',
              backgroundColor: '#FF9800',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              ✉️ Communications
            </Link>
          )}

          {isAdmin && (
            <>
              <Link href="/dashboard/bureau" style={{ 
                padding: '20px',
                backgroundColor: '#9C27B0',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                👥 Gestion Bureau
              </Link>
              
              {profile.is_jetc_admin && (
                <Link href="/dashboard/jetc/users" style={{ 
                  padding: '20px',
                  backgroundColor: '#673AB7',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  🔧 Gestion Utilisateurs (JETC)
                </Link>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
