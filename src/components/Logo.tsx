import React from "react";

const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => {
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg text-white font-bold text-lg`}
    >
      <span className="text-2xl">RM</span>
    </div>
  );
};

export default Logo;
