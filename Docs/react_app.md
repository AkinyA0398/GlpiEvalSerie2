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

## 7. Concepts React Utilisés (Exemples de Code)
L'application s'appuie sur les standards modernes de React (Hooks et composants fonctionnels) conformes à la documentation officielle de React.

### 7.1 Composants Fonctionnels et JSX
Toute l'interface est construite à l'aide de composants fonctionnels qui retournent du JSX (syntaxe déclarative pour l'UI).
```jsx
// Exemple basique d'un composant fonctionnel (ex: Home.jsx)
export default function Home() {
  return (
    <div className="home-container">
      <h1>Bienvenue sur le Portail</h1>
    </div>
  );
}
```

### 7.2 Hook `useState` (Gestion de l'état local)
`useState` permet d'ajouter un état local à un composant fonctionnel. Il renvoie un tableau contenant la valeur de l'état actuel et une fonction pour la mettre à jour.
```jsx
import { useState } from 'react';

function Counter() {
  // Déclaration d'une variable d'état "count" initialisée à 0
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Vous avez cliqué {count} fois
    </button>
  );
}
```
*Dans le projet, `useState` est omniprésent (ex: gestion des formulaires, des spinners de chargement, stockage des données issues de l'API).*

### 7.3 Hook `useEffect` (Gestion des effets de bord)
`useEffect` permet d'exécuter du code après le rendu (par exemple, pour faire un appel API, un abonnement, ou manipuler le DOM manuellement).
```jsx
import { useState, useEffect } from 'react';
import { fetchTickets } from '../services/CrudService';

function TicketList() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Cette fonction s'exécutera au montage du composant
    let isMounted = true;
    fetchTickets().then(data => {
      if (isMounted) setTickets(data);
    });
    
    // Fonction de nettoyage exécutée au démontage
    return () => { isMounted = false; };
  }, []); // Le tableau vide [] signifie "exécuter uniquement au premier rendu"

  return <ul>{tickets.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

### 7.4 Hook `useCallback` (Mémorisation de fonctions)
`useCallback` renvoie une version mémorisée du callback qui ne change que si l'une des dépendances a changé, très utile pour l'optimisation des performances des composants enfants.
```jsx
import { useCallback } from 'react';

// Exemple tiré de TicketsCost.jsx ou ResumeTicket.jsx
const calculateCosts = useCallback((data) => {
  // Calcul complexe pour éviter qu'il ne soit redéfini à chaque rendu
  const total = data.reduce((acc, item) => acc + item.cost, 0);
  setSummary(total);
}, [/* dépendances */]); 
```

### 7.5 Hooks Personnalisés (Custom Hooks)
Les Hooks personnalisés permettent d'extraire la logique des composants dans des fonctions réutilisables.
```jsx
// Extrait conceptuel de services/ParserCsv.jsx
export function useCsvParser() {
  const [data, setData] = useState([]);
  
  const parseFile = (file) => {
    // Logique complexe de lecture de fichier...
    setData(parsedResults);
  };
  
  // On retourne les états et les fonctions utiles
  return { data, parseFile };
}
```

### 7.6 Routage Dynamique (React Router v7)
L'application utilise `react-router-dom` pour la navigation côté client (SPA - Single Page Application).
```jsx
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

// Utilisation dans un composant enfant
function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/admin')}>Aller à l'Admin</button>;
}
```

### 7.7 Rendu Conditionnel et Listes
React gère le rendu conditionnel via des opérateurs JavaScript comme `&&` ou l'opérateur ternaire `? :`. Les listes sont générées via la méthode `.map()`.
```jsx
function Dashboard({ loading, error, items }) {
  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="alert-error">{error}</div>;

  return (
    <ul>
      {items.length === 0 ? (
        <li>Aucun élément</li>
      ) : (
        items.map(item => <li key={item.id}>{item.name}</li>)
      )}
    </ul>
  );
}
```

## 8. Liste et Rôle des Composants

### 8.1 Layouts (Gabarits)
- **`BackOfficeLayout.jsx` / `AdminLayout.jsx`** : Structure de l'espace d'administration avec barre latérale de navigation complète.
- **`FrontOfficeLayout.jsx`** : Structure de l'espace public/support pour les utilisateurs standards.

### 8.2 Vues Principales (Pages)
- **`Home.jsx`** : Page d'accueil permettant de choisir entre l'espace admin et l'espace public.
- **`LoginBack.jsx`** : Interface de connexion au Backoffice (sécurisée par clé locale).
- **`GlpiDashboard.jsx`** : Tableau de bord analytique présentant les statistiques globales du parc (par catégorie) et des tickets (incidents vs demandes).
- **`TicketsList.jsx`** : Vue d'administration listant tous les tickets sous forme de tableau interactif, avec vue détaillée sous forme de pop-up modal.
- **`TicketsListKanban.jsx`** : Vue de gestion des tickets sous forme de tableau Kanban avec drag & drop, attribution de technicien et workflow de statut (avec modales de clôture/réouverture).
- **`TicketsCost.jsx` / `ResumeTicket.jsx`** : Interfaces analytiques comparant les coûts GLPI natifs, les coûts locaux (SuperCost) et les valeurs de réouverture (MGA).
- **`CsvDynamicTester.jsx`** : Outil d'importation massive de données depuis des fichiers CSV (Parc, Tickets, Coûts) et archive ZIP (Images binaires valides).
- **`CreateTicket.jsx`** : Formulaire utilisateur complet pour déclarer un nouvel incident/demande et y lier des équipements de l'inventaire.
- **`GlpiItemList.jsx`** : Inventaire visuel du parc matériel avec recherche multicritères et affichage sous forme de grille de cartes.
- **`StatusConfigPage.jsx`** : Interface de configuration permettant de personnaliser les couleurs et les traductions des statuts du Kanban.
- **`ResetData.jsx` / `GlpiReset.jsx`** : Interfaces critiques pour la confirmation, la purge et la réinitialisation totale de la base de données GLPI.

### 8.3 Composants de Test / Obsolètes
- **`TestUsers.jsx` / `addUser.jsx` / `Tableau.jsx` / `Popup.jsx`** : Composants et squelettes utilisés pour des tests de base (API, UI).
