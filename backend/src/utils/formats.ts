export const formatDescriptions = (descriptions: string[]): string => {
  const header = '--- START OF IMAGE CONTEXT ---\n';
  const footer = '--- END OF CONTEXT ---\n\n';
  
  const body = descriptions
    .map((desc, idx) => `Description if image ${idx + 1}:\n${desc}`)
    .join('\n\n---\n\n');
  
  return `${header}${body}\n\n${footer}`;
}