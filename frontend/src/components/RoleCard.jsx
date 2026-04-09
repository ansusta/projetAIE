const RoleCard = ({ title, description, icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center group"
    >
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
        {/* You can drop your Figma icons here */}
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
};

export default RoleCard;