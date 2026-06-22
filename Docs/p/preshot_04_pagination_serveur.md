# Sujet à Venir : Pagination et Filtrage Côté Serveur (Optimisation des Performances)

## Contexte
La fonction `fetchGlpiTickets` utilise actuellement des paramètres en dur limitant la requête (ex: `?range=0-500` ou `?range=0-1000`). À mesure que l'application grandit et que l'entreprise traite des dizaines de milliers de tickets, le téléchargement de l'intégralité de la base en une seule requête va saturer la bande passante et considérablement ralentir le rendu de l'interface React. Il faut implémenter une architecture de pagination côté serveur.

## Mécanique GLPI
L'API REST de GLPI gère la pagination via le paramètre URL `range` (ex: `range=0-49`) et renvoie le nombre total d'éléments disponibles via le header HTTP `Content-Range` (ex: `Content-Range: 0-49/2345`).

## Fichiers à Modifier

### 1. Frontend React (`src/api/apiGlpi.js`)
- **Action** : Adapter le fetcher central pour qu'il puisse retourner non seulement les données (JSON), mais aussi intercepter et extraire le header `Content-Range`.
- **Code Clé** :
```javascript
export const apiGlpiWithPagination = async (endpoint, options = {}) => {
  const sessionToken = localStorage.getItem('glpi_session_token');
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}/${endpoint}${separator}app_token=${appToken}`;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(sessionToken && endpoint !== 'initSession' ? { 'Session-Token': sessionToken } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers, mode: 'cors' });
  
  if (!response.ok) throw new Error(`Erreur API`);

  const data = await response.json();
  
  // Extraction du total depuis le header (ex: "0-49/2345" -> 2345)
  const contentRange = response.headers.get('Content-Range');
  let totalCount = data.length;
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)$/);
    if (match) totalCount = parseInt(match[1], 10);
  }

  // On retourne un objet structuré au lieu du simple tableau de données
  return {
    data: data,
    totalCount: totalCount
  };
};
```

### 2. Frontend React (`src/services/CrudService.jsx`)
- **Action** : Modifier les appels pour accepter des paramètres de pagination (offset et limite).
- **Code Clé** :
```javascript
export const fetchGlpiTicketsPaginated = async (start = 0, limit = 50) => {
  // Calcul du range GLPI (ex: start 0, limit 50 -> range=0-49)
  const range = `${start}-${start + limit - 1}`;
  
  // Utilisation de la nouvelle fonction qui récupère le Content-Range
  return await apiGlpiWithPagination(`Ticket?range=${range}`);
};
```

### 3. Frontend React (`src/components/TicketsList.jsx`)
- **Action** : Ajouter un état de page, un état total, et des contrôles d'interface utilisateur pour naviguer entre les pages.
- **Code Clé** :
```javascript
import { useState, useEffect } from 'react';
import { fetchGlpiTicketsPaginated } from '../services/CrudService';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const itemsPerPage = 50;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchGlpiTicketsPaginated(currentPage * itemsPerPage, itemsPerPage);
        setTickets(result.data);
        setTotalTickets(result.totalCount);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentPage]); // Se déclenche à chaque changement de page

  const totalPages = Math.ceil(totalTickets / itemsPerPage);

  return (
    <div className="table-container">
      {/* Tableau rendu ici avec les {tickets} ... */}
      
      {/* Contrôles de pagination */}
      <div className="pagination-controls" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0 || loading}
        >
          Précédent
        </button>
        
        <span style={{ padding: '8px' }}>
          Page {currentPage + 1} sur {totalPages || 1} ({totalTickets} tickets)
        </span>
        
        <button 
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage >= totalPages - 1 || loading}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};
```
