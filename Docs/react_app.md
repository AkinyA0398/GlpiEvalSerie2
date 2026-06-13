# Documentation Technique : Application Front-End React

## 1. Vue d'ensemble
L'application front-end est construite en **React (version 19)**, utilisant **Vite** comme outil de build pour des performances optimales en développement et en production. Le routage est géré par **React Router v7**. 

L'application sert d'interface personnalisée pour interagir avec un système de ticketing/ITSM (probablement GLPI, au vu du nom des composants), ainsi qu'avec une API Python interne (pour la gestion des statuts et des coûts).

## 2. Dépendances Principales
- **React 19** (`react`, `react-dom`)
- **React Router DOM 7** (`react-router-dom`) : Pour la gestion des routes de l'application.
- **Vite 8** (`vite`, `@vitejs/plugin-react`) : Bundler et serveur de développement rapide.
- **JSZip** : Utilisé probablement pour la manipulation ou l'extraction d'archives au sein de l'application.

## 3. Architecture des Dossiers (`src/`)
- `components/` : Contient l'ensemble des vues et composants de l'application (Dashboard, Formulaires, Tableaux, Configuration).
- `squelette/` : Contient des composants réutilisables d'interface utilisateur (Popups, structures de base).
- `api/` / `services/` : (Si existant/utilisé) Pour regrouper les appels vers l'API externe GLPI et l'API Flask.
- `assets/` : Ressources statiques.
- `config/` : Fichiers de configuration globale.

## 4. Stratégie de Routage (`App.jsx`)
Le routage est divisé en trois grandes catégories avec des vérifications d'authentification basées sur le `localStorage`.

### 4.1 Routes Publiques
Accessibles à tous les utilisateurs :
- `/` : Page d'accueil (`Home`)
- `/login` : Page de connexion standard.
- `/LoginBack` : Page de connexion spécifique pour l'administration.

### 4.2 Routes FrontOffice (Espace Support)
Encapsulées dans le composant `FrontOfficeLayout`, elles fournissent l'interface "Client/Utilisateur" de l'application.
- `/list` : Liste des éléments GLPI (`GlpiItemList`).
- `/ticket` : Création de ticket (`CreateTicket`).
- `/ticketkanban` : Vue kanban des tickets de l'utilisateur (`TicketsListKanban`).

### 4.3 Routes BackOffice (Administration)
Sécurisées via le wrapper `ProtectedAdmin` (qui vérifie la présence de `adminSession` dans le `localStorage`) et encapsulées dans `BackOfficeLayout`.
- `/admin` : Tableau de bord administratif (`GlpiDashboard`).
- `/adminTicket` : Liste complète des tickets pour les administrateurs (`TicketsList`).
- `/statusConfig` : Interface de configuration des statuts personnalisés liés à l'API Python (`StatusConfigPage`).
- `/testCsv` : Outil de test dynamique CSV (`CsvDynamicTester`).
- `/admin/reset` : Interface de remise à zéro des données (`ResetData`).
- `/cost` : Gestion et suivi des coûts des tickets (`TicketsCost`).

### 4.4 Anciennes Routes de Test
Sécurisées via `ProtectedRoute` (vérifiant `token`), elles sont probablement conservées pour des tests internes :
- `/tableau`, `/popup`, `/test-users`, `/test-AddUsers`

## 5. Composants Clés et Layouts
- **Layouts (`FrontOfficeLayout`, `BackOfficeLayout`)** : Fournissent une structure commune (Sidebar, Header, Footer) garantissant une cohérence visuelle selon l'espace dans lequel se trouve l'utilisateur.
- **Authentification** : Gérée côté client avec le `localStorage`. Les composants de protection de routes redirigent vers les pages de login adéquates si le token/session est manquant.

## 6. Exécution
Pour lancer le projet en environnement de développement :
```bash
npm install
npm run dev
```
Pour construire l'application pour la production :
```bash
npm run build
```
