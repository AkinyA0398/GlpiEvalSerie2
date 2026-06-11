import { useState, useEffect } from 'react';
import { fetchGlpiItems, linkItemToTicket } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const CreateTicket = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('1'); // 1: Incident, 2: Demande
  const [urgency, setUrgency] = useState('3'); 

  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [loadingParc, setLoadingParc] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });



  const loadParcItems = async () => {
    try {
      const typesToFetch = ['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral'];
      const promises = typesToFetch.map(async (type) => {
        try {
          const res = await fetchGlpiItems(type);
          const clean = Array.isArray(res) ? res : [];
          return clean.map(item => ({
            id: item.id,
            name: item.name || `${type} #${item.id}`,
            itemtype: type,
            serial: item.serial || ''
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(promises);
      setAvailableItems(results.flat());
    } catch (err) {
      console.error("Erreur lors du chargement des elements du parc", err);
    } finally {
      setLoadingParc(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadParcItems();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddItem = (e) => {
    const value = e.target.value;
    if (!value) return;

    const [itemtype, id] = value.split('-');
    const itemToAdd = availableItems.find(i => i.id === parseInt(id) && i.itemtype === itemtype);

    if (itemToAdd && !selectedItems.some(i => i.id === itemToAdd.id && i.itemtype === itemToAdd.itemtype)) {
      setSelectedItems([...selectedItems, itemToAdd]);
    }
    
    e.target.value = '';
  };

  const handleRemoveItem = (itemtype, id) => {
    setSelectedItems(selectedItems.filter(i => !(i.id === id && i.itemtype === itemtype)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setMessage({ text: 'Veuillez remplir le titre et la description.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const cleanContent = content.trim().replace(/[\r\n]+/g, '\\n');

      const ticketResponse = await apiGlpi('Ticket', {
        method: 'POST',
        body: JSON.stringify({
          input: {
            name: title.trim(),
            content: cleanContent,
            type: parseInt(type, 10),
            urgency: parseInt(urgency, 10)
          }
        })
      });

      let createdTicketId = null;
      if (ticketResponse) {
        if (ticketResponse.id) {
          createdTicketId = ticketResponse.id;
        } else if (Array.isArray(ticketResponse) && ticketResponse[0]?.id) {
          createdTicketId = ticketResponse[0].id;
        }
      }

      if (!createdTicketId) {
        throw new Error("L'API GLPI a accepte le JSON mais n'a pas retourne d'ID valide.");
      }

      if (selectedItems.length > 0) {
        const linkPromises = selectedItems.map(item => 
          linkItemToTicket(createdTicketId, item.itemtype, item.id)
        );
        await Promise.all(linkPromises);
      }

      setMessage({ text: `Ticket #${createdTicketId} cree et materiels associes avec succes.`, type: 'success' });
      
      setTitle('');
      setContent('');
      setType('1');
      setUrgency('3');
      setSelectedItems([]);

    } catch (err) {
      console.error("Details de l'erreur GLPI Payload:", err);
      setMessage({ text: `Echec de la creation du ticket : ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      
      {/* En-tête de page */}
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Ouverture d'un Ticket d'Assistance</h2>
        <p style={styles.subtitle}>Enregistrez une nouvelle declaration dans le systeme de centralisation GLPI.</p>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      {/* Structure Grid à deux colonnes */}
      <form onSubmit={handleSubmit} style={styles.layoutGrid}>
        
        {/* Colonne de gauche : Informations principales du Ticket */}
        <div style={styles.leftColumn}>
          <div style={styles.cardForm}>
            
            {/* Titre */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Intitule du ticket</label>
              <input 
                type="text"
                placeholder="Ex: Defaillance d'affichage ou rupture de liaison reseau"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Type et Urgence côte à côte */}
            <div style={styles.rowGroup}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Type de ticket</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={styles.select}
                >
                  <option value="1">Incident (Dysfonctionnement)</option>
                  <option value="2">Demande (Service / Nouveau besoin)</option>
                </select>
              </div>

              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Niveau d'urgence declare</label>
                <select 
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  style={styles.select}
                >
                  <option value="5">5 - Tres haute</option>
                  <option value="4">4 - Haute</option>
                  <option value="3">3 - Moyenne</option>
                  <option value="2">2 - Basse</option>
                  <option value="1">1 - Tres basse</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description detaillee des symptomes</label>
              <textarea 
                rows="8"
                placeholder="Saisissez les precisions techniques concernant le dysfonctionnement ou la requete..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={styles.textarea}
              />
            </div>

            {/* Bouton de validation */}
            <button 
              type="submit"
              disabled={loading}
              style={loading ? styles.btnDisabled : styles.btnActive}
            >
              {loading ? 'Enregistrement en cours...' : 'Valider et creer le ticket'}
            </button>

          </div>
        </div>

        {/* Colonne de droite : Association d'équipements */}
        <div style={styles.rightColumn}>
          <div style={styles.parcSection}>
            <span style={styles.parcMetaTag}>Inventaire IT</span>
            <label style={styles.parcTitle}>Liaison d'equipements du parc (Optionnel)</label>
            <p style={styles.parcSubtitle}>Associez un ou plusieurs composants de l'infrastructure impactes par ce ticket.</p>
            
            {loadingParc ? (
              <p style={styles.loadingText}>Indexation des elements du parc en cours...</p>
            ) : (
              <select 
                onChange={handleAddItem}
                defaultValue=""
                style={styles.select}
              >
                <option value="" disabled>-- Selectionner un equipement a lier --</option>
                {availableItems.map(item => (
                  <option key={`${item.itemtype}-${item.id}`} value={`${item.itemtype}-${item.id}`}>
                    [{item.itemtype}] {item.name} {item.serial && `(S/N: ${item.serial})`}
                  </option>
                ))}
              </select>
            )}

            {/* Liste des badges d'association */}
            <div style={styles.badgeContainer}>
              {selectedItems.map(item => (
                <span key={`${item.itemtype}-${item.id}`} style={styles.badge}>
                  <span style={styles.badgeText}>
                    <strong style={styles.badgeType}>{item.itemtype}:</strong> {item.name}
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem(item.itemtype, item.id)}
                    style={styles.badgeRemoveBtn}
                  >
                    &times;
                  </button>
                </span>
              ))}
              {selectedItems.length === 0 && (
                <div style={styles.emptyBadgeBox}>
                  Aucune liaison active. Ce ticket sera declare comme non associe a un materiel specifique.
                </div>
              )}
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

const styles = {
  page: { backgroundColor: '#f1f5f9', minHeight: '100vh', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' },
  header: { borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#0072ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
  alertSuccess: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#059669' },
  alertError: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#dc2626' },
  
  // Nouveau Layout Grid Propre
  layoutGrid: { display: 'flex', width: '100%', gap: '24px', alignItems: 'flex-start' },
  leftColumn: { width: '55%', flexShrink: 0 },
  rightColumn: { width: '45%', flexGrow: 1, position: 'sticky', top: '20px' },
  
  // Conteneurs de cartes
  cardForm: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  rowGroup: { display: 'flex', gap: '16px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  // Inputs
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '13px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '13px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  
  // Section Parc de droite
  parcSection: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  parcMetaTag: { fontSize: '11px', fontWeight: '700', color: '#0072ff', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' },
  parcTitle: { display: 'block', fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  parcSubtitle: { fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' },
  loadingText: { fontSize: '12px', color: '#64748b', margin: 0, fontFamily: 'monospace' },
  
  // Badges d'infrastructure
  badgeContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' },
  badge: { backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' },
  badgeText: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%', color: '#0f172a' },
  badgeType: { color: '#0072ff', fontWeight: '600' },
  badgeRemoveBtn: { border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 },
  emptyBadgeBox: { fontSize: '12px', color: '#64748b', fontStyle: 'italic', border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f8fafc' },
  
  // Boutons d'action
  btnActive: { width: '100%', backgroundImage: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'box-shadow 0.2s', marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 114, 255, 0.2)' },
  btnDisabled: { width: '100%', backgroundColor: '#e2e8f0', color: '#94a3b8', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }
};

export default CreateTicket;