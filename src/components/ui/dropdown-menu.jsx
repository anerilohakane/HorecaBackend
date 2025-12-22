'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
export function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {React.Children.map(children, (child) => {
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) });
        }
        return child;
      })}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {React.Children.map(children, (child) => {
            if (child.type !== DropdownMenuTrigger) {
              return child;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuTrigger({ children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className = '' }) {
  return (
    <div className={`py-1 ${className}`} role="menu">
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      role="menuitem"
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children, className = '' }) {
  return (
    <div className={`px-4 py-2 text-sm font-semibold text-gray-900 ${className}`}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return (
    <div className={`my-1 h-px bg-gray-200 ${className}`} />
  );
}