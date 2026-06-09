import React from 'react';

/**
 * Shared Input components for forms.
 */

export const TextInput = ({ label, placeholder, error, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="caption text-text-sub block">
        {label}
      </label>
    )}
    <input
      type="text"
      placeholder={placeholder}
      className={`w-full bg-brand-white px-6 py-4 text-sm text-text-main outline-none border border-brand-border focus:border-brand-accent transition-all font-body ${error ? 'border-red-500' : ''}`}
      {...props}
    />
    {error && <p className="text-[10px] text-red-500 uppercase tracking-widest">{error}</p>}
  </div>
);

export const SearchInput = ({ placeholder = 'Search...', className = '', ...props }) => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      placeholder={placeholder}
      className="w-full bg-brand-surface/50 backdrop-blur-sm px-12 py-4 text-sm text-text-main outline-none border border-brand-border focus:border-brand-accent transition-all font-body"
      {...props}
    />
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  </div>
);

export const TextArea = ({ label, placeholder, error, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="caption text-text-sub block">
        {label}
      </label>
    )}
    <textarea
      placeholder={placeholder}
      className={`w-full bg-white px-6 py-4 text-sm text-text-main outline-none border border-brand-border focus:border-brand-accent transition-all font-body min-h-[150px] resize-none ${error ? 'border-red-500' : ''}`}
      {...props}
    />
    {error && <p className="text-[10px] text-red-500 uppercase tracking-widest">{error}</p>}
  </div>
);

