/**
 * Removes content within square brackets from text.
 * Example: "hello [hidden] world" -> "hello  world"
 */
const removeFormattingMarkers = (text: string): string => {
  return text
    .replace(/\[.*?\]/g, '') // Remove content within square brackets
    .trim();
};

export default removeFormattingMarkers;
