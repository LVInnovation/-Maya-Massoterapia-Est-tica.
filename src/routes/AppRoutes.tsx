import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Admin from '../pages/Admin'
import Agenda from '../pages/Agenda.tsx'
import MeusAgendamentos from '../pages/MeusAgendamentos'
import Login from '../pages/Login'
import Notificacoes from '../pages/Notificacoes'

const isAuthenticated = () => sessionStorage.getItem('maya_auth') === 'true'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/meus-agendamentos" element={<MeusAgendamentos />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agenda"
        element={
          <ProtectedRoute>
            <Agenda />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notificacoes"
        element={
          <ProtectedRoute>
            <Notificacoes />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes