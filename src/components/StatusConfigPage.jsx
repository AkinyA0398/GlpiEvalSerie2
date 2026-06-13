import React, { useState, useEffect } from 'react';
import { apiLocalStatus } from '../api/configApi';

const StatusConfigPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingStatus, setEditingStatus] = useState(null);
  
  // INITIALISATION DE LA LANGUE VIA LOCALSTORAGE (Défaut : 'fr')
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('kanban_lang') || 'fr';
  });

  // RECHARGER LES STATUTS À CHAQUE FOIS QUE LA LANGUE CHANGE
  useEffect(() => {
    loadStatuses();
  }, [currentLang]);

  // Passe la langue choisie à l'API SQLite
  const loadStatuses = async () => {
    setLoading(true);
    try {
      const res = await apiLocalStatus(`status?lang=${currentLang}`); 
      setStatuses(res);
    } catch (err) {
      setMessage({ text: "Impossible de charger les statuts depuis SQLite.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // HANDLER POUR CHANGER LA LANGUE
  const handleLangChange = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('kanban_lang', lang);
  };

  const handleEditClick = (status) => {
    // Si l'API retourne uniquement {id, couleur, name}, on garde l'ancienne structure adaptative
    setEditingStatus({
      id: status.id,
      couleur: status.couleur || '#00d2ff',
      name_fr: status.name_fr || status.name || '', 
      name_mg: status.name_mg || status.name || ''
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingStatus) return;

    try {
      await apiLocalStatus(`status/${editingStatus.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingStatus)
      });

      setMessage({ text: "Configuration mise à jour avec succès !", type: 'success' });
      setEditingStatus(null);
      loadStatuses(); // Rafraîchit la liste avec la langue en cours
    } catch (err) {
      setMessage({ text: `Erreur de modification : ${err.message}`, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Connexion à la base de données locale...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      {/* HEADER AVEC LE SÉLECTEUR DE LANGUE */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Personnalisation du Tableau Kanban</h2>
          <p style={styles.subtitle}>Modifiez librement la couleur ou les traductions de vos colonnes.</p>
        </div>
        
        {/*  ZONE DES BOUTONS DE LANGUE */}
        <div style={styles.langSelectorContainer}>
          {/* <span style={styles.langLabel}>Langue active :</span>
          <button 
            onClick={() => handleLangChange('fr')} 
            style={currentLang === 'fr' ? styles.btnLangActive : styles.btnLangInactive}
          >
            Français
          </button>
          <button 
            onClick={() => handleLangChange('mg')} 
            style={currentLang === 'mg' ? styles.btnLangActive : styles.btnLangInactive}
          >
            Malagasy
          </button> */}
        </div>
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div style={styles.layout}>
        {/* LISTE DES STATUTS ACTUELS */}
        <div style={styles.listContainer}>
          <h3 style={styles.sectionTitle}>Statuts Enregistrés ({currentLang.toUpperCase()})</h3>
          <div style={styles.grid}>
            {statuses.map(s => (
              <div key={s.id} style={{ ...styles.statusCard, borderLeft: `6px solid ${s.couleur}` }}>
                <div style={styles.cardInfo}>
                  <div style={styles.statusName}>
                    Nom : {s.name || '-'}
                  </div>
                  <div style={styles.colorPreview}>
                    <span style={{ ...styles.colorDot, backgroundColor: s.couleur }} />
                    <code>{s.couleur}</code>
                  </div>
                </div>
                <button onClick={() => handleEditClick(s)} style={styles.btnEdit}>
                  Configurer
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FORMULAIRE DE MODIFICATION */}
        {editingStatus && (
          <div style={styles.formContainer}>
            <h3 style={styles.sectionTitle}>Modifier le Statut #{editingStatus.id}</h3>
            <form onSubmit={handleUpdateSubmit} style={styles.form}>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Couleur de fond / Thème</label>
                <div style={styles.colorPickerWrapper}>
                  <input 
                    type="color" 
                    value={editingStatus.couleur.startsWith('#') ? editingStatus.couleur : '#00d2ff'} 
                    onChange={(e) => setEditingStatus(prev => ({ ...prev, couleur: e.target.value }))}
                    style={styles.colorPicker}
                  />
                  <input 
                    type="text" 
                    value={editingStatus.couleur} 
                    onChange={(e) => setEditingStatus(prev => ({ ...prev, couleur: e.target.value }))}
                    style={styles.input}
                    placeholder="#00d2ff"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nom en Français</label>
                <input 
                  type="text" 
                  value={editingStatus.name_fr} 
                  onChange={(e) => setEditingStatus(prev => ({ ...prev, name_fr: e.target.value }))}
                  style={styles.input}
                  placeholder="Ex: Nouveau"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nom en Malgache</label>
                <input 
                  type="text" 
                  value={editingStatus.name_mg} 
                  onChange={(e) => setEditingStatus(prev => ({ ...prev, name_mg: e.target.value }))}
                  style={styles.input}
                  placeholder="Ex: Vaovao"
                />
              </div>

              <div style={styles.actions}>
                <button type="button" onClick={() => setEditingStatus(null)} style={styles.btnCancel}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnSave}>
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Objets de styles augmentés pour le sélecteur de langue
const styles = {
  page: { backgroundColor: '#F8F9FC', minHeight: '100vh', color: '#1A1D2E', fontFamily: "'Inter', system-ui, sans-serif", padding: '30px' },
  header: { marginBottom: '24px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1A1D2E', margin: '0 0 6px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  
  // Nouveaux styles pour les langues
  langSelectorContainer: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E6EF', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  langLabel: { fontSize: '12px', color: '#5A6178', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnLangActive: { backgroundColor: '#4338CA', border: 'none', color: '#FFFFFF', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'background-color 0.2s' },
  btnLangInactive: { backgroundColor: '#F1F3F9', border: '1px solid #E2E6EF', color: '#5A6178', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' },

  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8F9FC' },
  loadingText: { color: '#4338CA', fontSize: '14px', fontWeight: '600' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'flex-start' },
  listContainer: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E6EF', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)' },
  formContainer: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E6EF', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)' },
  sectionTitle: { fontSize: '15px', color: '#1A1D2E', fontWeight: '800', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E6EF', paddingBottom: '10px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  statusCard: { backgroundColor: '#F8F9FC', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E6EF' },
  cardInfo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  statusName: { fontSize: '14px', fontWeight: '700', color: '#1A1D2E' },
  colorPreview: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5A6178', fontWeight: '500' },
  colorDot: { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' },
  btnEdit: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#4338CA', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(26, 29, 46, 0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', color: '#5A6178', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', color: '#1A1D2E', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', flexGrow: 1, transition: 'border-color 0.2s' },
  colorPickerWrapper: { display: 'flex', gap: '10px', alignItems: 'center' },
  colorPicker: { border: 'none', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent', padding: 0 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' },
  btnCancel: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  btnSave: { backgroundColor: '#4338CA', border: 'none', color: '#FFFFFF', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' },
  alertSuccess: { backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', color: '#059669', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
  alertError: { backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }
};

export default StatusConfigPage;