/**
 * Page: Gestion des utilisateurs JETC
 * /dashboard/jetc/users
 * 
 * Accessible uniquement aux JETC admin
 * Fonctionnalités:
 * - Créer des utilisateurs (auto-confirm, password temporaire)
 * - Lister tous les utilisateurs
 * - Modifier les rôles
 * - Réinitialiser les mots de passe
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';

export default function JetcUsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'membre'
  });

  const ROLES = [
    { value: 'president', label: 'Président' },
    { value: 'vice_president', label: 'Vice-Président' },
    { value: 'tresorier', label: 'Trésorier' },
    { value: 'vice_tresorier', label: 'Vice-Trésorier' },
    { value: 'secretaire', label: 'Secrétaire' },
    { value: 'vice_secretaire', label: 'Vice-Secrétaire' },
    { value: 'membre', label: 'Membre' }
  ];

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Vérifier le rôle JETC admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_jetc_admin, role')
        .eq('id', session.user.id)
        .single();

      if (!profile || (!profile.is_jetc_admin && !['president', 'vice_president'].includes(profile.role))) {
        router.push('/dashboard');
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur chargement users');
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur création utilisateur');
      }

      setMessage(`✅ Utilisateur créé: ${data.user.email} - Mot de passe temporaire: ASSEP1234!`);
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'membre'
      });

      // Recharger la liste
      await loadUsers();

    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!confirm('Réinitialiser le mot de passe à ASSEP1234! ?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur réinitialisation');
      }

      alert('✅ Mot de passe réinitialisé à ASSEP1234!');
      await loadUsers();

    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ ' + err.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { data, error } = await supabase.rpc('change_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        throw error;
      }

      alert('✅ Rôle mis à jour');
      await loadUsers();

    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ ' + err.message);
    }
  };

  const handleForceMustChangePassword = async (userId) => {
    try {
      const { data, error } = await supabase.rpc('set_must_change_password', {
        target_user_id: userId,
        flag: true
      });

      if (error) {
        throw error;
      }

      alert('✅ L\'utilisateur devra changer son mot de passe à la prochaine connexion');
      await loadUsers();

    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur suppression');
      }

      alert('✅ Utilisateur supprimé');
      await loadUsers();

    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ ' + err.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des utilisateurs (JETC)
          </h1>
          <p className="text-gray-600">
            Créer et gérer les comptes des membres du bureau
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        {/* Formulaire de création */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Créer un nouvel utilisateur</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                Mot de passe temporaire: <strong>ASSEP1234!</strong>
              </p>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {creating ? 'Création...' : 'Créer l\'utilisateur'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Utilisateurs ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {user.is_jetc_admin && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                            JETC Admin
                          </span>
                        )}
                        {user.must_change_password && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Changer MDP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Reset MDP
                      </button>
                      <button
                        onClick={() => handleForceMustChangePassword(user.id)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Forcer chg. MDP
                      </button>
                      {!user.is_jetc_admin && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
