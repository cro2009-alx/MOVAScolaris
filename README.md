# Scolaris

Application française de suivi des frais de scolarité, construite avec TanStack Start, React, Tailwind CSS v4, lucide-react et Sonner.

## Démarrer en mode démonstration

```bash
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite. Les accès rapides Fondateur et Secrétaire utilisent des données locales de démonstration ; les paiements et les fiches créés dans ce mode sont conservés dans le navigateur. La démo ne simule pas une authentification sécurisée.

## Activer Supabase

1. Créer un projet Supabase et copier `.env.example` vers `.env.local`.
2. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. La clé `service_role` ne doit jamais être exposée au navigateur.
3. Appliquer dans l’ordre `supabase/migrations/202610130001_scolaris.sql`, `supabase/migrations/202610150001_secretary_structures.sql`, puis `supabase/migrations/202610150002_demo_data_flag.sql` avec la CLI Supabase ou l’éditeur SQL.
4. Déployer `supabase/functions/create-founder` et `supabase/functions/create-secretary`. La configuration met la création publique du fondateur sans JWT et garde la gestion secrétaire avec JWT ; les clés serveur restent côté fonctions.
5. Utiliser « Créer un établissement » : la fonction serveur confirme l’adresse et connecte directement le fondateur ; le trigger `auth.users` crée l’école, le profil et le rôle.
6. Depuis Équipe, créer le compte secrétaire. L’application charge les données de la base et écoute les changements Realtime des paiements, élèves, classes, signalements et profils.
7. Pour installer les données d’exemple serveur, créez le fondateur `fondateur@demo-ecole.com` avec `Demo1234!`, puis la secrétaire de démonstration via Équipe et exécutez `supabase/seed.sql`. Le seed marque uniquement cette école comme démo. Les autres établissements démarrent sans données fictives.

Toutes les tables applicatives ont RLS activé. Les classes, élèves et paiements sont isolés par secrétaire dans PostgreSQL ; le fondateur conserve une lecture globale. Les reçus, auteurs, élèves et structures des paiements restent immuables, tandis que montant, mode, tranche, échéance et note peuvent être corrigés tant que le paiement n’est pas annulé. L’annulation garde son motif et sa trace. La suppression d’accès efface uniquement les données de la secrétaire choisie, comme demandé.

La migration du marqueur démo ne supprime aucune donnée. Elle marque uniquement l’école associée au compte fondateur `fondateur@demo-ecole.com`. Les données des anciens comptes réels doivent être vérifiées séparément avant tout nettoyage ; aucun nettoyage automatique n’est exécuté.

## Vérification

```bash
npm run check
npm run build
```

Le manifeste, l’icône et le service worker sont dans `public/`. Le reçu s’imprime via la boîte de dialogue du navigateur (enregistrement PDF disponible dans l’imprimante système).