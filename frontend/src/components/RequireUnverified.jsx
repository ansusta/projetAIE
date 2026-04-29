import { Navigate } from 'react-router-dom'

export default function RequireUnverified({ children }) {
  const etat = localStorage.getItem('etatValidation')
  if (etat === 'valideParAdmin') return <Navigate to="/recruiter-dashboard" replace />
  return children
}