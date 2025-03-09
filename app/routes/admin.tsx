// app/routes/admin.tsx
import { Outlet, Link } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import AdminMenu from '~/components/admin/AdminMenu';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-bolt-elements-background-depth-1">
      <ClientOnly>
        {() => <AdminMenu className="w-64 min-h-screen flex flex-col" />}
      </ClientOnly>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-bolt-elements-textPrimary hover:text-bolt-elements-item-contentAccent">
              <img src="/1.png" alt="Logo" className="h-10" />
            </Link>
            <div className="ml-4 text-sm text-bolt-elements-textSecondary">
              Console d'administration
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary flex items-center gap-1"
            >
              <div className="i-ph:chat-centered-text"></div>
              <span>Retour à l'application</span>
            </Link>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        
        <footer className="bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor px-6 py-3 text-center text-sm text-bolt-elements-textTertiary">
          Genia - Administration © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}