# Sujet à Venir : Cycle de vie (Mise au rebut) et Remplacement de Matériel

## La Demande (Type "Alea")
> Dans glpi item list, ajout bouton 'Mettre au rebut'
> quand click: boite de dialogue motif + selectionner nouveau pc de remplacement
> enregistrer historique dans sqlite3 (ancien pc id, nouveau pc id, date, cout de remplacement)
> le cout ticket change: si un ticket lie le nouveau pc, prendre en compte le prix d'achat du nouveau pc comme supercost additionnel
> option 1: annuler rebut = remet le pc en actif, supprime le cout
> option 2: si le pc etait deja dans un ticket en cours, auto-assigner le nouveau pc au ticket

## Impacts Architecturaux
Ce besoin touche profondément la gestion du parc (`GlpiItemList`), la base de données locale (SQLite) pour l'historique de remplacement, et la logique complexe des tickets (`TicketsListKanban` et `TicketsCost`). 

## Fichiers à Modifier & Code Clé

### 1. Backend Python (`MyApi/app.py` & SQLite)
- **Action** : Création d'une table `replacements` (`old_item_id`, `new_item_id`, `reason`, `replacement_cost`, `date`).
- **Code Clé** :
```python
@app.route('/api/item/scrap', methods=['POST'])
def scrap_item():
    data = request.json
    db = get_db()
    # 1. Enregistrer le remplacement dans l'historique local
    db.execute(
        "INSERT INTO replacements (old_item_id, new_item_id, reason, replacement_cost) VALUES (?, ?, ?, ?)",
        (data['old_id'], data['new_id'], data['reason'], data['cost'])
    )
    db.commit()
    # NB : Il faudra aussi faire un appel REST vers GLPI pour passer l'ancien PC au statut "Rebut"
    return jsonify({"message": "Mise au rebut enregistrée"}), 200
```

### 2. Frontend React (`src/components/GlpiItemList.jsx`)
- **Action** : Ajout du bouton et de la modale de mise au rebut.
- **Code Clé** :
```javascript
import { useState } from 'react';

const handleScrapItem = async (oldItem) => {
  // setSelectedOldItem(oldItem);
  // setShowScrapModal(true);
};

// Dans la Modale de validation de Rebut (ScrapModal)
const submitScrap = async () => {
  // 1. Appel API Flask
  await fetch('http://localhost:5000/api/item/scrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        old_id: selectedOldItem.id, 
        new_id: selectedNewItem.id, 
        reason: scrapReason, 
        cost: newCost 
    })
  });
  
  // OPTION 2 : Si le PC était déjà lié à un ticket ouvert, 
  // on bascule le lien dans GLPI vers le nouveau PC
  if (selectedOldItem.isLinkedToTicket) {
      // (Suppression ancien lien + Création nouveau lien via CrudService)
      await updateItemTicketLink(selectedOldItem.ticket_id, 'Computer', selectedNewItem.id);
  }
};
```

### 3. Frontend React (`src/components/TicketsCost.jsx`)
- **Action** : Ajouter le `replacement_cost` comme un `supercost` additionnel.
- **Code Clé** :
```javascript
// Lors du fetch des données, récupérer aussi les coûts de remplacement (nouvelle route Flask)
const calculateHardwareCosts = useCallback((links, glpiCosts, localCosts, replacementCosts) => {
   // ...
   
   // Si le nouveau PC lié au ticket a été acheté suite à un rebut, 
   // on ajoute son prix d'achat au SuperCost de ce ticket
   const replacedItem = replacementCosts.find(r => r.new_item_id === item.items_id);
   if (replacedItem) {
       summary[item.itemtype].superCost += replacedItem.replacement_cost;
   }
});
```
