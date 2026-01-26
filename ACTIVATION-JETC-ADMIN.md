# 🔧 Activation compte JETC Admin

## Problème
L'erreur "Profil non trouvé" signifie que votre compte n'a pas le flag `is_jetc_admin = true`.

## Solution en 2 étapes

### Étape 1: Appliquer la migration 0009

1. Ouvrir votre Dashboard Supabase: https://app.supabase.com
2. Sélectionner le projet ASSEP
3. Aller dans **SQL Editor**
4. Copier TOUT le contenu du fichier: `supabase/migrations/0009_jetc_roles_admin.sql`
5. Coller dans SQL Editor
6. Cliquer sur **Run** (▶️)

**Résultat attendu:** "Success. No rows returned"

### Étape 2: Activer votre compte JETC admin

Toujours dans **SQL Editor**, exécuter cette requête:

```sql
-- Remplacer votre-email@example.com par VOTRE email
UPDATE profiles 
SET is_jetc_admin = true 
WHERE email = 'vicepresident@assep.fr';
```

**Si vous ne connaissez pas votre email exact:**
```sql
-- Voir tous les profils
SELECT id, email, role, is_jetc_admin 
FROM profiles;
```

Puis mettre à jour avec votre ID:
```sql
UPDATE profiles 
SET is_jetc_admin = true 
WHERE id = 'VOTRE-UUID-ICI';
```

### Étape 3: Vérifier

```sql
-- Vérifier que c'est bien activé
SELECT email, role, is_jetc_admin 
FROM profiles 
WHERE is_jetc_admin = true;
```

### Étape 4: Tester

1. Déconnectez-vous de l'application
2. Reconnectez-vous
3. Allez sur `/dashboard`
4. Vous devriez maintenant voir le bouton "🔧 Gestion Utilisateurs (JETC)"
5. Cliquer dessus pour accéder à `/dashboard/jetc/users`

---

## Alternative: Script automatique

Si vous avez configuré le CLI Supabase, vous pouvez aussi utiliser:

```bash
# Appliquer la migration
supabase db push

# Activer votre compte
supabase db execute "UPDATE profiles SET is_jetc_admin = true WHERE email = 'votre-email@example.com'"
```

---

## Vérifications après activation

Une fois connecté avec le flag JETC admin:

✅ La page `/dashboard/jetc/users` doit charger sans erreur  
✅ Vous devez voir "Créer et gérer les comptes des membres du bureau"  
✅ Le formulaire de création d'utilisateur doit être visible  
✅ Le tableau des utilisateurs doit s'afficher  

---

## En cas de problème

### Erreur "function is_jetc_admin does not exist"
→ La migration 0009 n'a pas été appliquée. Retour à l'étape 1.

### Erreur "permission denied for table profiles"
→ Problème de RLS. Vérifier que les policies ont été créées:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';
```

Doit retourner 4 policies dont:
- "JETC admins can view all profiles"
- "JETC admins can update all profiles"

### Le bouton JETC n'apparaît pas dans le dashboard
→ Vider le cache du navigateur et se reconnecter

---

## Contact

Si le problème persiste après ces étapes, vérifier:
1. Les logs Supabase (Dashboard > Logs)
2. La console navigateur (F12)
3. Que la migration 0009 est bien appliquée
