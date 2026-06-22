# Documentation : Les Requêtes avec Fetch API

La fonction `fetch()` permet de faire des requêtes HTTP asynchrones en JavaScript (pour communiquer avec votre backend/API).

## 1. Requête GET (Récupérer des données)
C'est la méthode par défaut. Idéale pour récupérer une liste ou un élément précis.

```javascript
const fetchTickets = async () => {
    try {
        // Appelle l'URL avec la méthode GET
        const response = await fetch('http://localhost:5000/api/tickets');
        
        // Vérifie si le statut HTTP est OK (200-299)
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Convertit la réponse brute en objet JavaScript/JSON
        const data = await response.json();
        console.log("Données récupérées :", data);
        
        return data; // Parfait pour l'assigner à un setState: setTickets(data)
    } catch (error) {
        console.error("Erreur lors du fetch :", error);
    }
};
```

## 2. Requête POST (Envoyer de nouvelles données)
Idéal pour la création (ex: ajouter un nouveau ticket). Il faut préciser : la méthode, les en-têtes (Headers) et le corps (Body).

```javascript
const createTicket = async (nouveauTicket) => {
    try {
        const response = await fetch('http://localhost:5000/api/tickets', {
            method: 'POST',
            headers: {
                // Précise au backend qu'on lui envoie du JSON
                'Content-Type': 'application/json',
            },
            // On convertit notre objet JS en chaîne JSON
            body: JSON.stringify(nouveauTicket) 
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Ticket créé avec succès :", result);
        }
    } catch (error) {
        console.error("Erreur POST :", error);
    }
};

// Exemple d'appel :
// createTicket({ title: "Panne PC", description: "Ne s'allume plus" });
```

## 3. Requête PUT (Mettre à jour des données)
Très similaire au POST, mais la convention HTTP indique une mise à jour d'un élément existant (via son ID dans l'URL).

```javascript
const updateTicket = async (ticketId, ticketData) => {
    try {
        const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
        
        const result = await response.json();
        console.log("Mise à jour réussie :", result);
    } catch(error) {
        console.error("Erreur PUT :", error);
    }
};
```

## 4. Requête DELETE (Supprimer des données)
On spécifie généralement juste l'ID dans l'URL. Pas besoin de Headers JSON ou de Body.

```javascript
const deleteTicket = async (ticketId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            console.log(`Ticket ${ticketId} supprimé.`);
        }
    } catch(error) {
        console.error("Erreur DELETE :", error);
    }
};
```

## Résumé du Cycle `fetch` en React avec `useEffect`
Le combo classique pour charger les données à l'ouverture de la page :

```javascript
import React, { useState, useEffect } from 'react';

const MaListe = () => {
    const [donnees, setDonnees] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const response = await fetch('http://localhost:5000/api/items');
            const result = await response.json();
            setDonnees(result);
        };
        
        loadData();
    }, []); // Le tableau vide indique : à lancer une seule fois au montage de la page

    return (
        <ul>
            {donnees.map(item => <li key={item.id}>{item.nom}</li>)}
        </ul>
    );
};
```
