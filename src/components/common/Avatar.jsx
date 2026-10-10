import React, { useState } from 'react';

export const Avatar = ({ name = 'User', src = '', online, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const badgeSize = {
    sm: 'w-2.5 h-2.5 border-1.5',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  };

  // Generate deterministic gradient background based on name
  const getGradient = (str) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover shadow-xs border border-slate-200/80`}
        />
      ) : (
        <div
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr ${getGradient(
            name
          )} text-white font-semibold flex items-center justify-center shadow-xs`}
        >
          {getInitials(name)}
        </div>
      )}

      {typeof online === 'boolean' && (
        <span
          className={`absolute bottom-0 right-0 ${
            badgeSize[size] || badgeSize.md
          } rounded-full border-white ${
            online ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
