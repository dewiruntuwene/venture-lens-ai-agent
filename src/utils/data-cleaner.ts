/**
 * Utility to clean and pre-process scraped company data before AI analysis.
 * This helps improve AI accuracy and reduces token usage.
 */

/**
 * Common boilerplate phrases found on websites that don't add value to analysis.
 */
const BOILERPLATE_PHRASES = [
  /accept cookies/gi,
  /this website uses cookies/gi,
  /privacy policy/gi,
  /terms of service/gi,
  /cookie settings/gi,
  /all rights reserved/gi,
  /subscribe to our newsletter/gi,
  /follow us on/gi,
  /sign up for/gi,
  /create an account/gi,
  /login to/gi,
  /forgot password/gi,
  /click here to/gi,
  /read more/gi,
  /contact us/gi,
  /get in touch/gi,
  /copyright ©/gi,
];

/**
 * Patterns for social media handles and common UI elements.
 */
const NOISY_PATTERNS = [
  /https?:\/\/(www\.)?(twitter|facebook|linkedin|instagram|youtube|github)\.com\/[a-zA-Z0-9_.-]+/gi,
  /@[a-zA-Z0-9_.-]+/g, // Twitter-style handles
  /\[\w+\]/g, // Bracketed UI text like [Menu], [Search]
  /\b(Search|Menu|Home|About|Contact|Pricing|Blog|Login|Sign Up|Careers|Support)\b/g,
];

/**
 * Cleans a string by removing common web boilerplate and formatting.
 */
export function cleanText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Basic whitespace cleaning
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 2. Remove common boilerplate phrases
  for (const phrase of BOILERPLATE_PHRASES) {
    cleaned = cleaned.replace(phrase, '');
  }

  // 3. Remove noisy patterns (social media, UI text)
  for (const pattern of NOISY_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 4. Remove repetitive characters or empty brackets/parentheses
  cleaned = cleaned.replace(/[\(\)\[\]\{\}]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 5. Remove very short "sentences" or fragments (likely navigation items)
  // Split by common delimiters and filter out very short fragments
  const fragments = cleaned.split(/[|•·\-_]/);
  cleaned = fragments
    .map((f) => f.trim())
    .filter((f) => f.length > 3)
    .join(' ');

  // Final whitespace cleanup
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Cleans the description of a company to prepare it for AI analysis.
 */
export function cleanDescription(description: string, maxLength: number = 3000): string {
  if (!description || description === 'No description available') {
    return 'No description available';
  }

  let cleaned = cleanText(description);

  // If the description is too long, truncate it but try to keep it meaningful
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    // Try to cut at the last complete sentence or space
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastPeriod > maxLength * 0.8) {
      cleaned = cleaned.substring(0, lastPeriod + 1);
    } else {
      const lastSpace = cleaned.lastIndexOf(' ');
      if (lastSpace > 0) {
        cleaned = cleaned.substring(0, lastSpace) + '...';
      }
    }
  }

  return cleaned;
}

/**
 * Removes duplicate sentences from a text.
 */
export function removeDuplicateSentences(text: string): string {
  const sentences = text.split(/[.!?]+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(sentence.trim());
    }
  }

  return result.join('. ') + (result.length > 0 ? '.' : '');
}
