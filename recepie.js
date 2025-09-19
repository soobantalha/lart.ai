// api/recipe.js - Serverless function for Vercel
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
    const { message, test } = req.body;

    // If this is a test request, just return status
    if (test) {
      return res.status(200).json({ status: 'OK' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call DeepSeek API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || '',
        'X-Title': 'L\'Art Culinaire AI'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: `You are L'Art Culinaire AI, a world-class culinary assistant. 
            Create exquisite, detailed recipes with the following structure in JSON format:
            {
              "name": "Recipe Name",
              "cuisine": "Cuisine Type",
              "difficulty": "Difficulty Level",
              "prep_time": "Preparation Time",
              "ingredients": ["ingredient 1", "ingredient 2", ...],
              "instructions": ["step 1", "step 2", ...],
              "tips": ["tip 1", "tip 2", ...],
              "score": 95
            }
            Make the recipe luxurious, detailed, and include professional chef tips.
            Always respond with valid JSON only.`
          },
          { role: "user", content: message }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    // Parse the recipe from the response
    let recipeData;
    if (responseText.includes('```json')) {
      const jsonStr = responseText.split('```json')[1].split('```')[0].trim();
      recipeData = JSON.parse(jsonStr);
    } else if (responseText.includes('```')) {
      const jsonStr = responseText.split('```')[1].split('```')[0].trim();
      recipeData = JSON.parse(jsonStr);
    } else {
      recipeData = JSON.parse(responseText);
    }

    res.status(200).json({ recipe: recipeData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}