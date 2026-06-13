import React, { useState } from 'react';
import {
  getGlpiItems, deleteGlpiItem,
  getGlpiModels, deleteGlpiModel,
  getGlpiGroups, deleteGlpiGroup,
  getGlpiManufacturers, deleteGlpiManufacturer,
  getGlpiStatuses, deleteGlpiStatus, purgeAllGlpiTickets,
  getGlpiDocuments, deleteGlpiDocument,
  getGlpiDocumentItems, deleteGlpiDocumentItem
} from '../services/CrudService';
import { deleteUser, getGlpiUsers } from '../services/testApi';

const ITEM_TYPES = ['Computer', 'Monitor', 'Phone']; 

const GlpiReset = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleReset = async () => {
    if (!window.confirm("⚠️ ATTENTION : Vous allez vider TOUTE la base GLPI (Tickets, Équipements, Utilisateurs, Groupes...). Confirmer ?")) return;

    setIsResetting(true);
    setLogs([]);

    try {
      addLog("🚀 Début de la réinitialisation globale de GLPI...");

      // ==========================================
      // ETAPE 1 : Suppression des Tickets (Priorité maximale)
      // ==========================================
      addLog("🎫 Élimination des tickets et de leurs liaisons...");
      const ticketResult = await purgeAllGlpiTickets(addLog); 
      addLog(`   -> Suppression définitive de ${ticketResult.count} ticket(s) terminée.`);

      // ==========================================
      // ETAPE 2 : Nettoyage des liaisons et documents
      // ==========================================
      addLog("🖼️ Analyse et suppression des liaisons de documents (Document_Item)...");
      const docItems = await getGlpiDocumentItems();
      if (Array.isArray(docItems) && docItems.length > 0) {
        addLog(`   -> Suppression de ${docItems.length} liaison(s) de document...`);
        await Promise.all(docItems.map(link => deleteGlpiDocumentItem(link.id)));
      }

      addLog("📁 Suppression des fichiers documents physiques de la base...");
      const documents = await getGlpiDocuments();
      if (Array.isArray(documents) && documents.length > 0) {
        addLog(`   -> Suppression de ${documents.length} fichier(s) image/document...`);
        await Promise.all(documents.map(doc => deleteGlpiDocument(doc.id)));
      }

      // ==========================================
      // ETAPE 3 : Supprimer les équipements du parc
      // ==========================================
      addLog("💻 Récupération et suppression des équipements...");
      for (const type of ITEM_TYPES) {
        const items = await getGlpiItems(type);
        if (Array.isArray(items) && items.length > 0) {
          addLog(`   -> Suppression de ${items.length} équipement(s) de type ${type}...`);
          // Note : Assurez-vous que votre deleteGlpiItem passe le paramètre 'force_delete=true' à l'API
          await Promise.all(items.map(item => deleteGlpiItem(type, item.id)));
        }
      }

      // ==========================================
      // ETAPE 4 : Supprimer les modèles d'équipements
      // ==========================================
      addLog("🔄 Récupération et suppression des modèles...");
      for (const type of ITEM_TYPES) {
        const modelType = `${type}Model`;
        const models = await getGlpiModels(modelType);
        if (Array.isArray(models) && models.length > 0) {
          addLog(`   -> Suppression de ${models.length} modèle(s) pour ${modelType}...`);
          await Promise.all(models.map(model => deleteGlpiModel(modelType, model.id)));
        }
      }

      // ==========================================
      // ETAPE 5 : Supprimer les Utilisateurs personnalisés (ID >= 7)
      // ==========================================
      addLog("👤 Récupération et filtrage des utilisateurs...");
      const users = await getGlpiUsers();
      if (Array.isArray(users) && users.length > 0) {
        const usersToDelete = users.filter(user => Number(user.id) >= 7);
        if (usersToDelete.length > 0) {
          addLog(`   -> Suppression de ${usersToDelete.length} utilisateur(s) (ID >= 7)...`);
          await Promise.all(usersToDelete.map(user => deleteUser(user.id)));
        }
      }

      // ==========================================
      // ETAPE 6 : Supprimer les structures globales (Libérées de toute dépendance)
      // ==========================================
      addLog("🏢 Suppression des groupes...");
      const groups = await getGlpiGroups();
      if (Array.isArray(groups) && groups.length > 0) {
        await Promise.all(groups.map(g => deleteGlpiGroup(g.id)));
        addLog(`   -> ${groups.length} groupe(s) supprimé(s).`);
      }

      addLog("🏭 Suppression des fabricants...");
      const manufacturers = await getGlpiManufacturers();
      if (Array.isArray(manufacturers) && manufacturers.length > 0) {
        await Promise.all(manufacturers.map(m => deleteGlpiManufacturer(m.id)));
        addLog(`   -> ${manufacturers.length} fabricant(s) supprimé(s).`);
      }

      addLog("⚙️ Suppression des statuts personnalisés...");
      const statuses = await getGlpiStatuses('State');
      if (Array.isArray(statuses) && statuses.length > 0) {
        await Promise.all(statuses.map(s => deleteGlpiStatus('State', s.id)));
        addLog(`   -> ${statuses.length} statut(s) supprimé(s).`);
      }

      addLog("✨ GLPI a été entièrement nettoyé et réinitialisé avec succès !");

    } catch (error) {
      addLog(`❌ ERREUR lors de la réinitialisation : ${error.message}`);
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ padding: '24px 0', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ border: '1px solid rgba(220, 38, 38, 0.2)', backgroundColor: 'rgba(220, 38, 38, 0.04)', padding: '24px', borderRadius: '14px' }}>
        <button
          onClick={handleReset}
          disabled={isResetting}
          style={{
            padding: '14px 24px',
            backgroundColor: isResetting ? '#F87171' : '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            fontWeight: '800',
            width: '100%',
            fontSize: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'background-color 0.2s'
          }}
        >
          {isResetting ? "Purge globale en cours..." : "Supprimer définitivement l'intégralité des données"}
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: '24px', backgroundColor: '#1A1D2E', color: '#E2E6EF', padding: '20px', height: '320px', overflowY: 'auto', borderRadius: '14px', fontFamily: "'JetBrains Mono', Consolas, monospace", boxShadow: '0 4px 16px rgba(26, 29, 46, 0.1)' }}>
          <strong style={{ color: '#6366F1', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>Terminal d'exécution système :</strong>
          <div>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '6px', fontSize: '13px', borderLeft: '2px solid #4338CA', paddingLeft: '12px', lineHeight: '1.5' }}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlpiReset;
