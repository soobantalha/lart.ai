// api/recipe.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call xAI Grok API
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY || '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'}`
      },
      body: JSON.stringify({
        model: 'grok-4-fast',
        messages: [
          {
            role: 'system',
            content: `You are a Michelin-star French chef specializing in haute cuisine. 
            Create elegant, sophisticated French recipes with precise measurements and techniques.
            Always respond with a JSON object in this exact format:
            {
              "name": "Recipe name",
              "cuisine": "French",
              "ingredients": ["ingredient 1", "ingredient 2", ...],
              "instructions": ["step 1", "step 2", ...],
              "tips": ["tip 1", "tip 2", ...],
              "score": 85-100
            }
            Make the recipe luxurious and visually stunning.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!grokResponse.ok) {
      throw new Error(`xAI API error: ${grokResponse.statusText}`);
    }

    const data = await grokResponse.json();
    const recipeText = data.choices[0].message.content;
    
    // Try to parse the JSON response from the model
    try {
      const recipe = JSON.parse(recipeText);
      return res.status(200).json({ recipe });
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const recipe = JSON.parse(jsonMatch[0]);
          return res.status(200).json({ recipe });
        } catch (e) {
          // If all parsing fails, use a fallback recipe
          return res.status(200).json({ 
            recipe: getFallbackRecipe(message) 
          });
        }
      } else {
        return res.status(200).json({ 
          recipe: getFallbackRecipe(message) 
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      recipe: getFallbackRecipe(req.body?.message || '') 
    });
  }
}

function getFallbackRecipe(input) {
  const fallbackRecipes = [
    {
      name: "Truffle Infused Coq au Vin",
      cuisine: "French",
      ingredients: [
        "4 chicken thighs, skin on",
        "2 cups Burgundy red wine",
        "200g pearl onions, peeled",
        "200g cremini mushrooms, quartered",
        "2 tbsp black truffle paste",
        "4 slices thick-cut bacon, diced",
        "2 cloves garlic, minced",
        "2 cups chicken stock",
        "2 tbsp tomato paste",
        "Fresh thyme sprigs",
        "Salt and freshly ground black pepper"
      ],
      instructions: [
        "Season chicken with salt and pepper. In a Dutch oven, cook bacon until crispy. Remove and set aside.",
        "Sear chicken in bacon fat until golden brown on both sides. Remove and set aside.",
        "Sauté pearl onions and mushrooms until caramelized. Add garlic and cook until fragrant.",
        "Add tomato paste and cook for 1 minute. Deglaze with red wine, scraping up browned bits.",
        "Return chicken and bacon to pot. Add chicken stock, thyme, and truffle paste.",
        "Simmer covered for 45 minutes until chicken is tender. Uncover and reduce sauce to desired consistency.",
        "Season to taste and garnish with fresh thyme."
      ],
      tips: [
        "Marinate chicken in wine overnight for deeper flavor",
        "Use fresh black truffle shavings for garnish if available",
        "Serve with creamy mashed potatoes or crusty baguette"
      ],
      score: 92
    },
    {
      name: "Foie Gras Terrine with Fig Compote",
      cuisine: "French",
      ingredients: [
        "1 lb fresh duck foie gras, cleaned",
        "1/4 cup Armagnac or Cognac",
        "1 tsp pink salt (for curing)",
        "1/2 tsp white pepper",
        "1/4 tsp quatre épices (French four-spice blend)",
        "For fig compote: 1 cup dried figs, 1/2 cup port wine, 2 tbsp honey"
      ],
      instructions: [
        "Season foie gras with salt, pepper, and spices. Drizzle with Armagnac.",
        "Cover and refrigerate for 24 hours to marinate.",
        "Preheat oven to 200°F (95°C). Press foie gras into terrine mold.",
        "Place terrine in water bath and bake for 45-50 minutes until internal temperature reaches 115°F (46°C).",
        "Remove from oven, cool to room temperature, then weight down with a light press.",
        "Refrigerate for at least 48 hours before serving.",
        "For compote: Simmer figs with port and honey until softened and syrupy."
      ],
      tips: [
        "Serve terrine chilled with toasted brioche and fig compote",
        "A Sauternes wine pairing elevates this dish beautifully",
        "Use a very sharp knife dipped in hot water for clean slices"
      ],
      score: 96
    }
  ];
  
  return fallbackRecipes[Math.floor(Math.random() * fallbackRecipes.length)];
}
