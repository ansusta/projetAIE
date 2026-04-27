const API = import.meta.env.VITE_API_URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
})

/**
 * Fetch the logged-in recruiter's verification status + their submitted docs.
 * Returns: { etatValidation, motifRefus, documents[] }
 */
export const getMyVerificationStatus = async () => {
  const res = await fetch(`${API}/api/documents/recruteur/status`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}