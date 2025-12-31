import React from 'react';

export const USFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className={className}
    role="img"
    aria-label="United States Flag"
  >
    <path fill="#bd3d44" d="M0 0h640v480H0" />
    <path stroke="#fff" strokeWidth="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" />
    <path fill="#192f5d" d="M0 0h364.8v258.5H0" />
    <marker id="us-star" markerHeight="30" markerWidth="30">
      <path fill="#fff" d="M16.2 0L20 11.4h11.9L22.3 18.4l3.6 11.4-9.7-7-9.7 7 3.6-11.4L.4 11.4h11.9z" />
    </marker>
    <pattern id="us-stars" width="51.4" height="49" x="18" y="15.8" patternUnits="userSpaceOnUse">
      <use href="#us-star" />
    </pattern>
    <path fill="url(#us-stars)" d="M0 0h364.8v258.5H0" />
    <path fill="url(#us-stars)" d="M25.7 24.5h364.8v258.5H25.7"  transform="translate(25.7, 24.5)"/>
    {/* Simplified stars for reasonable size/complexity balance if pattern fails or for cleaner jsx */}
    <g fill="#fff">
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(15,15) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(65,15) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(115,15) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(165,15) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(215,15) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(265,15) scale(1.2)" />

        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(40,40) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(90,40) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(140,40) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(190,40) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(240,40) scale(1.2)" />
        
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(15,65) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(65,65) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(115,65) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(165,65) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(215,65) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(265,65) scale(1.2)" />

        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(40,90) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(90,90) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(140,90) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(190,90) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(240,90) scale(1.2)" />
        
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(15,115) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(65,115) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(115,115) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(165,115) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(215,115) scale(1.2)" />
        <path d="M18 13l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" transform="translate(265,115) scale(1.2)" />
    </g>
  </svg>
);

export const ESFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    className={className}
    role="img"
    aria-label="Spain Flag"
  >
    <path fill="#aa151b" d="M0 0h640v480H0z" />
    <path fill="#f1bf00" d="M0 120h640v240H0z" />
    <g transform="translate(200, 240) scale(0.6)">
        <path fill="#aa151b" d="M-50-60h100v120h-100z"/>
        <circle fill="#f1bf00" cx="0" cy="0" r="30"/>
    </g>
  </svg>
);
