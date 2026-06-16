# Sujet à Venir : Performance Technicien (Bonus / Malus et SLA)

## La Demande (Type "Alea")
> pour les techniciens dans le dashboard
> calculer bonus ou malus selon temps passe sur ticket
> si ticket resolu en < 2h: +5% du supercost en bonus tech (sqlite3)
> si resolu > 48h: -2% malus
> page tableau tech: liste des tech, nbr tickets, total bonus, total malus, net
> kanban: quand move to resolved, afficher popup: 'tech X, temps passe Y, bonus Z MGA' valider

## Impacts Architecturaux
Ce scénario modifie fortement le Kanban (interception lors du passage à la colonne "Résolu", pas seulement "Terminé") et nécessite la création complète d'un **tableau de bord de performance (RH/Compta)** pour les techniciens, avec persistance dans SQLite.

## Fichiers à Modifier & Code Clé

### 1. Frontend React (`src/components/TicketsListKanban.jsx`)
- **Action** : Interception du drag and drop vers la colonne "Résolu" (`col-resolved`) pour calculer le SLA.
- **Code Clé** :
```javascript
// Utilisation de dayjs ou moment.js
import dayjs from 'dayjs';

const onDragEnd = async (result) => {
  // ...
  if (destination.droppableId === 'col-resolved') {
     const ticket = tasks[draggableId];
     
     // 1. Calcul du temps passé (Création -> Maintenant)
     const timeSpentHours = dayjs().diff(dayjs(ticket.date), 'hour', true);
     const currentSuperCost = await fetchTicketSuperCost(draggableId); // (API SQLite)
     
     let bonusMalusAmount = 0;
     let type = 'none';
     
     // 2. Moteur de règles Bonus/Malus
     if (timeSpentHours < 2) {
         bonusMalusAmount = currentSuperCost * 0.05; // 5% de bonus
         type = 'bonus';
     } else if (timeSpentHours > 48) {
         bonusMalusAmount = currentSuperCost * 0.02; // 2% de malus
         type = 'malus';
     }
     
     // 3. Boîte de dialogue de validation
     if (type !== 'none') {
         const isConfirmed = window.confirm(
             `Temps passé : ${timeSpentHours.toFixed(1)}h.\n` +
             `SLA : Un ${type.toUpperCase()} de ${bonusMalusAmount} MGA va être appliqué au technicien.\nValider ?`
         );
         
         if (isConfirmed) {
             // Sauvegarde dans Flask
             await saveBonusMalus(ticket.technician_id, draggableId, bonusMalusAmount, type);
         } else {
             return; // Annuler le Drag & Drop
         }
     }
  }
};
```

### 2. Backend Python (`MyApi/app.py` & SQLite)
- **Action** : Créer une table `technician_performance` (`tech_id`, `ticket_id`, `amount`, `type`).
- **Code Clé** :
```python
@app.route('/api/tech/performance', methods=['POST'])
def save_performance():
    data = request.json
    db = get_db()
    db.execute(
        "INSERT INTO technician_performance (tech_id, ticket_id, amount, type) VALUES (?, ?, ?, ?)",
        (data['tech_id'], data['ticket_id'], data['amount'], data['type'])
    )
    db.commit()
    return jsonify({"success": True}), 201
```

### 3. Frontend React (`src/components/TechDashboard.jsx` - *Nouveau Composant*)
- **Action** : Nouveau composant de type Tableau de Bord pour la paie ou les RH.
- **Code Clé** :
```javascript
// Affichage simple des performances
return (
  <div className="card">
    <h3>Bilan Performances Techniciens</h3>
    <table style={styles.table}>
      <thead>
        <tr>
          <th>Technicien</th>
          <th>Tickets Résolus</th>
          <th>Total Bonus</th>
          <th>Total Malus</th>
          <th>Net à Payer (MGA)</th>
        </tr>
      </thead>
      <tbody>
        {techStats.map(tech => (
          <tr key={tech.id}>
             <td>{tech.name}</td>
             <td>{tech.ticketsCount}</td>
             <td style={{color: '#059669'}}>+{tech.totalBonus}</td>
             <td style={{color: '#DC2626'}}>-{tech.totalMalus}</td>
             <td style={{fontWeight: 'bold'}}>
                {tech.totalBonus - tech.totalMalus}
             </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```
