import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2 cursor-pointer">
      {/* The Icon: A stylized "M" or "Match" icon using shapes */}
      <div className="relative w-9 h-9 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg rotate-3 shadow-md"></div>
        <div className="relative text-white font-black text-xl">M</div>
      </div>
      
      {/* The Text */}
      <span className="text-2xl font-bold tracking-tight text-gray-900">
        Match<span className="text-brand-blue">Talent</span>
      </span>
    </div>
  );
};

export default Logo;