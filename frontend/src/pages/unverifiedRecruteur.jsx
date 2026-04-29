import React, { useState, useEffect } from 'react'
import { getMyVerificationStatus } from '../services/recruteur.service'
import { uploadRecruteurDoc, deleteDocument } from '../services/document.service'

const VerificationPage = () => {
  const [status, setStatus]     = useState(null)  // 'enAttente' | 'valideParIA' | 'refuse'
  const [motif, setMotif]       = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getMyVerificationStatus()
      .then(data => {
        setStatus(data.etatValidation)
        setMotif(data.motifRefus)
        setDocuments(data.documents)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRemoveDoc = async (docId) => {
    try {
      await deleteDocument(docId)
      setDocuments(docs => docs.filter(d => d._id !== docId))
    } catch (err) {
      alert('Failed to remove document: ' + err.message)
    }
  }

  const handleAddDoc = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const typeDocument = prompt('Document type? (e.g. rc, nif, cni)') || 'other'
    setUploading(true)
    try {
      const newDoc = await uploadRecruteurDoc(file, typeDocument)
      setDocuments(docs => [newDoc, ...docs])
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-600">{error}</p>
    </div>
  )

  // Map backend states: treat 'enAttente' and 'valideParIA' as "pending" visually
  const isPending  = status === 'enAttente' || status === 'valideParIA'
  const isRejected = status === 'refuse'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">

        {/* PENDING */}
        {isPending && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
            {status === 'valideParIA' && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
                ✅ AI pre-check passed — awaiting final admin review.
              </p>
            )}
            <p className="text-gray-600 mb-6">
              Our team is reviewing your profile. This typically takes{' '}
              <span className="font-semibold">24 to 48 hours</span>.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                Submitted Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {documents.map(doc => (
                    <li key={doc._id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.nomFichier}</p>
                        {doc.typeDocument && (
                          <p className="text-xs text-gray-400 uppercase">{doc.typeDocument}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveDoc(doc._id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className={`px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? 'Uploading…' : 'Add More Documents'}
              <input type="file" className="hidden" onChange={handleAddDoc} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
            </label>
            <p className="text-xs text-gray-500 mt-4">
              *Adding or removing documents may restart your position in the review queue.
            </p>
          </div>
        )}

        {/* REJECTED */}
        {isRejected && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Unsuccessful</h2>
            <p className="text-gray-600 mb-6">
              We were unable to verify your recruiter account at this time.
            </p>

            {motif && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-left mb-6">
                <h3 className="text-sm font-bold text-red-800 mb-1">Reason for Rejection:</h3>
                <p className="text-sm text-red-700">{motif}</p>
              </div>
            )}

            <label className={`inline-block w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? 'Uploading…' : 'Update Documents & Re-apply'}
              <input type="file" className="hidden" onChange={handleAddDoc} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
            </label>
          </div>
        )}

      </div>
    </div>
  )
}

export default VerificationPage