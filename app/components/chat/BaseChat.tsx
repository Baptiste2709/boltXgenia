import type { Message } from 'ai';
import React, { useState, type RefCallback, useRef, useEffect, useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { useBranding } from '~/components/chat/BrandContext';
import { toast } from 'react-toastify';


import styles from './BaseChat.module.scss';


declare global {
  interface Window {
    fs?: {
      mkdir: (path: string) => Promise<void>;
      writeFile: (path: string, data: Uint8Array) => Promise<void>;
      stat: (path: string) => Promise<any>;
    };
    systemPrompt?: string;
  }
}

interface BrandingData {
  isEnabled: boolean;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Développer un site de gestion de projets pour étudiants en React' },
  { text: 'Créer un portfolio interactif avec Three.js' },
  { text: 'Crée le site vitrine de l\'école ECE, une école d\'ingénieur à Paris avec React' },
  { text: 'Concevoir une application mobile de suivi des habitudes avec React Native' },
];

const TEXTAREA_MIN_HEIGHT = 76;

async function extractWebsiteDesign(url: string) {
  try {
    // Fetch the website content through a proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const htmlContent = await response.text();

    // Create a temporary DOM to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Extract logo
    let logoUrl = null;
    const logoSelectors = [
      'link[rel="apple-touch-icon"]',
      'link[rel="icon"]',
      'meta[property="og:image"]',
      'img.logo',
      '#logo',
      '.logo'
    ];

    for (const selector of logoSelectors) {
      const logoElement = doc.querySelector(selector);
      if (logoElement) {
        logoUrl = logoElement.getAttribute('href') || logoElement.getAttribute('content') || logoElement.getAttribute('src');

        // Convert relative URLs to absolute
        if (logoUrl && !logoUrl.startsWith('http')) {
          const baseUrl = new URL(url).origin;
          logoUrl = new URL(logoUrl, baseUrl).href;
        }

        if (logoUrl) break;
      }
    }

    // Extract colors from stylesheets
    const colors: string[] = [];
    const colorSet = new Set<string>();

    // Extract inline styles and stylesheets
    const styles = doc.querySelectorAll('style, link[rel="stylesheet"]');

    styles.forEach(style => {
      let styleContent = '';

      if (style.tagName === 'STYLE') {
        styleContent = style.textContent || '';
      } else {
        // For external stylesheets, we'd need to fetch them
        // This is a simplification and might not work for all sites
        const href = style.getAttribute('href');
        if (href) {
          // Fetch stylesheet
          try {
            const stylesheetUrl = new URL(href, url).href;
            fetch(stylesheetUrl)
              .then(res => res.text())
              .then(cssText => {
                styleContent = cssText;
              });
          } catch (e) {
            console.error('Could not fetch stylesheet', e);
          }
        }
      }

      // Extract colors using regex
      const colorMatches = styleContent.match(/#[0-9A-Fa-f]{6}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+/g) || [];
      colorMatches.forEach(color => {
        if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
          colorSet.add(color.toLowerCase());
        }
      });
    });

    // Convert color set to array and limit to top 3
    const extractedColors = Array.from(colorSet).slice(0, 3);

    // Detect font
    let fontFamily = 'inter'; // default
    const bodyStyles = window.getComputedStyle(doc.body);
    const detectedFont = bodyStyles.getPropertyValue('font-family');
    if (detectedFont) {
      fontFamily = detectedFont.split(',')[0].replace(/['"]/g, '').toLowerCase();
    }

    return {
      logo: logoUrl,
      primaryColor: extractedColors[0] || '#3B82F6',
      secondaryColor: extractedColors[1] || '#10B981',
      accentColor: extractedColors[2] || '#F59E0B',
      fontFamily: fontFamily
    };
  } catch (error) {
    console.error('Error extracting website design:', error);
    throw new Error('Could not extract design information');
  }
}


export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {

    // Récupérer les données de branding depuis le stockage
    const brandingData = typeof window !== 'undefined' ?
      ((window as any).currentBrandingData ||
        JSON.parse(localStorage.getItem('brandingData') || '{"isEnabled":false}'))
      : { isEnabled: false };
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [showBrandingForm, setShowBrandingForm] = useState(false);
    const { branding, updateBranding } = useBranding();

    const primaryColorInputRef = useRef<HTMLInputElement>(null);
    const primaryColorTextRef = useRef<HTMLInputElement>(null);
    const secondaryColorInputRef = useRef<HTMLInputElement>(null);
    const secondaryColorTextRef = useRef<HTMLInputElement>(null);
    const accentColorInputRef = useRef<HTMLInputElement>(null);
    const accentColorTextRef = useRef<HTMLInputElement>(null);
    const fontFamilyRef = useRef<HTMLSelectElement>(null);

    // Effet pour masquer le formulaire pendant la génération
    useEffect(() => {
      if (isStreaming && showBrandingForm) {
        setShowBrandingForm(false);
      }
    }, [isStreaming]);

    useEffect(() => {
      if (showBrandingForm && branding.logo) {
        // Si le formulaire est ouvert et qu'un logo existe dans branding, l'afficher
        const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
        const uploadText = document.getElementById('logo-upload-text');

        if (imgPreview) {
          imgPreview.src = branding.logo;
          imgPreview.classList.remove('hidden');

          // Masquer le texte quand logo présent
          if (uploadText) {
            uploadText.classList.add('hidden');
          }
        }
      }
    }, [showBrandingForm, branding.logo]);

    useEffect(() => {
      updateBranding({ isCustomBranding: false });
    }, []);

    useEffect(() => {
      // Vérifier si nous sommes côté client
      if (typeof window !== 'undefined') {
        // Charger dynamiquement le script client uniquement
        const script = document.createElement('script');
        script.src = '/logo-saver.js'; // Nous créerons ce fichier plus tard
        script.async = true;
        document.body.appendChild(script);

        return () => {
          document.body.removeChild(script);
        };
      }
    }, []);

    const toggleCustomBranding = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      setShowBrandingForm(isChecked);
      updateBranding({ isCustomBranding: isChecked });
      event.target.closest('label')?.setAttribute('data-custom-branding', String(isChecked));
    };

    const handleColorChange = (type: 'primary' | 'secondary' | 'accent', value: string, isInput: boolean) => {
      if (isInput) {
        // Mise à jour du champ texte correspondant
        switch (type) {
          case 'primary':
            if (primaryColorTextRef.current) primaryColorTextRef.current.value = value;
            break;
          case 'secondary':
            if (secondaryColorTextRef.current) secondaryColorTextRef.current.value = value;
            break;
          case 'accent':
            if (accentColorTextRef.current) accentColorTextRef.current.value = value;
            break;
        }
      } else {
        // Mise à jour du champ couleur correspondant
        switch (type) {
          case 'primary':
            if (primaryColorInputRef.current) primaryColorInputRef.current.value = value;
            break;
          case 'secondary':
            if (secondaryColorInputRef.current) secondaryColorInputRef.current.value = value;
            break;
          case 'accent':
            if (accentColorInputRef.current) accentColorInputRef.current.value = value;
            break;
        }
      }
    };

    // Gestionnaire de drag & drop
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.add('border-bolt-elements-item-contentAccent');
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('border-bolt-elements-item-contentAccent');
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-bolt-elements-item-contentAccent');

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        // Traitement du fichier logo
        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
            const uploadText = document.getElementById('logo-upload-text');

            if (imgPreview && event.target?.result) {
              imgPreview.src = event.target.result as string;
              imgPreview.classList.remove('hidden');

              // Masquer le texte quand logo présent
              if (uploadText) {
                uploadText.classList.add('hidden');
              }
            }
          };
          reader.readAsDataURL(file);
        }
      }


    };

    const applyBrandingChanges = () => {
      const logoPreview = document.getElementById('logo-preview') as HTMLImageElement;
      // Vérifier si le logo est visible
      const logoSrc = logoPreview && !logoPreview.classList.contains('hidden') ? logoPreview.src : null;

      // Mettre à jour le branding
      const newBranding = {
        logo: logoSrc,
        primaryColor: primaryColorInputRef.current?.value || branding.primaryColor,
        secondaryColor: secondaryColorInputRef.current?.value || branding.secondaryColor,
        accentColor: accentColorInputRef.current?.value || branding.accentColor,
        fontFamily: fontFamilyRef.current?.value || branding.fontFamily,
        isCustomBranding: true
      };

      updateBranding(newBranding);

      // Afficher une confirmation
      toast.success('Charte graphique appliquée!');
    };

    const websiteInputRef = useRef<HTMLInputElement>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    const extractDesignFromWebsite = useCallback(async () => {
      const websiteUrl = websiteInputRef.current?.value;

      if (!websiteUrl) {
        toast.error('Veuillez entrer une URL valide');
        return;
      }

      setIsExtracting(true);
      try {
        const extractedDesign = await extractWebsiteDesign(websiteUrl);

        // Update branding with extracted design
        updateBranding({
          ...extractedDesign,
          isCustomBranding: true
        });

        // Update form inputs
        if (primaryColorInputRef.current)
          primaryColorInputRef.current.value = extractedDesign.primaryColor;
        if (secondaryColorInputRef.current)
          secondaryColorInputRef.current.value = extractedDesign.secondaryColor;
        if (accentColorInputRef.current)
          accentColorInputRef.current.value = extractedDesign.accentColor;
        if (fontFamilyRef.current)
          fontFamilyRef.current.value = extractedDesign.fontFamily;

        // Update logo preview if available
        if (extractedDesign.logo) {
          const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
          const uploadText = document.getElementById('logo-upload-text');

          if (imgPreview) {
            imgPreview.src = extractedDesign.logo;
            imgPreview.classList.remove('hidden');

            if (uploadText) {
              uploadText.classList.add('hidden');
            }
          }
        }

        // Show branding form and toast
        setShowBrandingForm(true);
        toast.success('Design extrait avec succès !');
      } catch (error) {
        toast.error('Impossible d\'extraire les informations de design');
      } finally {
        setIsExtracting(false);
      }
    }, [updateBranding]);


    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {/* Contenu principal conteneur */}
            <div className="flex flex-col items-center justify-center w-full h-full">
              {/* Titre et intro */}
              {!chatStarted && (
                <div id="intro" className="mt-[10vh] w-full max-w-chat mx-auto mb-2">
                  <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-1">
                    GenIA
                  </h1>
                  <p className="text-center text-bolt-elements-textSecondary">
                    Génialement simple, Simplement génial !
                  </p>
                </div>
              )}

              {/* Zone des messages */}
              <div className="w-full max-w-chat mx-auto flex flex-col flex-grow overflow-y-auto">
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        ref={messageRef}
                        className="flex flex-col w-full flex-1 px-4 pb-6 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                      />
                    ) : null;
                  }}
                </ClientOnly>
              </div>

              {/* Zone de saisie et formulaire de charte graphique dans un layout flexible */}
              <div className="w-full max-w-chat mx-auto z-prompt pb-4 relative">
                <div className="flex flex-col items-center">
                  {/* Textarea principal - toujours centré */}
                  <div className="shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden w-full">
                    <textarea
                      ref={textareaRef}
                      className="w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (event.shiftKey) return;
                          event.preventDefault();
                          sendMessage?.(event);
                        }
                      }}
                      value={input}
                      onChange={(event) => {
                        handleInputChange?.(event);
                      }}
                      style={{
                        minHeight: TEXTAREA_MIN_HEIGHT,
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder="Comment Genia peut vous aider ?"
                      translate="no"
                    />
                    <ClientOnly>
                      {() => (
                        <SendButton
                          show={input.length > 0 || isStreaming}
                          isStreaming={isStreaming}
                          onClick={(event) => {
                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }
                            sendMessage?.(event);
                          }}
                        />
                      )}
                    </ClientOnly>

                    {/* Section avec les boutons et conseils */}
                    <div className="flex justify-between text-sm p-4 pt-2">
                      <div className="flex gap-1 items-center">
                        <IconButton
                          title="Enhance prompt"
                          disabled={input.length === 0 || enhancingPrompt}
                          className={classNames({
                            'opacity-100!': enhancingPrompt,
                            'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!': promptEnhanced,
                          })}
                          onClick={() => enhancePrompt?.()}
                        >
                          {enhancingPrompt ? (
                            <>
                              <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl"></div>
                              <div className="ml-1.5">Enhancing prompt...</div>
                            </>
                          ) : (
                            <>
                              <div className="i-bolt:stars text-xl"></div>
                              {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                            </>
                          )}
                        </IconButton>
                      </div>
                      {input.length > 3 ? (
                        <div className="text-xs text-bolt-elements-textTertiary">
                          Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Toggle pour importer sa propre charte graphique */}
                  <div className="flex items-center pl-4 mt-2 mb-2 w-full">
                    <label className="relative inline-flex items-center cursor-pointer" data-custom-branding="false">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={toggleCustomBranding}
                        checked={branding.isCustomBranding}
                      />
                      <div className="w-11 h-6 bg-bolt-elements-borderColor peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bolt-elements-item-contentAccent"></div>
                      <span className="ml-3 text-sm text-bolt-elements-textSecondary">Importer sa propre charte graphique</span>
                    </label>
                  </div>
                </div>

                {/* Layout flexible pour le formulaire */}
                <div className={`fixed right-0 top-[10%] transform transition-all duration-300 z-50 ${showBrandingForm && !isStreaming ? 'translate-x-0' : 'translate-x-full'}`}>
                  {/* Formulaire de charte graphique */}
                  {showBrandingForm && !isStreaming && (
                    <div className="flex flex-col space-y-4 px-4 py-3 mx-4 mb-4 w-80 rounded-l-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor border-r-0 shadow-lg">
                      <div className="flex justify-between items-center border-b border-bolt-elements-borderColor pb-2 mb-2">
                        <h3 className="font-medium text-bolt-elements-textPrimary">Charte graphique</h3>
                        <button
                          className="text-bolt-elements-textSecondary bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textSecondary"
                          onClick={() => setShowBrandingForm(false)}
                        >
                          <div className="i-ph:x-circle"></div>
                        </button>
                      </div>
                      {/* Ajout du champ d'extraction de site web */}
                      <div className="flex flex-col mb-2">
                        <label className="text-sm text-bolt-elements-textSecondary mb-1">Extraire le design d'un site web</label>
                        <div className="flex items-center">
                          <input
                            ref={websiteInputRef}
                            type="url"
                            placeholder="Entrez l'URL du site"
                            className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-l-md text-bolt-elements-textPrimary"
                          />
                          <button
                            onClick={extractDesignFromWebsite}
                            disabled={isExtracting}
                            className="bg-bolt-elements-item-contentAccent text-white px-3 py-2 rounded-r-md hover:brightness-110 transition-all"
                          >
                            {isExtracting ? (
                              <div className="i-svg-spinners:3-dots-fade"></div>
                            ) : (
                              'Extraire'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Zone de drop pour le logo */}
                      <div className="flex flex-col">
                        <label className="text-sm text-bolt-elements-textSecondary mb-1">Logo</label>
                        <div
                          className="h-24 flex items-center justify-center border-2 border-dashed border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-1 transition-colors duration-150 cursor-pointer"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('logo-input')?.click()}
                        >
                          <input
                            id="logo-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const imgPreview = document.getElementById('logo-preview') as HTMLImageElement;
                                  const uploadText = document.getElementById('logo-upload-text');

                                  if (imgPreview && event.target?.result) {
                                    imgPreview.src = event.target.result as string;
                                    imgPreview.classList.remove('hidden');

                                    // Masquer le texte quand logo présent
                                    if (uploadText) {
                                      uploadText.classList.add('hidden');
                                    }
                                  }
                                };
                                reader.readAsDataURL(e.target.files[0]);
                              }
                            }}
                          />
                          <div className="flex flex-col items-center">
                            <img id="logo-preview" src="" alt="Logo preview" className="hidden max-h-20 mb-2" />
                            <div className="text-sm text-bolt-elements-textTertiary" id="logo-upload-text">
                              Glissez-déposez votre logo ou cliquez pour sélectionner
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sélecteurs de couleurs */}
                      <div className="flex flex-col">
                        <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur principale</label>
                        <div className="flex items-center">
                          <input
                            ref={primaryColorInputRef}
                            type="color"
                            defaultValue={branding.primaryColor}
                            className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                            onChange={(e) => handleColorChange('primary', e.target.value, true)}
                          />
                          <input
                            ref={primaryColorTextRef}
                            type="text"
                            defaultValue={branding.primaryColor}
                            className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                            onChange={(e) => handleColorChange('primary', e.target.value, false)}
                          />
                        </div>
                      </div>

                      {/* Couleur secondaire */}
                      <div className="flex flex-col">
                        <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur secondaire</label>
                        <div className="flex items-center">
                          <input
                            ref={secondaryColorInputRef}
                            type="color"
                            defaultValue={branding.secondaryColor}
                            className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                            onChange={(e) => handleColorChange('secondary', e.target.value, true)}
                          />
                          <input
                            ref={secondaryColorTextRef}
                            type="text"
                            defaultValue={branding.secondaryColor}
                            className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                            onChange={(e) => handleColorChange('secondary', e.target.value, false)}
                          />
                        </div>
                      </div>

                      {/* Couleur d'accent */}
                      <div className="flex flex-col">
                        <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur d'accent</label>
                        <div className="flex items-center">
                          <input
                            ref={accentColorInputRef}
                            type="color"
                            defaultValue={branding.accentColor}
                            className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                            onChange={(e) => handleColorChange('accent', e.target.value, true)}
                          />
                          <input
                            ref={accentColorTextRef}
                            type="text"
                            defaultValue={branding.accentColor}
                            className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                            onChange={(e) => handleColorChange('accent', e.target.value, false)}
                          />
                        </div>
                      </div>

                      {/* Sélecteur de police */}
                      <div className="flex flex-col">
                        <label className="text-sm text-bolt-elements-textSecondary mb-1">Police de caractères</label>
                        <select
                          ref={fontFamilyRef}
                          className="p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                          defaultValue={branding.fontFamily}
                        >
                          <option value="Inter">Inter (Par défaut)</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Raleway">Raleway</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Source Code Pro">Source Code Pro</option>
                          <option value="Merriweather">Merriweather</option>
                          <option value="Space Grotesk">Space Grotesk</option>
                        </select>
                      </div>

                      {/* Bouton d'application des changements */}
                      <div className="flex justify-end">
                        <ClientOnly>
                          {() => (
                            <button
                              className="px-4 py-2 bg-bolt-elements-item-contentAccent text-white rounded-md text-sm hover:bg-opacity-90 transition-colors"
                              onClick={applyBrandingChanges}
                            >
                              Appliquer les changements
                            </button>
                          )}
                        </ClientOnly>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exemples de prompts */}
              {!chatStarted && (
                <div id="examples" className="w-full max-w-chat mx-auto mb-30">
                  <div className="flex flex-col space-y-2">
                    {EXAMPLE_PROMPTS.map((examplePrompt, index) => {
                      return (
                        <button
                          key={index}
                          onClick={(event) => {
                            sendMessage?.(event, examplePrompt.text);
                          }}
                          className="group flex items-center w-full gap-2 justify-start bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-theme"
                        >
                          <div className="i-ph:arrow-bend-down-left" />
                          {examplePrompt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);