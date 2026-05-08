import React, { useState, useEffect, useRef } from 'react'
import { getMyVerificationStatus } from '../services/recruteur.service'
import { uploadRecruteurDoc, deleteDocument } from '../services/document.service'

const DOC_TYPES = [
  { value: 'rc',          label: 'RC',          desc: 'Registre du Commerce' },
  { value: 'nif',         label: 'NIF',         desc: 'Numéro d\'Identification Fiscale' },
  { value: 'cni',         label: 'CNI',         desc: 'Carte Nationale d\'Identité' },
  { value: 'statuts',     label: 'Statuts',     desc: 'Statuts de société' },
  { value: 'attestation', label: 'Attestation', desc: 'Attestation fiscale' },
  { value: 'autre',       label: 'Autre',       desc: 'Other' },
]

/* ── Upload Modal ─────────────────────────────────────────────────────────── */
const UploadModal = ({ file, onConfirm, onCancel, uploading }) => {
  const [docType, setDocType] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'modalIn .18s cubic-bezier(.34,1.56,.64,1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">Upload Document</h3>
              <p className="text-xs text-slate-400 truncate max-w-[260px]">{file?.name}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Document type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10
                         text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition cursor-pointer"
            >
              <option value="" disabled>Select a document type…</option>
              {DOC_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.desc}
                </option>
              ))}
            </select>
            {/* custom chevron */}
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </span>
          </div>

          {docType && (
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {DOC_TYPES.find(t => t.value === docType)?.desc}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600
                       hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            disabled={!docType || uploading}
            onClick={() => onConfirm(docType)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white
                       hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition
                       flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Uploading…
              </>
            ) : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
const VerificationPage = () => {
  const [status,    setStatus]    = useState(null)
  const [motif,     setMotif]     = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const [pendingFile, setPendingFile] = useState(null)   // file waiting for type selection
  const fileInputRef = useRef(null)

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

  const triggerFilePicker = () => fileInputRef.current?.click()

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    // reset so same file can be re-picked if modal is cancelled
    e.target.value = ''
  }

  const handleModalConfirm = async (docType) => {
    setUploading(true)
    try {
      const newDoc = await uploadRecruteurDoc(pendingFile, docType)
      setDocuments(docs => [newDoc, ...docs])
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setPendingFile(null)
    }
  }

  const handleModalCancel = () => setPendingFile(null)

  const handleRemoveDoc = async (docId) => {
    try {
      await deleteDocument(docId)
      setDocuments(docs => docs.filter(d => d._id !== docId))
    } catch (err) {
      alert('Failed to remove document: ' + err.message)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-red-600">{error}</p>
    </div>
  )

  const isPending  = status === 'enAttente' || status === 'valideParIA'
  const isRejected = status === 'refuse'

  return (
    <>
      {/* hidden file input shared across all triggers */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={handleFileChosen}
      />

      {/* Upload modal */}
      {pendingFile && (
        <UploadModal
          file={pendingFile}
          uploading={uploading}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">

          {/* ── PENDING ── */}
          {isPending && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 mb-6">
                <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Pending</h2>
              {status === 'valideParIA' && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  AI pre-check passed — awaiting final admin review.
                </p>
              )}
              <p className="text-slate-500 mb-6">
                Our team is reviewing your profile. This typically takes{' '}
                <span className="font-semibold text-slate-700">24 to 48 hours</span>.
              </p>

              {/* Documents list */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Submitted Documents
                </h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-400">No documents uploaded yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {documents.map(doc => (
                      <DocRow key={doc._id} doc={doc} onRemove={handleRemoveDoc}/>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={triggerFilePicker}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300
                           text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add More Documents
              </button>
              <p className="text-xs text-slate-400 mt-4">
                * Adding or removing documents may restart your position in the review queue.
              </p>
            </div>
          )}

          {/* ── REJECTED ── */}
          {isRejected && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Unsuccessful</h2>
              <p className="text-slate-500 mb-6">
                We were unable to verify your recruiter account at this time.
              </p>

              {motif && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-left mb-6">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">
                    Reason for Rejection
                  </h3>
                  <p className="text-sm text-red-700">{motif}</p>
                </div>
              )}

              <button
                onClick={triggerFilePicker}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600
                           text-base font-semibold text-white hover:bg-blue-700 shadow-sm transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Update Documents & Re-apply
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Modal animation keyframe */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

/* ── Doc Row ──────────────────────────────────────────────────────────────── */
const DocRow = ({ doc, onRemove }) => {
  const typeInfo = DOC_TYPES.find(t => t.value === doc.typeDocument)
  return (
    <li className="py-3 flex justify-between items-center gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{doc.nomFichier}</p>
          {typeInfo && (
            <p className="text-xs text-slate-400">{typeInfo.label} · {typeInfo.desc}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(doc._id)}
        className="flex-shrink-0 text-xs font-medium text-red-500 hover:text-red-700 transition
                   px-2.5 py-1 rounded-lg hover:bg-red-50"
      >
        Remove
      </button>
    </li>
  )
}

export default VerificationPage