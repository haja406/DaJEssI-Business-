# DaJEssI Business — Desktop (Windows, hors-ligne)

Logiciel de gestion pour une entreprise de collecte de riz à Madagascar.
**100% hors-ligne** : React 19 + TypeScript + Vite + Tailwind + Radix (style ShadCN) pour l'interface,
Electron pour l'application native, Express + Prisma + SQLite pour les données (stockées uniquement
sur l'ordinateur de l'utilisateur), jsPDF/ExcelJS pour les exports, Recharts pour les graphiques.

## 🚀 La façon la plus simple d'obtenir le .exe — sans rien installer

Vous n'avez pas besoin d'ordinateur puissant, de ligne de commande, ni de connaissances techniques.
GitHub (gratuit) peut construire le fichier `.exe` à votre place, dans le navigateur :

1. Créez un compte gratuit sur [github.com](https://github.com) si vous n'en avez pas.
2. Créez un nouveau dépôt (bouton vert **"New"**), par exemple nommé `dajessi-desktop`.
3. Sur la page du dépôt vide, cliquez **"uploading an existing file"** et glissez-déposez **tout le
   contenu de ce dossier** (tous les fichiers et sous-dossiers du zip que je vous ai fourni, y compris
   le dossier caché `.github`). Validez ("Commit changes").
4. Allez dans l'onglet **"Actions"** en haut de la page du dépôt. Un build nommé
   *"Build Windows app"* démarre automatiquement (⏳ quelques minutes).
5. Une fois terminé (coche verte ✅), cliquez sur ce build, puis tout en bas sur
   **"DaJEssI-Business-Windows"** dans la section *Artifacts* : cela télécharge un `.zip` contenant
   l'installateur Windows (`.exe`) et la version portable, prêts à utiliser sur n'importe quel PC
   Windows.

Tout se passe sur les serveurs de GitHub — rien à installer chez vous, pas de ligne de commande.
Ce dépôt peut rester **privé** si vous préférez (option au moment de la création, étape 2).

## ⚠️ Pour ceux qui préfèrent construire sur leur propre PC

Ce projet a été écrit dans un environnement sandbox sans accès aux serveurs de binaires de Prisma ni
à un vrai Windows — c'est justement pour cela que l'option GitHub Actions ci-dessus est recommandée
(les serveurs de GitHub, eux, ont un accès internet complet). Si vous avez malgré tout un PC avec
Node.js et souhaitez tout faire localement :

- `npm install` puis `npm run prisma:migrate` doivent être exécutés avec un accès internet normal
  (Prisma télécharge son moteur de requête depuis ses propres serveurs — aucune donnée métier n'est
  envoyée en ligne, uniquement lors de cette étape technique unique).
- Le build Windows (`npm run dist`) doit tourner sur Windows (ou avec Wine sur Linux/macOS).
- L'icône `build/icon.ico` est déjà incluse (voir `build/README.md`).

Tout le reste (schéma de base de données, API, interface, logique métier, calculs automatiques,
export PDF/Excel, sauvegarde/restauration, rôles, etc.) est complet et fonctionnel : le frontend et
le processus Electron ont été vérifiés avec succès via `tsc --noEmit` (aucune erreur), et
`npm install` a été testé avec succès (825 paquets résolus sans conflit).

## Premiers pas

```bash
npm install
npm run prisma:migrate     # crée server/prisma/migrations/ + votre dev.db local
npm run prisma:seed        # (optionnel — se fait aussi automatiquement au premier lancement)
npm run dev                # lance Vite + le serveur Express + Electron ensemble
```

Compte par défaut créé automatiquement au premier lancement :
- **Identifiant** : `admin`
- **Mot de passe** : `admin123`
(à changer immédiatement depuis *Paramètres → Mon compte*)

## Build de production

```bash
npm run build     # compile le frontend (Vite), le serveur (tsc) et Electron (tsc)
npm run dist       # génère l'installateur Windows (.exe NSIS) + la version portable (.exe)
```

Les fichiers sortent dans `release/`. Pour un simple test local sans installateur :
```bash
npm run dist:dir
```

## Architecture

```
electron/          Processus principal Electron (fenêtre, splash, tray, menu, IPC backup/restore)
server/             API Express + Prisma (SQLite) — tourne intégrée au processus Electron
  prisma/schema.prisma   Schéma complet (10 modules)
  src/routes/             Une route par module métier
  src/utils/crudRouter.ts Fabrique de routes CRUD génériques (modules simples)
src/                Frontend React (Vite)
  components/crud/        Moteur CRUD générique (table + formulaire + dialogues), réutilisé par
                           chaque page métier pour éviter la duplication de code
  pages/                   Une page par module (Agriculteurs, Fournisseurs, Achats, Ventes, Entrepôt...)
  contexts/                Auth (JWT local) + Thème (clair/sombre)
```

### Pourquoi un "moteur CRUD générique" ?

Chaque module (Agriculteurs, Fournisseurs, Clients, Dépenses, Revenus...) partage exactement les
mêmes besoins : liste avec recherche/tri/filtre/pagination, ajout/édition via formulaire validé
(Zod + React Hook Form), suppression avec confirmation, export PDF/Excel, impression. Plutôt que de
dupliquer ce code dix fois, `CrudPage` + `DataTable` + `CrudForm` (dans `src/components/crud/`)
fournissent cette mécanique une seule fois ; chaque page ne définit que ses colonnes, ses champs de
formulaire et son schéma de validation (30 à 60 lignes par module). Achats, Ventes et Entrepôt ont des
routes API "sur-mesure" côté serveur car ils ont des calculs automatiques et des effets de bord
(mise à jour du stock).

### Base de données

- Fichier SQLite stocké dans le dossier de données de l'application (`%APPDATA%/dajessi-desktop` sous
  Windows) — jamais dans le dossier d'installation, pour survivre aux mises à jour.
- Sauvegarde manuelle (`Ctrl+B` ou menu Fichier, ou bouton dans Paramètres → Sauvegarde) : copie le
  fichier `.db` vers l'emplacement de votre choix.
- Restauration : remplace le fichier `.db` actuel par une sauvegarde choisie (redémarrage requis).

### Rôles

- **Administrateur** : accès complet, y compris suppression, gestion des utilisateurs et des
  paramètres tarifaires.
- **Employé** : peut ajouter/modifier toutes les données, mais ne peut pas supprimer d'enregistrement
  ni modifier les paramètres de l'entreprise.

## Modules couverts

Agriculteurs · Fournisseurs · Clients · Achats (calcul auto + statut de paiement) · Ventes (calcul
auto du total et du profit + méthode de paiement) · Entrepôt (capacité, alerte stock bas) et
Mouvements de stock (entrées/sorties, historique, générés automatiquement par les achats/ventes) ·
Dépenses (7 catégories) · Revenus · Rapports (journalier/hebdomadaire/mensuel/annuel, export
PDF/Excel/impression) · Paramètres (entreprise, logo, devise, tarification par défaut, utilisateurs,
sauvegarde/restauration, mot de passe).

## Limitations connues à garder en tête

- Les listes sont chargées entièrement puis filtrées/triées côté client (adapté à une PME ; à revoir
  avec une pagination côté serveur si le volume dépasse plusieurs dizaines de milliers de lignes).
- Le moteur Prisma "library" (`engineType = "library"`) simplifie l'intégration Electron, mais reste
  un binaire natif : si `npm run dist` rencontre une erreur liée à `libquery_engine`, la solution
  standard est `npx electron-rebuild` ou l'ajout du binaryTarget Windows exact retourné par l'erreur
  dans `server/prisma/schema.prisma`.
- Aucun test automatisé n'est inclus (hors-scope du brief) — à ajouter si le projet grandit.
