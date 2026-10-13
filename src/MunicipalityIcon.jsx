import React from 'react'

export function MunicipalityIcon({ size = 15, className = '', color = 'currentColor', strokeWidth = 1.9 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`muni-vector-icon ${className}`}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <line x1="2" y1="22" x2="22" y2="22" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <path d="M4 11V7.5L12 3l8 4.5V11" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export default MunicipalityIcon
