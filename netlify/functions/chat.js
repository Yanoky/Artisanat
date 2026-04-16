exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { messages } = JSON.parse(event.body);

  const SYSTEM = `Tu es un assistant administratif expert pour artisans et TPE français.
Tu génères des devis, factures et relances professionnels à partir de descriptions en langage naturel.
RÈGLES : Réponds UNIQUEMENT en JSON valide. Zéro texte avant ou après.
Prix réalistes France 2025. TVA 10% bâtiment. Numéros DEV-2025-XXX ou FAC-2025-XXX.
FORMAT devis/facture: {"type":"devis","intro":"1 phrase","document":{"numero":"DEV-2025-XXX","date":"JJ/MM/AAAA","client":{"nom":"..."},"objet":"...","lignes":[{"description":"...","quantite":X,"unite":"h|m²|u|forfait","prixUnitaire":X,"total":X}],"totalHT":X,"tva":X,"totalTTC":X}}
FORMAT relance: {"type":"relance","intro":"1 phrase","document":{"objet":"...","corps":"..."}}
FORMAT texte: {"type":"texte","intro":"réponse courte"}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: SYSTEM }, ...messages]
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
