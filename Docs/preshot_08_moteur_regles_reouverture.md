# Sujet à Venir : Moteur Automatique de Pénalités de Réouverture (SLA Dynamique)

## Inspiration & Contexte
L'application gère déjà la réouverture d'un ticket ("option 2") via un champ où l'on saisit un pourcentage pour calculer un coût de réouverture (ex: 10% du supercost).
L'évolution majeure pour automatiser cette facturation est d'implémenter un **Moteur de Règles basé sur le temps (SLA)** : le pourcentage de pénalité de réouverture se calcule *automatiquement* en fonction de l'ancienneté de la clôture.

## Scénario Métier Cible
- Ticket rouvert **moins de 24h** après clôture : **0%** de pénalité (Considéré comme un simple oubli ou test du technicien).
- Ticket rouvert **entre 24h et 7 jours** : **10%** de pénalité.
- Ticket rouvert **après plus de 7 jours** : **50%** de pénalité (ou 95%) car c'est considéré comme une nouvelle demande complexe.

## Fichiers à Modifier

### 1. Frontend React (`src/components/TicketsListKanban.jsx` ou un Composant Modale de Réouverture)
- **Action** : Au lieu de proposer un champ de saisie libre (input text), l'application déduit le pourcentage en comparant la date actuelle et la date de clôture stockée dans GLPI/SQLite.
- **Code Clé** :
```javascript
// Utilisation d'une librairie de gestion de date (moment ou date-fns)
import dayjs from 'dayjs'; 

const calculateReopeningPenalty = (closureDateStr, currentSuperCost) => {
  const now = dayjs();
  const closedAt = dayjs(closureDateStr);
  
  // Calcul de la différence en heures
  const diffHours = now.diff(closedAt, 'hour');

  let penaltyPercent = 0;
  
  if (diffHours > 24 && diffHours <= 168) { // Entre 24h et 7 jours (168h)
    penaltyPercent = 0.10; // 10%
  } else if (diffHours > 168) { // Plus de 7 jours
    penaltyPercent = 0.50; // 50%
  }

  const reopeningCost = currentSuperCost * penaltyPercent;
  
  return { 
    penaltyPercent: penaltyPercent * 100, 
    reopeningCost 
  };
};

// Dans la boîte de dialogue de réouverture (Modale React) :
/*
  const { penaltyPercent, reopeningCost } = calculateReopeningPenalty(ticket.closedate, ticket.supercost);
  
  return (
    <div className="reopen-dialog">
      <p>Le ticket a été clos il y a {diffHours} heures.</p>
      <p>Pénalité automatique de réouverture appliquée : <strong>{penaltyPercent}%</strong></p>
      <p>Coût de réouverture calculé : <strong>{reopeningCost} MGA</strong></p>
      <button onClick={handleValidateReopen}>Valider la réouverture</button>
    </div>
  );
*/
```

### 2. Backend Python (`MyApi/app.py`)
- **Action** : Créer une API permettant à l'administrateur de configurer les paliers de temps (24h, 168h) et les pourcentages (10%, 50%) directement dans SQLite, afin que ces règles ne soient pas codées "en dur" dans le React.
- **Code Clé** :
```python
@app.route('/settings/sla-reopen', methods=['GET', 'POST'])
def handle_sla_rules():
    # Permet de récupérer ou modifier les règles de pénalité depuis une table 'sla_rules'
    pass
```
