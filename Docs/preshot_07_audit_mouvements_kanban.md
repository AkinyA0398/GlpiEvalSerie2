# Sujet à Venir : Historique des Mouvements Kanban (Audit Trail) et Annulations Complexes

## Inspiration & Contexte
Le workflow mentionne la possibilité "d'annuler le coût enregistré lors du mouvement vers clos" si on ramène le ticket dans la colonne "En cours".
Pour gérer cela de manière fiable et ne pas perdre la trace des actions financières, l'évolution naturelle est la mise en place d'un **Audit Trail (Historique de suivi)** complet pour chaque ticket dans le Kanban. Cela permet de retracer exactement quel mouvement a généré ou annulé quel coût.

## Fichiers à Modifier

### 1. Backend Python (`MyApi/app.py` & SQLite)
- **Action** : Créer une table `ticket_history` pour logger les changements et une API d'annulation de coût.
- **Code Clé** :
```python
# Table SQLite : id, ticket_id, old_status, new_status, action_date, cost_impact_type
@app.route('/history', methods=['POST'])
def log_kanban_movement():
    data = request.json
    db = get_db()
    db.execute(
        "INSERT INTO ticket_history (ticket_id, old_status, new_status, cost_impact_type) VALUES (?, ?, ?, ?)",
        (data['ticket_id'], data['old_status'], data['new_status'], data.get('cost_impact_type', 'none'))
    )
    db.commit()
    return jsonify({"message": "Mouvement enregistré dans l'Audit Trail"}), 201

@app.route('/cost/<int:ticket_id>/cancel', methods=['DELETE'])
def cancel_cost(ticket_id):
    db = get_db()
    # Suppression ou Soft-Delete (UPDATE status = 'cancelled') du coût
    db.execute("DELETE FROM costs WHERE ticket_id = ?", (ticket_id,))
    db.commit()
    return jsonify({"message": "Coût local annulé suite au retour de statut"}), 200
```

### 2. Frontend React (`src/components/TicketsListKanban.jsx`)
- **Action** : Intercepter l'événement `onDragEnd` pour détecter le mouvement "Clos" -> "En Cours" et déclencher la boîte de dialogue d'annulation.
- **Code Clé** :
```javascript
const onDragEnd = async (result) => {
  const { source, destination, draggableId } = result;

  // Si on retourne en arrière depuis la colonne "Clos" vers "En Cours" (ID 2 par ex)
  if (source.droppableId === 'col-closed' && destination.droppableId === 'col-inprogress') {
    
    // 1. Boîte de dialogue (Popup) de confirmation d'annulation
    const confirmUndo = window.confirm(
      "Vous ramenez ce ticket en cours. Le coût SuperCost qui y était associé va être annulé. Confirmer ?"
    );
    
    if (confirmUndo) {
      // 2. Appel API Flask pour détruire/annuler le coût
      await fetch(`http://localhost:5000/cost/${draggableId}/cancel`, { method: 'DELETE' });
      
      // 3. Logger l'événement dans l'historique
      await fetch(`http://localhost:5000/history`, { 
        method: 'POST', 
        body: JSON.stringify({ ticket_id: draggableId, old_status: 'Clos', new_status: 'En Cours', cost_impact_type: 'cancellation' })
      });
      
      // 4. Mettre à jour l'UI (déplacer la carte Kanban)
      updateKanbanUI(draggableId, source, destination);
    } else {
      // Annuler le drag & drop (la carte retourne à sa place d'origine)
      return; 
    }
  }
};
```
