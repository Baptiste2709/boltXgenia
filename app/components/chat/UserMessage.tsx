import { modificationsRegex } from '~/utils/diff';
import { Markdown } from './Markdown';

interface UserMessageProps {
  content: string;
  // Propriété display optionnelle pour afficher un message différent du contenu envoyé
  display?: string;  
}

export function UserMessage({ content, display }: UserMessageProps) {
  // Utiliser display s'il est fourni, sinon utiliser content
  const displayContent = display || content;
  
  return (
    <div className="overflow-hidden pt-[4px]">
      <Markdown limitedMarkdown>{sanitizeUserMessage(displayContent)}</Markdown>
    </div>
  );
}

function sanitizeUserMessage(content: string) {
  // Supprimer les instructions de branding éventuelles
  const cleanContent = content.replace(/<branding_instructions>[\s\S]*?<\/branding_instructions>/g, '').trim();
  // Puis supprimer les modifications comme avant
  return cleanContent.replace(modificationsRegex, '').trim();
}