# Sujet à Venir : Gestion Multi-Devises et Taux de Change Variable

## La Demande (Type "Alea")
> tsy maintsy asiana gestion devise (MGA, EUR, USD)
> boite dialogue dans terminer kanban: choix devise + taux de change du jour (input manuel)
> save dans sqlite: prix original, devise, taux, prix final en MGA
> dans la page cout ticket: affichage '100 EUR (450000 MGA)'
> calcul total toujours en MGA
> si reouverture (option 2), utiliser le taux de change du jour de la reouverture, pas de la cloture

## Impacts Architecturaux
L'application était entièrement et nativement basée sur l'Ariary (MGA). L'ajout des devises est très impactant : il demande de stocker les coûts initiaux dans SQLite **avec leur devise d'origine et leur taux exact au moment de la clôture**, et de complexifier les pages (`TicketsCost`, `ResumeTicket`) pour faire un double affichage (Devise Initiale -> MGA).
La complexité majeure réside dans la réouverture : le taux de change peut avoir fluctué.

## Fichiers à Modifier & Code Clé

### 1. Frontend React (`src/components/TicketsListKanban.jsx`)
- **Action** : Dans la modale d'enregistrement de coût de la colonne "Terminé", ajouter des inputs pour Devise et Taux.
- **Code Clé** :
```javascript
// États locaux dans la Modale de clôture
const [currency, setCurrency] = useState('MGA');
const [exchangeRate, setExchangeRate] = useState(1);
const [originalCost, setOriginalCost] = useState(0);

const handleSaveCost = async () => {
   // Conversion immédiate pour consolider la donnée
   const finalCostMGA = originalCost * exchangeRate;
   
   await fetch('http://localhost:5000/api/cost', {
      method: 'POST',
      body: JSON.stringify({ 
         ticket_id: ticketId, 
         cost: finalCostMGA,       // Prix MGA unifié stocké pour les additions mathématiques
         original_cost: originalCost, 
         currency: currency, 
         exchange_rate: exchangeRate 
      })
   });
};
```

### 2. Backend Python (`MyApi/app.py` & SQLite)
- **Action** : Mettre à jour la structure de la base de données.
- **Code Clé** :
```sql
-- Migration SQLite (à exécuter manuellement ou via script)
ALTER TABLE costs ADD COLUMN original_cost REAL;
ALTER TABLE costs ADD COLUMN currency TEXT DEFAULT 'MGA';
ALTER TABLE costs ADD COLUMN exchange_rate REAL DEFAULT 1.0;
```

### 3. Frontend React (`src/components/ResumeTicket.jsx` / `TicketsCost.jsx`)
- **Action** : Modifier les cellules de tableau pour afficher l'origine de la devise si ce n'est pas du MGA.
- **Code Clé** :
```javascript
// Dans le render() (<tbody>...</td>)
<td style={{ ...styles.tdCost, color: '#4338CA' }}>
  {/* Affichage : ex "100 EUR (450 000 MGA)" */}
  {item.currency !== 'MGA' && (
      <span style={{ fontSize: '11px', color: '#8B92A8', display: 'block' }}>
          Origine: {item.originalCost} {item.currency} 
          (Taux: {item.exchangeRate})
      </span>
  )}
  {item.superCost.toLocaleString('fr-FR')} MGA
</td>
```

### 4. Gestion de la Réouverture (`src/components/TicketsListKanban.jsx`)
- **Action** : La règle métier "utiliser le taux de change du jour de la réouverture" implique un nouvel input si la devise n'est pas du MGA.
- **Code Clé** :
```javascript
const handleReopen = async (ticket) => {
    let currentRate = ticket.exchange_rate; // Taux de base (de la clôture)
    
    // Si c'était en Devise Étrangère, on exige le taux du jour !
    if (ticket.currency !== 'MGA') {
        const userInput = prompt(
            `Le coût original était de ${ticket.original_cost} ${ticket.currency}.\n` + 
            `Saisissez le taux de change d'aujourd'hui pour ${ticket.currency} :`, 
            ticket.exchange_rate
        );
        currentRate = parseFloat(userInput) || ticket.exchange_rate;
    }
    
    // Le coût de base pour calculer la pénalité est remis à jour avec le taux du jour !
    const updatedSuperCostMGA = ticket.original_cost * currentRate;
    const reopeningPenaltyMGA = updatedSuperCostMGA * penaltyPercentage; // ex: 10%
    
    // Sauvegarde de reopeningPenaltyMGA...
};
```
