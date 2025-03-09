// app/components/admin/AdminMenu.tsx
import React from 'react';
import { Link, useLocation } from '@remix-run/react';

interface AdminMenuProps {
  className?: string;
}

export const AdminMenu: React.FC<AdminMenuProps> = ({ className }) => {
  const location = useLocation();
  
  // Liste des pages d'administration
  const adminPages = [
    { path: '/admin/logos', label: 'Gestion des logos', icon: 'i-ph:image-square-duotone' },
    // Ajoutez d'autres pages d'administration ici au besoin
  ];
  
  return (
    <div className={`bg-bolt-elements-background-depth-2 border-r border-bolt-elements-borderColor ${className}`}>
      <div className="p-4 border-b border-bolt-elements-borderColor">
        <h2 className="font-medium text-xl text-bolt-elements-textPrimary">Administration</h2>
        <p className="text-sm text-bolt-elements-textTertiary">Gestion de Genia</p>
      </div>
      
      <nav className="p-2">
        <ul className="space-y-1">
          {adminPages.map((page) => (
            <li key={page.path}>
              <Link 
                to={page.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  location.pathname === page.path 
                    ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent' 
                    : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive hover:text-bolt-elements-textPrimary'
                }`}
              >
                <div className={page.icon}></div>
                <span>{page.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto p-4 border-t border-bolt-elements-borderColor">
        <Link 
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
        >
          <div className="i-ph:arrow-left"></div>
          <span>Retour à l'application</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminMenu;