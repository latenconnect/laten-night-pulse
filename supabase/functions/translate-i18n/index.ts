import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Target languages: code -> Google Cloud Translation language code
const TARGET_LANGUAGES: Record<string, string> = {
  zh: 'zh',       // Chinese (Simplified)
  vi: 'vi',       // Vietnamese
  fr: 'fr',       // French
  it: 'it',       // Italian
  es: 'es',       // Spanish
  de: 'de',       // German
  ko: 'ko',       // Korean
};

// Flatten nested object to array of { path, value } pairs
function flattenObject(obj: Record<string, any>, prefix = ''): Array<{ path: string; value: string }> {
  const result: Array<{ path: string; value: string }> = [];
  
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'string') {
      result.push({ path: fullPath, value });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          result.push({ path: `${fullPath}[${index}]`, value: item });
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      result.push(...flattenObject(value, fullPath));
    }
  }
  
  return result;
}

// Reconstruct nested object from flattened pairs
function unflattenObject(pairs: Array<{ path: string; value: string }>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const { path, value } of pairs) {
    const parts = path.split(/\.|\[|\]/).filter(Boolean);
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextArray = !isNaN(Number(nextPart));
      
      if (!(part in current)) {
        current[part] = isNextArray ? [] : {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }
  
  return result;
}

// Translate texts using official Google Cloud Translation API v2
// Supports batch translation (up to 128 texts per request)
async function translateBatch(
  texts: string[], 
  targetLang: string, 
  apiKey: string
): Promise<string[]> {
  const results: string[] = [];
  const batchSize = 100; // Google allows up to 128, using 100 for safety
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: batch,
            source: 'en',
            target: targetLang,
            format: 'text'
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Translation API error (${response.status}):`, errorText);
        // Fallback to original texts for this batch
        results.push(...batch);
        continue;
      }
      
      const data = await response.json();
      
      if (data.data?.translations) {
        for (const translation of data.data.translations) {
          results.push(translation.translatedText);
        }
        console.log(`Translated batch ${Math.floor(i / batchSize) + 1}: ${batch.length} strings`);
      } else {
        console.error('Unexpected response format:', data);
        results.push(...batch);
      }
    } catch (error) {
      console.error(`Translation batch error:`, error);
      // Fallback to original texts for this batch
      results.push(...batch);
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_TRANSLATION_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_TRANSLATION_API_KEY not configured');
    }

    const { englishTranslations, targetLanguages } = await req.json();
    
    if (!englishTranslations) {
      throw new Error('English translations required');
    }

    const langsToTranslate = targetLanguages || Object.keys(TARGET_LANGUAGES);
    const results: Record<string, any> = {};
    
    // Flatten English translations
    const flattenedEn = flattenObject(englishTranslations);
    const textsToTranslate = flattenedEn.map(p => p.value);
    
    console.log(`Translating ${textsToTranslate.length} strings to ${langsToTranslate.length} languages using Google Cloud Translation API...`);
    
    for (const langCode of langsToTranslate) {
      const googleLangCode = TARGET_LANGUAGES[langCode];
      if (!googleLangCode) {
        console.log(`Skipping unknown language: ${langCode}`);
        continue;
      }
      
      console.log(`Translating to ${langCode}...`);
      
      const translatedTexts = await translateBatch(textsToTranslate, googleLangCode, apiKey);
      
      // Reconstruct the nested object with translated values
      const translatedPairs = flattenedEn.map((pair, index) => ({
        path: pair.path,
        value: translatedTexts[index]
      }));
      
      results[langCode] = unflattenObject(translatedPairs);
      console.log(`Completed ${langCode}: ${translatedTexts.length} strings`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      translations: results,
      stats: {
        stringsTranslated: textsToTranslate.length,
        languagesCompleted: Object.keys(results).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Translation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
