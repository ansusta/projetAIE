import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText, 
  Edit2, 
  Download,
  Save,
  X
} from 'lucide-react';

export default function ProfileTab() {
  // 1. We added state to toggle between viewing and editing
  const [isEditing, setIsEditing] = useState(false);

  // 2. We moved the mock data into state so it can be updated
  const [candidate, setCandidate] = useState({
    firstName: "Sarah",
    lastName: "Lambert",
    title: "Développeuse Frontend React",
    email: "sarah.lambert@email.com",
    phone: "+33 6 12 34 56 78",
    location: "Paris, France",
    bio: "Développeuse passionnée par la création d'interfaces utilisateur intuitives et performantes. Plus de 3 ans d'expérience avec l'écosystème React et Tailwind CSS. J'aime résoudre des problèmes complexes et optimiser l'expérience utilisateur.",
    // We store skills as a single string to make editing easier in a text input
    skills: "React, JavaScript, Tailwind CSS, Figma, Git, Redux", 
  });

  // Handle changes in our input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCandidate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle saving the form
  const handleSave = () => {
    // In a real app, you would send the data to your backend API here
    console.log("Saving candidate data:", candidate);
    setIsEditing(false); // Switch back to read-only view
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mon Profil</h2>
          <p className="text-slate-500">Gérez vos informations et votre CV</p>
        </div>
        
        {/* Toggle Buttons based on state */}
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Modifier le profil
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
              <User className="w-16 h-16" />
            </div>
            
            {!isEditing ? (
              // READ-ONLY VIEW
              <>
                <h3 className="text-xl font-bold text-slate-900">
                  {candidate.firstName} {candidate.lastName}
                </h3>
                <p className="text-blue-600 font-medium mb-4">{candidate.title}</p>
                
                <div className="w-full h-px bg-slate-100 mb-4"></div>
                
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{candidate.location}</span>
                  </div>
                </div>
              </>
            ) : (
              // EDIT VIEW
              <div className="w-full space-y-4 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Prénom</label>
                    <input type="text" name="firstName" value={candidate.firstName} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Nom</label>
                    <input type="text" name="lastName" value={candidate.lastName} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Titre professionnel</label>
                  <input type="text" name="title" value={candidate.title} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                </div>
                <div className="w-full h-px bg-slate-100 my-4"></div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                  <input type="email" name="email" value={candidate.email} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Téléphone</label>
                  <input type="text" name="phone" value={candidate.phone} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Localisation</label>
                  <input type="text" name="location" value={candidate.location} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none" />
                </div>
              </div>
            )}
          </div>

          {/* CV Document Card (Remains mostly static for now) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Mon CV
            </h4>
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">CV_Sarah_Lambert.pdf</p>
                  <p className="text-xs text-slate-500">Mis à jour il y a 2 jours</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-blue-600 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bio & Skills */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Me */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              À propos de moi
            </h4>
            {!isEditing ? (
              <p className="text-slate-600 leading-relaxed">
                {candidate.bio}
              </p>
            ) : (
              <textarea 
                name="bio"
                value={candidate.bio}
                onChange={handleChange}
                rows="5"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-600"
              />
            )}
          </div>

          {/* Skills Tags */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Compétences clés
            </h4>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {/* We split the string back into an array to render the pretty tags */}
                {candidate.skills.split(',').map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Séparez vos compétences par des virgules</label>
                <input 
                  type="text" 
                  name="skills"
                  value={candidate.skills}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-600"
                  placeholder="ex: React, Node.js, Design UI"
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}