import { UIMessage } from 'ai';

/**
 * Filters out complex UI message parts that aren't supported in realtime
 * Returns true if the message contains only text content
 */
const isRealtimeCompatible = (message: UIMessage): boolean => {
  return message.parts.every(part => 
    part.type === 'text' || 
    part.type === 'step-start' // Step markers are typically ignored
  );
};

export default isRealtimeCompatible;