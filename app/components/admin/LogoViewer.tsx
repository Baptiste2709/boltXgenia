// app/components/admin/LogoViewer.tsx
import React, { useEffect, useState } from 'react';
import { getAllLogos, type LogoMetadata, deleteLogo } from '~/utils/logo-storage';
import { toast } from 'react-toastify';

interface LogoViewerProps {
  onSelectLogo?: (logo: LogoMetadata) => void;
}

export const LogoViewer: React.FC<LogoViewerProps> = ({ onSelectLogo }) => {
  const [logos, setLogos] = useState<LogoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les logos au montage du composant
  useEffect(() => {
    loadLogos();
  }, []);

  // Fonction pour charger les logos depuis IndexedDB
  const loadLogos = async () => {
    try {
      setLoading(true);
      const storedLogos = await getAllLogos();
      // Trier par date (plus récent en premier)
      storedLogos.sort((a, b) => b.timestamp - a.timestamp);
      setLogos(storedLogos);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des logos:', err);
      setError('Impossible de charger les logos depuis le stockage local');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un logo
  const handleDeleteLogo = async (id: string) => {
    try {
      await deleteLogo(id);
      toast.success('Logo supprimé avec succès');
      // Recharger la liste des logos
      loadLogos();
    } catch (err) {
      console.error('Erreur lors de la suppression du logo:', err);
      toast.error('Erreur lors de la suppression du logo');
    }
  };

  // Formater la date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Afficher un message de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-3xl"></div>
      </div>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="p-4 bg-bolt-elements-item-backgroundDanger text-bolt-elements-item-contentDanger rounded-md">
        <div className="flex items-center">
          <div className="i-ph:warning-circle-fill mr-2"></div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Afficher un message si aucun logo n'est trouvé
  if (logos.length === 0) {
    return (
      <div className="p-4 text-center text-bolt-elements-textTertiary">
        <div className="i-ph:image-square-duotone text-3xl mx-auto mb-2"></div>
        <p>Aucun logo n'a été trouvé dans le stockage local</p>
      </div>
    );
  }

  // Afficher la liste des logos
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
        Logos stockés ({logos.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logos.map((logo) => (
          <div 
            key={logo.id} 
            className="border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 overflow-hidden"
          >
            <div className="p-2 bg-bolt-elements-background-depth-3 flex justify-between items-center">
              <span className="text-sm text-bolt-elements-textSecondary truncate">{logo.filename}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => onSelectLogo?.(logo)}
                  className="p-1 text-bolt-elements-item-contentAccent hover:text-bolt-elements-item-contentActive"
                  title="Utiliser ce logo"
                >
                  <div className="i-ph:check-circle"></div>
                </button>
                <button
                  onClick={() => handleDeleteLogo(logo.id)}
                  className="p-1 text-bolt-elements-item-contentDanger hover:brightness-110"
                  title="Supprimer ce logo"
                >
                  <div className="i-ph:trash"></div>
                </button>
              </div>
            </div>
            
            <div className="p-4 flex justify-center bg-white">
              <img 
                src={logo.dataUrl} 
                alt={logo.filename} 
                className="max-h-32 object-contain"
              />
            </div>
            
            <div className="p-2 text-xs text-bolt-elements-textTertiary">
              <p className="truncate" title={logo.path}>
                <span className="font-medium">Chemin:</span> {logo.path}
              </p>
              <p>
                <span className="font-medium">Enregistré le:</span> {formatDate(logo.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoViewer;