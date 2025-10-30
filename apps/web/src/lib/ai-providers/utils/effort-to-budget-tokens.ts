/**
 * Convert reasoning effort to token budget
 *
 * - Low: 5,000 tokens
 * - Medium: 10,000 tokens
 * - High: 20,000 tokens
 */
export default function effortToBudgetTokens(
  effort: 'low' | 'medium' | 'high'
): number {
  switch (effort) {
    case 'low':
      return 5000;
    case 'medium':
      return 10000;
    case 'high':
      return 20000;
  }
}
