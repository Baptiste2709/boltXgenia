// app/components/workbench/PortDropdown.tsx
import { memo, useEffect, useRef } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { PreviewInfo } from '~/lib/stores/previews';

interface PortDropdownProps {
  activePreviewIndex: number;
  setActivePreviewIndex: (index: number) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (value: boolean) => void;
  setHasSelectedPreview: (value: boolean) => void;
  previews: PreviewInfo[];
}

export const PortDropdown = memo(
  ({
    activePreviewIndex,
    setActivePreviewIndex,
    isDropdownOpen,
    setIsDropdownOpen,
    setHasSelectedPreview,
    previews,
  }: PortDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Si aucun aperçu n'est disponible, ne rien afficher
    if (previews.length === 0) {
      return null;
    }

    // Trier les aperçus par port tout en préservant l'index original
    const sortedPreviews = previews
      .map((previewInfo, index) => ({ ...previewInfo, index }))
      .sort((a, b) => a.port - b.port);

    // Fermer le menu déroulant si l'utilisateur clique en dehors
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      if (isDropdownOpen) {
        window.addEventListener('mousedown', handleClickOutside);
      } else {
        window.removeEventListener('mousedown', handleClickOutside);
      }

      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isDropdownOpen, setIsDropdownOpen]);

    return (
      <div className="relative z-port-dropdown" ref={dropdownRef}>
        <IconButton 
          icon="i-ph:plug" 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
          title="Sélectionner un port"
        />
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded shadow-sm min-w-[140px] dropdown-animation">
            <div className="px-4 py-2 border-b border-bolt-elements-borderColor text-sm font-semibold text-bolt-elements-textPrimary">
              Ports disponibles
            </div>
            {sortedPreviews.map((preview) => (
              <div
                key={preview.port}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-bolt-elements-item-backgroundActive"
                onClick={() => {
                  setActivePreviewIndex(preview.index);
                  setIsDropdownOpen(false);
                  setHasSelectedPreview(true);
                }}
              >
                <span
                  className={
                    activePreviewIndex === preview.index
                      ? 'text-bolt-elements-item-contentAccent'
                      : 'text-bolt-elements-item-contentDefault group-hover:text-bolt-elements-item-contentActive'
                  }
                >
                  Port {preview.port}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);