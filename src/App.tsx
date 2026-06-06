import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage }         from './pages/LoginPage';
import { FrontLayout }       from './pages/FrontLayout';
import { BackofficeLayout }  from './pages/BackofficeLayout';
import { DashboardPage }     from './pages/DashboardPage';
import { TicketsAdminPage }  from './pages/TicketsAdminPage';
import { ImportPage }        from './pages/ImportPage';
import { ResetPage }         from './pages/ResetPage';
import { ElementsPage }      from './pages/ElementsPage';
import { CreateTicketPage }  from './pages/CreateTicketPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Frontoffice (public) ── */}
          <Route path="/" element={<FrontLayout />}>
            <Route index element={<Navigate to="/elements" replace />} />
            <Route path="elements"    element={<ElementsPage />} />
            <Route path="tickets/new" element={<CreateTicketPage />} />
          </Route>

          {/* ── Login ── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Backoffice (protégé) ── */}
          <Route
            path="/backoffice"
            element={<ProtectedRoute><BackofficeLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/backoffice/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tickets"   element={<TicketsAdminPage />} />
            <Route path="import"    element={<ImportPage />} />
            <Route path="reset"     element={<ResetPage />} />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/elements" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
