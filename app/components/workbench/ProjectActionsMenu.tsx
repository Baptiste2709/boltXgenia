// app/components/workbench/ProjectActionsMenu.tsx
import { memo, useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { toast } from 'react-toastify';
import { VSCodeService } from '~/utils/vscode-service';
import { ZipService } from '~/utils/zip-service';
import { classNames } from '~/utils/classNames';

interface ProjectActionsMenuProps {
  className?: string;
  showIcon?: boolean;
}

export const ProjectActionsMenu = memo(({ className, showIcon = true }: ProjectActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const files = useStore(workbenchStore.files);
  const hasFiles = files && Object.keys(files).length > 0;
  
  // Gestion du clic extérieur pour fermer le menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Ne pas afficher si aucun fichier n'est disponible
  if (!hasFiles) {
    return null;
  }
  
  // Actions du menu
  const openInVSCode = async () => {
    try {
      // D'abord télécharger le projet
      const toastId = toast.loading('Téléchargement du projet...');
      
      // Télécharger en ZIP
      await ZipService.downloadProjectAsZip(files, 'genia-project');
      
      // Mettre à jour le toast
      toast.update(toastId, {
        render: 'Projet téléchargé, tentative d\'ouverture de VS Code...',
        type: 'info',
        isLoading: true
      });
      
      // Petite pause pour s'assurer que le téléchargement est bien géré
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Maintenant tenter d'ouvrir VS Code
      window.open('vscode://', '_blank');
      
      // Mettre à jour le toast final
      toast.update(toastId, {
        render: 'Veuillez extraire le ZIP et ouvrir le dossier dans VS Code',
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
    } catch (error) {
      toast.error('Une erreur s\'est produite');
      console.error(error);
    }
    
    setIsOpen(false);
  };
  
  const downloadAsZip = async () => {
    try {
      const toastId = toast.loading('Préparation du téléchargement...');
      await ZipService.downloadProjectAsZip(files, 'genia-project');
      
      toast.update(toastId, {
        render: 'Projet téléchargé avec succès',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
      console.error(error);
    }
    
    setIsOpen(false);
  };
  
  const gitHubGistExport = () => {
    toast.info('Export vers GitHub Gist à venir...');
    setIsOpen(false);
  };
  
  const openInFiddle = () => {
    toast.info('Ouverture dans JS Fiddle à venir...');
    setIsOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        className="flex items-center gap-1 bg-bolt-elements-item-backgroundAccent text-sm text-white px-3 py-1.5 rounded-xl hover:brightness-110 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {showIcon && <div className="i-ph:dots-three-vertical text-lg" />}
        <span>Actions du projet</span>
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor z-50"
        >
          <div className="py-1 divide-y divide-bolt-elements-borderColor">
            <div className="px-4 py-2 text-sm font-semibold text-white">
              Options de projet
            </div>
            
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive"
                onClick={downloadAsZip}
              >
                <div className="i-ph:file-zip-duotone mr-2" />
                Télécharger en ZIP
              </button>
            </div>
            
            <div className="py-1 border-t border-bolt-elements-borderColor">
              <div className="px-4 py-1 text-xs text-bolt-elements-textSecondary uppercase">
                Fonctionnalités à venir
              </div>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textSecondary bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive"
                onClick={openInVSCode}
              >
                <div className="i-ph:code-duotone mr-2" />
                Ouvrir VS Code
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textSecondary bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive"
                onClick={gitHubGistExport}
              >
                <div className="i-ph:github-logo-duotone mr-2" />
                Exporter vers GitHub Gist
              </button>
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textSecondary bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive"
                onClick={openInFiddle}
              >
                <div className="i-ph:browser-duotone mr-2" />
                Ouvrir dans JS Fiddle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});