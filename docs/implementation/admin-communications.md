# Admin - Communications (Campagnes Email)

## 🎯 Objectif fonctionnel

Permet aux **Président**, **Vice-Président**, **Secrétaire** et **Vice-Secrétaire** de créer et envoyer des campagnes d'emails aux membres de l'association qui ont consenti à recevoir les communications (RGPD - opt-in).

**Fonctionnalités:**
1. **Lister les campagnes** existantes (brouillon, envoyées, échouées)
2. **Créer une campagne** (sujet, contenu HTML, destinataires)
3. **Envoyer une campagne** aux opt-in (membres + bénévoles)
4. **Consulter les statistiques** (nombre d'envois réussis/échoués)

## 📄 Tables Supabase utilisées

### `public.email_campaigns`
- **Colonnes utilisées:**
  - `id` (UUID, PK)
  - `name` (TEXT NOT NULL) - nom interne de la campagne
  - `subject` (TEXT NOT NULL) - objet de l'email
  - `content` (TEXT NOT NULL) - contenu HTML de l'email
  - `recipient_type` (TEXT) - 'all', 'members', 'custom'
  - `recipient_emails` (TEXT[]) - liste d'emails si custom
  - `status` (TEXT) - 'draft', 'sent', 'failed'
  - `sent_count` (INTEGER DEFAULT 0)
  - `failed_count` (INTEGER DEFAULT 0)
  - `sent_at` (TIMESTAMPTZ)
  - `created_by` (UUID FK vers profiles)
  - `created_at`, `updated_at`

### `public.profiles`
- **Utilisée pour:**
  - Vérifier le rôle de l'utilisateur connecté
  - Récupérer les emails des membres avec `comms_opt_in = true`

### `public.signups` (migration 0003)
- **Utilisée pour:**
  - Récupérer les emails des bénévoles inscrits avec `comms_opt_in = true`
  - Dédupliquer avec les membres

## 🔐 Règles d'accès / rôles requis

### Lecture (GET campagnes)
- **Président** (`president`)
- **Vice-Président** (`vice_president`)
- **Secrétaire** (`secretaire`)
- **Vice-Secrétaire** (`vice_secretaire`)
- **JETC Admin** (`is_jetc_admin = true`)

### Création/Envoi (POST)
- Mêmes rôles que lecture

### RLS (Row Level Security)
- ✅ **RLS activé** sur `email_campaigns`
- Policy `email_campaigns_all_admin`: JETC admin et président/vice peuvent tout faire
- **⚠️ Note:** La policy actuelle ne donne PAS accès aux secrétaires !

## 🔁 Endpoints API utilisés ou à créer

### ✅ Existant : `/api/campaigns/send`

#### POST `/api/campaigns/send`
- **Auth**: Aucune vérification auth dans le code actuel ! ⚠️
- **Body**:
```json
{
  "campaignId": "uuid"
}
```
- **Logique:**
  1. Vérifie que la campagne existe et n'est pas déjà envoyée
  2. Récupère tous les `profiles` avec `comms_opt_in = true`
  3. Récupère tous les `signups` (bénévoles) avec `comms_opt_in = true`
  4. Déduplique les emails
  5. Envoie via `lib/email.js` (appelle `sendEmail()`)
  6. Marque la campagne comme `status = 'sent'`
- **Retourne**:
```json
{
  "success": true,
  "sent_count": 45,
  "failed_count": 2
}
```

### ❌ À créer : `/api/campaigns/create`

#### POST `/api/campaigns/create`
- **Auth**: Token JWT (président/vice/secrétaire/vice-secrétaire)
- **Body**:
```json
{
  "name": "Infolettre Janvier 2026",
  "subject": "Prochains événements ASSEP",
  "content": "<html>...</html>",
  "recipient_type": "all"
}
```
- **Retourne**:
```json
{
  "campaign": {
    "id": "uuid",
    "name": "...",
    "status": "draft",
    "created_at": "..."
  }
}
```

### ❌ À créer : `/api/campaigns/list`

#### GET `/api/campaigns/list`
- **Auth**: Token JWT (président/vice/secrétaire/vice-secrétaire)
- **Query params**: `?status=draft` (optionnel)
- **Retourne**:
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "...",
      "subject": "...",
      "status": "sent",
      "sent_count": 45,
      "sent_at": "2026-01-25T10:00:00Z"
    }
  ]
}
```

**⚠️ Note:** Actuellement, la page `/dashboard/communications.js` lit directement depuis Supabase client au lieu d'utiliser une API

## 🧩 Composants UI nécessaires

### ✅ Existants

**Page:** `/pages/dashboard/communications.js`
- ✅ Affiche la liste des campagnes existantes
- ✅ Vérifie le rôle (président/vice/secrétaire/vice-secrétaire)
- ✅ Lit directement depuis `supabase.from('email_campaigns')`
- ⚠️ Affiche un bandeau "Fonctionnalité à implémenter"

### ❌ À créer

1. **Formulaire de création de campagne**
   - Input: Nom de la campagne (usage interne)
   - Input: Objet de l'email
   - Textarea ou éditeur WYSIWYG: Contenu HTML
   - Dropdown: Type de destinataires (tous/membres/personnalisé)
   - Si personnalisé: textarea pour liste d'emails (un par ligne)
   - Boutons: "Enregistrer brouillon" | "Enregistrer et envoyer"

2. **Modal de confirmation d'envoi**
   - Affiche: nombre de destinataires ciblés
   - Preview du sujet
   - Bouton "Confirmer l'envoi"
   - ⚠️ Warning RGPD: "Seuls les opt-in recevront l'email"

3. **Liste interactive des campagnes**
   - Badge de statut (draft/sent/failed)
   - Date d'envoi si envoyée
   - Stats: "45 envoyés, 2 échecs"
   - Actions:
     - "Éditer" (si draft)
     - "Envoyer" (si draft)
     - "Dupliquer" (créer brouillon basé sur campagne existante)
     - "Voir détails"

4. **Page détail d'une campagne**
   - Affiche toutes les infos
   - Affiche le contenu HTML (preview)
   - Liste des logs d'envoi (si disponible)

## ⚠️ Points bloquants ou manquants identifiés

### 🔴 Bloquants critiques

1. **Aucune API de création de campagne**
   - Il faut créer `/api/campaigns/create.js`
   - Actuellement impossible de créer une campagne depuis l'UI

2. **Pas d'authentification sur `/api/campaigns/send`**
   - N'importe qui peut envoyer une campagne s'il connaît l'ID ! 🚨
   - **Sécurité:** Ajouter vérification Bearer token + rôle

3. **RLS policy trop restrictive**
   - Seuls président/vice/JETC ont accès aux campagnes
   - Les secrétaires/vice-secrétaires sont bloqués par RLS !
   - **Fix:** Modifier la policy dans migration 0006

4. **Aucun formulaire UI pour créer une campagne**
   - Page actuelle affiche seulement un bandeau "à implémenter"

### 🟡 Incohérences

1. **Lecture directe Supabase client dans la page**
   - La page lit `supabase.from('email_campaigns')` directement
   - Incohérent avec le pattern API du reste du projet
   - Problème: bypass la vérification de rôle côté serveur

2. **Provider email non configuré**
   - `/lib/email.js` référence `sendEmail()` mais le code n'est pas visible
   - Variables d'env requises: `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`
   - Besoin de vérifier que le provider est configuré

3. **Logs d'emails manquants**
   - Le README mentionne `email_logs` pour tracker les envois
   - Cette table n'existe PAS dans les migrations ! ⚠️
   - Impossible de debug les échecs d'envoi

### 🟢 Points positifs

- ✅ API d'envoi existe (`/api/campaigns/send`)
- ✅ Logique de déduplication emails OK
- ✅ Récupération opt-in depuis profiles + signups
- ✅ Table `email_campaigns` bien structurée
- ✅ Page UI existe (même si incomplète)

## 📝 Plan d'implémentation recommandé

### Phase 1 : Sécuriser l'existant (PRIORITÉ HAUTE 🚨)

1. **Ajouter auth sur `/api/campaigns/send`**
```javascript
// Extraire token JWT
// Vérifier user existe
// Vérifier rôle in [president, vice_president, secretaire, vice_secretaire]
// Sinon 403 Forbidden
```

2. **Corriger la RLS policy**
```sql
-- Dans une nouvelle migration 0010
DROP POLICY "email_campaigns_all_admin" ON public.email_campaigns;

CREATE POLICY "email_campaigns_all_comms"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (
    is_jetc_admin() 
    OR is_president_or_vice()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaire', 'vice_secretaire')
    )
  )
  WITH CHECK (
    is_jetc_admin() 
    OR is_president_or_vice()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaire', 'vice_secretaire')
    )
  );
```

### Phase 2 : Créer l'API de création

1. **Créer `/api/campaigns/create.js`**
   - Vérifier auth + rôle
   - Valider inputs (subject, content requis)
   - Créer campagne avec `status = 'draft'`
   - Renseigner `created_by`

2. **Créer `/api/campaigns/list.js`** (optionnel)
   - Alternative: continuer à lire directement depuis Supabase client
   - Avantage API: logs serveur, validation, cache possible

### Phase 3 : Créer le formulaire UI

1. **Composant `CampaignForm.js`**
   - Mode création ou édition
   - Validation côté client
   - Preview HTML en temps réel (optionnel)

2. **Intégrer dans `/pages/dashboard/communications.js`**
   - Bouton "Nouvelle campagne"
   - Modal ou page dédiée avec formulaire
   - Liste cliquable pour éditer

### Phase 4 : Table email_logs (recommandé)

1. **Créer migration 0010**
```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
```

2. **Modifier `/api/campaigns/send.js`**
   - Insérer une ligne dans `email_logs` pour chaque envoi
   - Permet audit et debug

---

**État actuel:** 🔴 Partiellement implémenté avec failles de sécurité

**Prochaine étape URGENTE:** Phase 1 (sécuriser API + corriger RLS)

**Prochaine étape fonctionnelle:** Phase 2 + 3 (création + UI)
