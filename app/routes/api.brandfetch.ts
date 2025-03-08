// app/routes/api.brandfetch.ts
import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';

// Types pour la réponse de l'API Brandfetch (simplifiée)
interface BrandfetchResponse {
  name?: string;
  domain?: string;
  description?: string;
  logos?: Array<{
    format?: string;
    src?: string;
    type?: string;
  }>;
  colors?: Array<{
    hex?: string;
    type?: string;
    brightness?: number;
  }>;
  fonts?: Array<{
    name?: string;
    type?: string;
  }>;
  icon?: {
    src?: string;
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  // Vérifier la méthode
  if (request.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, { status: 405 });
  }

  try {
    // Récupérer le corps de la requête
    const body = await request.json() as { domain?: string };
    const { domain } = body;

    if (!domain) {
      return json({ error: 'Domaine manquant' }, { status: 400 });
    }

    // La clé API doit être stockée de manière sécurisée
    // En production, utilisez plutôt les variables d'environnement Cloudflare
    const API_KEY = 'PlCozKDShVVbghKbwe8V+UHzmAPoZxnzWpTUvPt5KLY=';
    
    // Appel à l'API Brandfetch
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    // Gérer les erreurs de l'API
    if (!response.ok) {
      const errorText = await response.text();
      let status = response.status;
      let errorMessage = `Erreur API: ${status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        // Si le JSON n'est pas parsable, utiliser le texte brut
        errorMessage += ` - ${errorText}`;
      }
      
      return json({ error: errorMessage }, { status });
    }

    // Récupérer et filtrer les données de l'API
    const data: BrandfetchResponse = await response.json();
    
    // Filtrer pour ne renvoyer que les données nécessaires
    const filteredData = {
      name: data.name,
      domain: data.domain,
      colors: data.colors,
      fonts: data.fonts,
      logos: data.logos?.map(logo => ({
        format: logo.format,
        src: logo.src,
        type: logo.type
      })),
      icon: data.icon?.src ? { src: data.icon.src } : undefined
    };

    return json(filteredData);
  } catch (error) {
    console.error('Erreur avec l\'API Brandfetch:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}