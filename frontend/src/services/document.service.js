const API = import.meta.env.VITE_API_URL // or however you configure your base URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

/**
 * Upload a recruiter verification document.
 * @param {File}   file        - The file object from an <input type="file">
 * @param {string} typeDocument - e.g. "rc", "nif", "cni"
 */
export const uploadRecruteurDoc = async (file, typeDocument) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'docrecruteur')
  formData.append('typeDocument', typeDocument)
  // idRecruteur is derived from the JWT on the backend — don't send it

  const res = await fetch(`${API}/api/documents/upload`, {
    method: 'POST',
    headers: authHeaders(), // NOTE: don't set Content-Type; browser sets multipart boundary
    body: formData,
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

/**
 * Get a secure URL to view/download a file by its GridFS fileId.
 * Returns the fetch Response so you can pipe it to a blob URL.
 */
export const getDocumentFile = async (fileId) => {
  const res = await fetch(`${API}/api/documents/file/${fileId}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Could not load document')
  return res // caller does: URL.createObjectURL(await res.blob())
}

/**
 * Delete a document by its Document _id.
 */
export const deleteDocument = async (docId) => {
  const res = await fetch(`${API}/api/documents/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}