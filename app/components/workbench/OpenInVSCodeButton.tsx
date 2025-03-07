// app/components/workbench/OpenInVSCodeButton.tsx
import { memo, useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { VSCodeService, VSCodeEnvironment } from '~/utils/vscode-service';

interface OpenInVSCodeButtonProps {
  className?: string;
}

export const OpenInVSCodeButton = memo(({ className }: OpenInVSCodeButtonProps) => {
  // Utiliser useStore pour s'abonner aux changements des fichiers
  const files = useStore(workbenchStore.files);
  const hasFiles = files && Object.keys(files).length > 0;
  const [isLoading, setIsLoading] = useState(false);

  const openInVSCode = useCallback(async () => {
    try {
      if (!files || Object.keys(files).length === 0) {
        toast.error('Aucun fichier à ouvrir dans VSCode');
        return;
      }
      
      setIsLoading(true);
      
      // Utiliser le service VSCode pour détecter l'environnement et ouvrir
      const environment = VSCodeService.detectEnvironment();
      
      // Afficher un toast informatif selon l'environnement
      const toastId = toast.loading('Préparation de l\'ouverture dans VS Code...');
      
      // Tentative d'ouverture
      const success = await VSCodeService.openInVSCode(files);
      
      if (success) {
        let message = '';
        
        switch (environment) {
          case VSCodeEnvironment.LOCAL:
            message = 'Ouverture du projet dans VS Code...';
            break;
          case VSCodeEnvironment.CODESPACES:
            message = 'Redirection vers GitHub Codespaces...';
            break;
          case VSCodeEnvironment.WEB:
            message = 'Projet téléchargé. Vous pouvez maintenant l\'ouvrir dans VS Code for Web';
            break;
          default:
            message = 'Tentative d\'ouverture dans VS Code...';
        }
        
        toast.update(toastId, {
          render: message,
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      } else {
        toast.update(toastId, {
          render: 'Impossible d\'ouvrir dans VS Code. Téléchargez le projet à la place.',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur s\'est produite');
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  // Ne pas afficher le bouton s'il n'y a pas de fichiers
  if (!hasFiles) {
    return null;
  }

  return (
    <button 
      className={`${className} flex items-center gap-1.5 bg-bolt-elements-item-backgroundAccent hover:brightness-110 text-white px-3 py-1.5 rounded-md transition-all duration-200 hover:shadow-md`}
      title="Ouvrir le projet dans VS Code"
      onClick={openInVSCode}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="i-svg-spinners:90-ring-with-bg text-xl"></div>
          <span className="text-sm font-medium">Ouverture...</span>
        </>
      ) : (
        <>
          <div className="i-ph:code-duotone text-xl"></div>
          <span className="text-sm font-medium">Ouvrir dans VSCode</span>
        </>
      )}
    </button>
  );
});