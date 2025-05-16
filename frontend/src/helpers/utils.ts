export const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

export const formatDescriptions = (descriptions: string[]): string => {
  const header = '--- START OF IMAGE CONTEXT ---\n';
  const footer = '--- END OF CONTEXT ---\n\nUser query:';
  
  const body = descriptions
    .map((desc, idx) => `Description if image ${idx + 1}:\n${desc}`)
    .join('\n\n---\n\n');
  
  return `${header}${body}\n\n${footer}`;
}