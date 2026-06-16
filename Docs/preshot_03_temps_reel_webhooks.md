# Sujet à Venir : Synchronisation Temps Réel (Webhooks & WebSockets)

## Contexte
Actuellement, si un ticket est modifié directement dans l'interface native de GLPI ou par un autre utilisateur sur l'application React, le tableau Kanban (`TicketsListKanban.jsx`) ne se met à jour que si l'utilisateur rafraîchit manuellement la page. L'objectif de cette évolution est de rendre l'application réactive en temps réel.

## Architecture Cible
1. **GLPI** envoie un *Webhook* (requête HTTP POST automatique) à l'API Flask locale lors d'une modification de ticket (création, changement de statut, assignation).
2. **Flask** reçoit le Webhook et émet immédiatement un événement *WebSocket* aux clients React connectés.
3. **React** écoute le canal WebSocket en permanence et met à jour son état local (UI) dynamiquement sans recharger la page.

## Fichiers à Modifier

### 1. Configuration GLPI (Interface Web)
- Naviguer dans **Configuration > Actions automatiques / Webhooks** (selon les plugins installés, ex: plugin Webhook).
- Configurer un déclencheur sur la mise à jour des tickets (`Item_Ticket` / `Ticket`).
- Cible : `http://ip-du-serveur-flask:5000/webhook/glpi`

### 2. Backend Python (`MyApi/app.py`)
- **Action** : Installer `Flask-SocketIO` et créer une route de réception pour le webhook.
- **Code Clé** :
```python
# Pip install flask-socketio eventlet
from flask_socketio import SocketIO, emit
from flask import request, jsonify

# Initialisation du WebSocket avec support CORS
socketio = SocketIO(app, cors_allowed_origins="*")

# Route HTTP appelée par GLPI de manière asynchrone (Webhook)
@app.route('/webhook/glpi', methods=['POST'])
def glpi_webhook():
    data = request.json
    
    # Traitement du payload selon le format envoyé par GLPI
    ticket_id = data.get('id')
    new_status = data.get('status')
    
    if ticket_id and new_status:
        # Informer TOUS les clients React connectés qu'un ticket a changé
        socketio.emit('ticket_updated', {
            'ticket_id': ticket_id, 
            'status': new_status
        })
        return jsonify({"status": "broadcasted"}), 200
        
    return jsonify({"status": "ignored"}), 400

if __name__ == '__main__':
    # Remplacer app.run() par socketio.run()
    socketio.run(app, debug=True, port=5000)
```

### 3. Frontend React (`src/components/TicketsListKanban.jsx`)
- **Action** : Installer `socket.io-client` et brancher un écouteur d'événement au montage du composant Kanban.
- **Code Clé** :
```javascript
import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Initialisation de la connexion persistante en dehors du composant
const socket = io('http://localhost:5000');

const TicketsListKanban = () => {
  // ... états existants (columns, tasks, etc.) ...

  useEffect(() => {
    // 1. Abonnement à l'événement émis par Flask
    socket.on('ticket_updated', (data) => {
      console.log('Mise à jour temps réel reçue :', data);
      
      // 2. Mettre à jour l'état local du Kanban (re-catégorisation du ticket)
      // Ceci nécessite d'avoir une fonction qui manipule `setColumns` sans refaire un `fetch`
      handleExternalTicketUpdate(data.ticket_id, data.status);
    });

    // 3. Nettoyage de l'abonnement à la destruction du composant (anti-fuite de mémoire)
    return () => {
      socket.off('ticket_updated');
    };
  }, []);
  
  const handleExternalTicketUpdate = (ticketId, newStatusId) => {
    // Logique de recherche du ticket dans les colonnes actuelles 
    // et déplacement vers la nouvelle colonne correspondant au newStatusId
    // ...
  };
  
  // ... reste du composant ...
};
```
