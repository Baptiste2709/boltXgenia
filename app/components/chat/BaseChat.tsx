import type { Message } from 'ai';
import React, { useState, type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';

import styles from './BaseChat.module.scss';


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
  { text: 'Mettre en place un site de révision collaboratif avec Next.js' },
  { text: 'Concevoir une application mobile de suivi des habitudes avec React Native' },
  { text: 'Comment intégrer une base de données Firebase dans une application web ?' },
];


const TEXTAREA_MIN_HEIGHT = 76;


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
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const toggleCustomBranding = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      const formElement = document.getElementById('branding-form');
      if (formElement) {
        if (isChecked) {
          formElement.classList.remove('hidden');
          formElement.classList.add('flex');
        } else {
          formElement.classList.add('hidden');
          formElement.classList.remove('flex');
        }
      }
      event.target.closest('label')?.setAttribute('data-custom-branding', String(isChecked));
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
            if (imgPreview && event.target?.result) {
              imgPreview.src = event.target.result as string;
              imgPreview.classList.remove('hidden');
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };

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
            {!chatStarted && (
              <div id="intro" className="mt-[26vh] max-w-chat mx-auto">
                <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-2">
                  GenIA
                </h1>
                <p className="mb-4 text-center text-bolt-elements-textSecondary">
                  Génialement simple, Simplement génial !
                </p>
              </div>
            )}
            <div
              className={classNames('pt-6 px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat px-4 pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('relative w-full max-w-chat mx-auto z-prompt', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <div
                  className={classNames(
                    'shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className={`w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

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
                  <div className="flex justify-between text-sm p-4 pt-2">
                    <div className="flex gap-1 items-center">
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames({
                          'opacity-100!': enhancingPrompt,
                          'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
                            promptEnhanced,
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
                    <div className="flex justify-between text-sm p-4 pt-2">
  <div className="flex gap-1 items-center">
    <IconButton
      title="Enhance prompt"
      disabled={input.length === 0 || enhancingPrompt}
      className={classNames({
        'opacity-100!': enhancingPrompt,
        'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
          promptEnhanced,
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

  {/* Toggle pour importer sa propre charte graphique */}
  <div className="flex items-center pl-4 mb-2">
  <label className="relative inline-flex items-center cursor-pointer" data-custom-branding="false">
    <input 
      type="checkbox" 
      className="sr-only peer" 
      onChange={toggleCustomBranding}
    />
    <div className="w-11 h-6 bg-bolt-elements-borderColor peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bolt-elements-item-contentAccent"></div>
    <span className="ml-3 text-sm text-bolt-elements-textSecondary">Importer sa propre charte graphique</span>
  </label>
</div>
<div id="branding-form" className="hidden flex-col space-y-4 px-4 py-3 mx-4 mb-4 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor transition-all duration-300">
            {/* Zone de drop pour le logo */}
            <div className="flex flex-col">
              <label className="text-sm text-bolt-elements-textSecondary mb-1">Logo de votre entreprise</label>
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
                        if (imgPreview && event.target?.result) {
                          imgPreview.src = event.target.result as string;
                          imgPreview.classList.remove('hidden');
                        }
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center">
                  <img id="logo-preview" src="" alt="Logo preview" className="hidden max-h-20 mb-2" />
                  <div className="text-sm text-bolt-elements-textTertiary">Glissez-déposez votre logo ou cliquez pour sélectionner</div>
                </div>
              </div>
            </div>
            
            {/* Sélecteurs de couleurs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Couleur principale */}
              <div className="flex flex-col">
                <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur principale</label>
                <div className="flex items-center">
                  <input 
                    type="color" 
                    defaultValue="#3B82F6" 
                    className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    defaultValue="#3B82F6" 
                    className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                  />
                </div>
              </div>
              
              {/* Couleur secondaire */}
              <div className="flex flex-col">
                <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur secondaire</label>
                <div className="flex items-center">
                  <input 
                    type="color" 
                    defaultValue="#10B981" 
                    className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    defaultValue="#10B981" 
                    className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                  />
                </div>
              </div>
              
              {/* Couleur tertiaire */}
              <div className="flex flex-col">
                <label className="text-sm text-bolt-elements-textSecondary mb-1">Couleur d'accent</label>
                <div className="flex items-center">
                  <input 
                    type="color" 
                    defaultValue="#F59E0B" 
                    className="w-10 h-10 p-0 border-none rounded-md mr-2 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    defaultValue="#F59E0B" 
                    className="flex-grow p-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary"
                  />
                </div>
              </div>
            </div>
            
            {/* Bouton d'application des changements */}
            <div className="flex justify-end">
              <button 
                className="px-4 py-2 bg-bolt-elements-item-contentAccent text-white rounded-md text-sm hover:bg-opacity-90 transition-colors"
                onClick={() => {
                  // Logique pour appliquer les changements
                  alert('Charte graphique appliquée !');
                }}
              >
                Appliquer les changements
              </button>
            </div>
          </div>
        </div>
                  </div>
                </div>
                <div className="bg-bolt-elements-background-depth-1 pb-6">{/* Ghost Element */}</div>
              </div>
            </div>
            {!chatStarted && (
              <div id="examples" className="relative w-full max-w-chat mx-auto mt-2 flex flex-col items-center">
              <div className="flex flex-col space-y-2 [mask-image:linear-gradient(to_bottom,black_0%,transparent_180%)] hover:[mask-image:none]">
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
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      
    );
  },
);
