export function getGeminiApiKey(): string | null {
  const customKey = process.env.GEMINI_API_KEY;
  const platformKey = process.env.API_KEY;

  if (customKey && customKey !== 'your_api_key_here' && customKey.length > 20 && customKey !== 'undefined') {
    return customKey;
  }
  
  if (platformKey && platformKey !== 'your_api_key_here' && platformKey.length > 20 && platformKey !== 'undefined') {
    return platformKey;
  }

  return null;
}
