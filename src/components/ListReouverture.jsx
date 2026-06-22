import React, { useState, useEffect } from 'react';
import { apiLocalStatus } from '../api/configApi';
import { fetchGlpiTickets } from '../services/CrudService';

const ListReouverture = () => {
  const [data, setData] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(''); // 'reouverture' or 'supercost'
  
  // Edit form states
  const [editSupercost, setEditSupercost] = useState(0);
  const [editPourcentage, setEditPourcentage] = useState(0);
  const [editMode, setEditMode] = useState('1');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [response, ticketsRes] = await Promise.all([
        fetch('http://127.0.0.1:5000/costAll'),
        fetchGlpiTickets()
      ]);
      
      if (!response.ok) throw new Error('Erreur lors de la récupération des données');
      
      const result = await response.json();
      setData(result);
      setTickets(Array.isArray(ticketsRes) ? ticketsRes : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (gp) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/costGroup/${gp}`, { method: 'DELETE' });
      if (response.ok) {
        await recalculateAllReouvertures();
        fetchData();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      alert("Erreur réseau");
    }
  };

  const openModal = (item, type) => {
    setEditingItem(item);
    setEditingType(type);
    setEditSupercost(item.cost || 0);
    setEditPourcentage(item.pourcentage || 0);
    setEditMode(item.mode || '1');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const saveEdit = async () => {
    try {
      let newPrix = editingItem.prix;
      let newCost = editingItem.cost;

      if (editingType === 'reouverture') {
        const costsAllDescRes = await apiLocalStatus(`costLast?itemtype=${editingItem.item_id}&id_ticket=${editingItem.id_ticket}`);
        const costsAllDesc = Array.isArray(costsAllDescRes) ? costsAllDescRes : [];
        const costsAllAscRes = await apiLocalStatus(`costFirst?itemtype=${editingItem.item_id}&id_ticket=${editingItem.id_ticket}`);
        const costsAllAsc = Array.isArray(costsAllAscRes) ? costsAllAscRes : [];
        const nums = costsAllDesc.map(c => Number(c.cost) || 0);

        let baseCost = 0;
        switch (String(editMode)) {
          case '2': baseCost = costsAllAsc.length > 0 ? Number(costsAllAsc[0].cost) || 0 : 0; break;
          case '3': baseCost = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; break;
          case '4': baseCost = nums.reduce((a, b) => a + b, 0); break;
          case '1': default: baseCost = costsAllDesc.length > 0 ? Number(costsAllDesc[0].cost) || 0 : 0; break;
        }
        
        newPrix = (baseCost * Number(editPourcentage)) / 100;
      } else if (editingType === 'supercost') {
        newCost = Number(editSupercost);
      }

      const response = await fetch(`http://127.0.0.1:5000/costGroup/${editingItem.gp}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost: newCost,
          prix: newPrix,
          mode: editMode,
          pourcentage: Number(editPourcentage)
        })
      });

      if (response.ok) {
        await recalculateAllReouvertures();
        closeModal();
        fetchData();
      } else {
        alert("Erreur lors de la modification");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const recalculateAllReouvertures = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/costAll');
      const allData = await response.json();
      
      const grouped = Object.values(allData.reduce((acc, curr) => {
        if (!acc[curr.gp]) acc[curr.gp] = [];
        acc[curr.gp].push(curr);
        return acc;
      }, {}));

      grouped.sort((a, b) => a[0].gp - b[0].gp);

      for (const group of grouped) {
        const first = group[0];
        if (first.prix > 0 || first.pourcentage > 0) {
          const gp = first.gp;
          const mode = first.mode;
          const pourcentage = first.pourcentage;
          const ticketId = first.id_ticket;
          
          let totalPrix = 0;
          for (const item of group) {
            const pastCosts = allData.filter(d => 
              d.item_id === item.item_id && 
              d.id_ticket === ticketId && 
              d.gp < gp && 
              !(d.prix > 0 || d.pourcentage > 0)
            ).sort((a, b) => b.gp - a.gp);

            const nums = pastCosts.map(c => c.cost);
            let baseCost = 0;
            switch (mode) {
              case '2': baseCost = nums.length > 0 ? nums[nums.length - 1] : 0; break;
              case '3': baseCost = nums.length > 0 ? nums.reduce((s, x) => s + x, 0) / nums.length : 0; break;
              case '4': baseCost = nums.reduce((a, b) => a + b, 0); break;
              case '1': default: baseCost = nums.length > 0 ? nums[0] : 0; break;
            }
            
            const newPrix = (baseCost * pourcentage) / 100;
            totalPrix += newPrix;
          }
          
          await fetch(`http://127.0.0.1:5000/costGroup/${gp}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prix: totalPrix,
              mode: mode,
              pourcentage: pourcentage
            })
          });
        }
      }
    } catch (err) {
      console.error("Error recalculating", err);
    }
  };

  const groupedData = Object.values(data.reduce((acc, curr) => {
    if (!acc[curr.gp]) {
      acc[curr.gp] = { ...curr, cost: 0, prix: 0, count: 0 };
    }
    acc[curr.gp].cost += curr.cost;
    acc[curr.gp].prix += curr.prix;
    acc[curr.gp].count += 1;
    return acc;
  }, {}));

  const reouvertures = groupedData.filter(d => d.prix > 0 || d.pourcentage > 0);
  const supercosts = groupedData.filter(d => !(d.prix > 0 || d.pourcentage > 0));

  const totalReouverture = reouvertures.reduce((acc, curr) => acc + curr.prix, 0);
  const totalSupercost = supercosts.reduce((acc, curr) => acc + curr.cost, 0);

  const getExternalId = (internalId) => {
    const t = tickets.find(t => parseInt(t.id, 10) === parseInt(internalId, 10));
    return t && t.externalid ? t.externalid : internalId;
  };

  return (
    <div style={styles.page}>
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.mainTitle}>Gestion des Réouvertures et SuperCosts</h2>
          <p style={styles.subtitle}>Consultez, modifiez et supprimez les entrées financières</p>
        </div>
        <button onClick={fetchData} style={styles.refreshBtn}>Rafraîchir</button>
      </div>

      {loading && <p>Chargement des données...</p>}
      {error && <p style={styles.alertError}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={styles.section}>
            <h3>1. Liste des Réouvertures (Détails)</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>ID Ticket</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Pourcentage</th>
                    <th style={styles.th}>Coût Calculé (MGA)</th>
                    <th style={styles.th}>Mode</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reouvertures.map(r => (
                    <tr key={r.gp} style={styles.tr}>
                      <td style={styles.td}>{getExternalId(r.id_ticket)}</td>
                      <td style={styles.td}><span style={styles.badgeReouverture}>Réouverture</span></td>
                      <td style={styles.td}>{r.pourcentage}%</td>
                      <td style={styles.tdCost}>{r.prix.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={styles.td}>Mode {r.mode}</td>
                      <td style={styles.td}>
                        <button onClick={() => openModal(r, 'reouverture')} style={styles.btnEdit}>Modifier</button>
                        <button onClick={() => handleDelete(r.gp)} style={styles.btnDelete}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                  {reouvertures.length === 0 && <tr><td colSpan="6" style={styles.tdCenter}>Aucune réouverture trouvée</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.section}>
            <h3>2. Liste des SuperCosts (Détails)</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>ID Ticket</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Supercost (MGA)</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supercosts.map(s => (
                    <tr key={s.gp} style={styles.tr}>
                      <td style={styles.td}>{getExternalId(s.id_ticket)}</td>
                      <td style={styles.td}><span style={styles.badgeSupercost}>SuperCost</span></td>
                      <td style={styles.tdCost}>{s.cost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={styles.td}>
                        <button onClick={() => openModal(s, 'supercost')} style={styles.btnEdit}>Modifier</button>
                        <button onClick={() => handleDelete(s.gp)} style={styles.btnDelete}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                  {supercosts.length === 0 && <tr><td colSpan="4" style={styles.tdCenter}>Aucun supercost trouvé</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.section}>
            <h3>3. Totaux</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Total Réouvertures (MGA)</th>
                    <th style={styles.th}>Total SuperCosts (MGA)</th>
                    <th style={{...styles.th, color: '#10b981'}}>Total Général (MGA)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={styles.trTotal}>
                    <td style={styles.tdCost}>{totalReouverture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td style={styles.tdCost}>{totalSupercost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td style={{...styles.tdCost, color: '#10b981', fontWeight: '800'}}>{(totalReouverture + totalSupercost).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Modifier {editingType === 'reouverture' ? 'Réouverture' : 'SuperCost'} (Ticket #{getExternalId(editingItem?.id_ticket)})</h3>
              <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>
            
            <div style={styles.modalBody}>
              {editingType === 'reouverture' && (
                <>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Pourcentage (%)</label>
                    <input 
                      type="number" 
                      value={editPourcentage}
                      onChange={e => setEditPourcentage(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Mode de Calcul</label>
                    <select 
                      value={editMode}
                      onChange={e => setEditMode(e.target.value)}
                      style={styles.select}
                    >
                      <option value="1">Mode 1 (dernier coût)</option>
                      <option value="2">Mode 2 (premier coût)</option>
                      <option value="3">Mode 3 (moyenne coût)</option>
                      <option value="4">Mode 4 (somme coût)</option>
                    </select>
                  </div>
                </>
              )}

              {editingType === 'supercost' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>SuperCost (Montant)</label>
                  <input 
                    type="number" 
                    value={editSupercost}
                    onChange={e => setEditSupercost(e.target.value)}
                    style={styles.input}
                  />
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={saveEdit} style={styles.btnSave}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { backgroundColor: '#F8F9FC', minHeight: '100vh', color: '#1A1D2E', fontFamily: "'Inter', sans-serif", padding: '30px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #E2E6EF', paddingBottom: '16px' },
  mainTitle: { fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  refreshBtn: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', color: '#5A6178', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  section: { marginBottom: '40px' },
  tableWrapper: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', marginTop: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  thRow: { backgroundColor: '#F8F9FC', borderBottom: '2px solid #E2E6EF' },
  th: { padding: '16px 20px', color: '#5A6178', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #E2E6EF' },
  trTotal: { backgroundColor: '#F1F3F9' },
  td: { padding: '16px 20px' },
  tdCost: { padding: '16px 20px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' },
  tdCenter: { padding: '16px 20px', textAlign: 'center', color: '#8B92A8', fontStyle: 'italic' },
  badgeReouverture: { backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#0284c7', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  badgeSupercost: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  btnEdit: { backgroundColor: 'rgba(67, 56, 202, 0.1)', color: '#4338CA', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' },
  btnDelete: { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  alertError: { padding: '12px 16px', backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', borderRadius: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#FFF', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #E2E6EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#8B92A8' },
  modalBody: { padding: '20px' },
  fieldGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#5A6178', fontSize: '13px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E6EF', fontSize: '14px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E6EF', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#FFF' },
  modalFooter: { padding: '20px', borderTop: '1px solid #E2E6EF', display: 'flex', justifyContent: 'flex-end' },
  btnSave: { backgroundColor: '#4338CA', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }
};

export default ListReouverture;
