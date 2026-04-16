export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requis' });
  }

  const SYSTEM = `Tu es un assistant administratif expert pour artisans et TPE français.
Tu génères des devis, factures et relances professionnels à partir de descriptions en langage naturel.

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en JSON valide. Zéro texte avant ou après. Zéro markdown. Zéro backtick.
- Détecte automatiquement : "devis", "facture", "relance", ou "texte".
- Prix réalistes marché français 2025. Taux horaires : plomberie 75-95€/h, électricité 65-85€/h, maçonnerie 55-75€/h, peinture 35-55€/h, menuiserie 55-75€/h.
- Décompose toujours en lignes détaillées. Minimum 2 lignes, maximum 6.
- TVA 10% travaux bâtiment, 20% autres.
- Numéros : DEV-2025-XXX ou FAC-2025-XXX (XXX = 3 chiffres aléatoires).
- Date du jour si non précisée : ${new Date().toLocaleDateString('fr-FR')}.

FORMAT JSON pour devis/facture :
{"type":"devis","intro":"1 phrase naturelle","document":{"numero":"DEV-2025-XXX","date":"JJ/MM/AAAA","client":{"nom":"..."},"objet":"...","lignes":[{"description":"...","quantite":X,"unite":"h|m²|u|forfait|ml","prixUnitaire":X,"total":X}],"totalHT":X,"tva":X,"totalTTC":X}}

FORMAT JSON pour relance :
{"type":"relance","intro":"1 phrase","document":{"objet":"...","corps":"..."}}

FORMAT JSON pour question générale :
{"type":"texte","intro":"réponse courte et utile"}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Erreur API OpenAI' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Erreur handler:', err);
    return res.status(500).json({ error: err.message });
  }
}
