import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginBack = () => {
  const [formData, setFormData] = useState({
    nom: ''
  });
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) setError(false); // Reinitialise l'erreur des que l'utilisateur saisit a nouveau
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nom === "admin1234") {
      localStorage.setItem('adminSession', 'admin');
      navigate("/admin");
    } else {
      setError(true);
      setFormData({ nom: '' }); // Efface le mauvais mot de passe
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.brand}>GLPI</div>
          <h2 style={styles.title}>Administration</h2>
          <p style={styles.subtitle}>Authentification requise pour l'acces au Backoffice</p>
        </div>
        
        {error && (
          <div style={styles.alertError}>
            Code d'acces administrateur invalide.
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Champ unique : Cle d'acces */}
          <div style={styles.inputGroup}>
            <label htmlFor="nom" style={styles.label}>Cle d'acces unique :</label>
            <input
              type="password"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Entrez votre cle d'acces"
              required
              style={styles.input}
            />
          </div>

          {/* Bouton de soumission */}
          <button type="submit" style={styles.button}>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: 'linear-gradient(145deg, #F8F9FC 0%, #EEF0F7 100%)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: '20px',
    boxSizing: 'border-box'
  },
  container: {
    maxWidth: '420px',
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E6EF',
    borderRadius: '16px',
    padding: '40px',
    boxSizing: 'border-box',
    boxShadow: '0 8px 32px rgba(26, 29, 46, 0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  brand: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#4338CA',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '8px'
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    fontWeight: '800',
    color: '#1A1D2E',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#8B92A8',
    lineHeight: '1.4'
  },
  alertError: {
    padding: '10px 14px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    color: '#DC2626',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#5A6178',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    backgroundColor: '#F8F9FC',
    border: '1px solid #E2E6EF',
    borderRadius: '10px',
    color: '#1A1D2E',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: 'border-color 0.2s'
  },
  button: {
    width: '100%',
    padding: '13px',
    fontSize: '14px',
    fontWeight: '700',
    backgroundColor: '#4338CA',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    letterSpacing: '-0.01em'
  }
};

export default LoginBack;