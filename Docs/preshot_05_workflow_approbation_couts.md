# Sujet à Venir : Validation à Multi-Niveaux et Approbation des Coûts

## Inspiration & Contexte
Suite à la fonctionnalité de saisie d'un "nouveau coût" lors du passage d'un ticket au statut "Terminé" (le SuperCost enregistré dans SQLite), une évolution logique est l'ajout d'un **workflow d'approbation**. 
Les coûts saisis par les techniciens devraient nécessiter la validation d'un superviseur ou d'un contrôleur de gestion avant d'être comptabilisés dans le résumé financier total (pour éviter les erreurs de saisie).

## Fichiers à Modifier

### 1. Backend Python (`MyApi/app.py` & SQLite)
- **Action** : Ajouter une colonne `status` (ex: "pending", "approved", "rejected") dans la table SQLite gérant les coûts. Créer des API pour changer ce statut.
- **Code Clé** :
```python
# Lors de la création de la table (si nécessaire)
# ALTER TABLE costs ADD COLUMN status TEXT DEFAULT 'pending';

@app.route('/cost/<int:ticket_id>/approve', methods=['PUT'])
def approve_cost(ticket_id):
    db = get_db()
    cursor = db.cursor()
    # Le coût devient officiel pour les calculs analytiques
    cursor.execute("UPDATE costs SET status = 'approved' WHERE ticket_id = ?", (ticket_id,))
    db.commit()
    return jsonify({"message": "Coût approuvé et intégré aux statistiques"}), 200

@app.route('/cost/<int:ticket_id>/reject', methods=['PUT'])
def reject_cost(ticket_id):
    # Logique pour rejeter (le technicien devra le resaisir)
    pass
```

### 2. Frontend React (`src/components/ManagerDashboard.jsx` - *Nouveau Composant*)
- **Action** : Créer une nouvelle page dédiée aux managers pour lister les coûts "en attente" de validation.
- **Code Clé** :
```javascript
import { useState, useEffect } from 'react';

const ManagerDashboard = () => {
  const [pendingCosts, setPendingCosts] = useState([]);

  // useEffect pour Fetch des coûts avec status === 'pending' depuis Flask

  const handleApprove = async (ticketId) => {
    await fetch(`http://localhost:5000/cost/${ticketId}/approve`, { method: 'PUT' });
    // Mise à jour de l'UI pour retirer la ligne du tableau
    setPendingCosts(prev => prev.filter(c => c.ticket_id !== ticketId));
  };

  return (
    <div className="manager-validation-view">
      <h2>Coûts en attente d'approbation</h2>
      <table>
        {/* Boucle map sur pendingCosts */}
        <tr>
          <td>Ticket #123</td>
          <td>45000 MGA</td>
          <td>
            <button onClick={() => handleApprove(123)} className="btn-success">Approuver</button>
            <button className="btn-danger">Rejeter</button>
          </td>
        </tr>
      </table>
    </div>
  );
};
```

### 3. Frontend React (`src/components/TicketsCost.jsx` / `ResumeTicket.jsx`)
- **Action** : Modifier le calcul final `calculateHardwareCosts` pour n'inclure que les coûts locaux ayant le `status === 'approved'`, ou bien séparer l'affichage en deux colonnes (Coûts Validés vs Coûts Engagés).
