# Sujet à Venir : Règles de Répartition Complexes des Coûts (Split Financier Avancé)

## Inspiration & Contexte
Actuellement, si un ticket possède plus d'un équipement lié (`item_ticket > 1`), le coût est divisé équitablement en 2 ou en 3. 
La prochaine étape logique pour un calcul analytique fin est d'appliquer une **répartition pondérée** selon le type d'équipement ou son importance (ex: Une intervention sur un Serveur/PC prend 80% du temps global du ticket, contre 20% pour le remplacement d'un clavier ou d'un téléphone).

## Fichiers à Modifier

### 1. Frontend React (`src/components/TicketsCost.jsx` ou `ResumeTicket.jsx`)
- **Action** : Remplacer la division uniforme par une logique de poids configurables par catégorie de matériel.
- **Code Clé** :
```javascript
// Définition des poids (ces valeurs pourraient plus tard venir de l'API Flask/SQLite)
const HARDWARE_WEIGHTS = {
  Computer: 0.70, // 70% du coût
  Monitor: 0.15,  // 15% du coût
  Phone: 0.15,    // 15% du coût
  Peripheral: 0.05
};

const calculateHardwareCosts = useCallback((links, glpiCosts, localCosts) => {
  // ... initialisation ...
  
  // Pour chaque ticket ayant des coûts dans GLPI
  const ticketItems = links.filter(l => parseInt(l.tickets_id, 10) === ticketId);
  
  // 1. Calcul du poids total cumulé des équipements liés à ce ticket spécifique
  const totalWeight = ticketItems.reduce((sum, item) => sum + (HARDWARE_WEIGHTS[item.itemtype] || 1), 0);

  ticketItems.forEach(item => {
    const itemWeight = HARDWARE_WEIGHTS[item.itemtype] || 1;
    
    // 2. La part du coût de l'équipement est proportionnelle à son poids par rapport au ticket
    const costShare = ticketGlpiTotal * (itemWeight / totalWeight);
    
    summary[item.itemtype].glpiCost += costShare;
  });
  
  // ...
});
```

### 2. Frontend React (`src/components/SettingsCostWeights.jsx` - *Nouveau*)
- **Action** : Créer une interface d'administration permettant au gestionnaire de modifier dynamiquement ces pourcentages (ex: Passer les Téléphones à 20%), puis sauvegarder ces configurations dans SQLite via l'API Flask.
