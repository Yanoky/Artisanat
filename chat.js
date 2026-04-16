exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { messages } = JSON.parse(event.body);
  const SYSTEM = `Tu es un assistant administratif expert pour artisans et TPE français. Tu génères des devis, factures et relances en JSON uniquement. FORMAT devis/facture: {"type":"devis","intro":"1 phrase","document":{"numero":"DEV-2025-XXX","date":"JJ/MM/AAAA","client":{"nom":"..."},"objet":"...","lignes":[{"description":"...","quantite":1,"unite":"h","prixUnitaire":80,"total":80}],"totalHT":80,"tva":8,"totalTTC":88}} FORMAT relance: {"type":"relance","intro":"1 phrase","document":{"objet":"...","corps":"..."}} FORMAT texte: {"type":"texte","intro":"réponse courte"}`;
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
