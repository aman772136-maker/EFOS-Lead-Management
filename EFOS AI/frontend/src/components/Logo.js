import React from 'react';

export default function Logo({ size = '100%' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Outer red circle/ring */}
      <circle cx="50" cy="50" r="38" stroke="#ff0033" strokeWidth="8" fill="none" />
      
      {/* Inner open black circle (arc) */}
      <path d="M 36 33 A 21 21 0 1 0 64 33" stroke="#111827" strokeWidth="7" strokeLinecap="round" fill="none" />
      
      {/* Red Key in the center */}
      {/* Key head/loop */}
      <circle cx="50" cy="36" r="4.5" stroke="#ff0033" strokeWidth="3" fill="none" />
      {/* Key shaft */}
      <line x1="50" y1="40.5" x2="50" y2="58" stroke="#ff0033" strokeWidth="3.5" strokeLinecap="round" />
      {/* Key teeth pointing left */}
      <line x1="50" y1="47" x2="44" y2="47" stroke="#ff0033" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="53" x2="44" y2="53" stroke="#ff0033" strokeWidth="3" strokeLinecap="round" />
      
      {/* Cursor pointer at bottom right */}
      <path d="M 64 64 L 70 88 L 76 81 L 86 91 L 91 86 L 81 76 L 88 70 Z" fill="white" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
