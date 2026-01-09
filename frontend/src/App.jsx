import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GamePage from './pages/GamePage';
// import LoginPage from './pages/LoginPage'; // TEMPORARIAMENTE DESATIVADO PARA TESTES
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Componente de rota protegida
// TEMPORARIAMENTE DESATIVADO PARA TESTES - permite acesso direto sem autenticação
const ProtectedRoute = ({ children }) => {
  // const token = localStorage.getItem('token');
  // return token ? children : <Navigate to="/login" />;
  // TEMPORÁRIO: Permitir acesso direto para testes
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            {/* TEMPORARIAMENTE DESATIVADO PARA TESTES */}
            {/* <Route path="/login" element={<LoginPage />} /> */}
            
            {/* Redirecionar /login para o jogo temporariamente */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
