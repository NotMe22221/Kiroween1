// HTML Resource Parser
// Extracts linked resources from HTML content for predictive caching

/**
 * Extracts all linked resources from HTML content
 * @param html - HTML content as string
 * @returns Array of resource URLs found in the HTML
 */
export function extractLinkedResources(html: string): string[] {
  const resources = new Set<string>();

  // Extract script src attributes
  const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
  for (const match of scriptMatches) {
    resources.add(match[1]);
  }

  // Extract link href attributes (stylesheets, preload, etc.)
  const linkMatches = html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi);
  for (const match of linkMatches) {
    resources.add(match[1]);
  }

  // Extract img src attributes
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgMatches) {
    resources.add(match[1]);
  }

  // Extract video src attributes
  const videoMatches = html.matchAll(/<video[^>]+src=["']([^"']+)["']/gi);
  for (const match of videoMatches) {
    resources.add(match[1]);
  }

  // Extract source tags (for video/audio/picture elements)
  const sourceMatches = html.matchAll(/<source[^>]+src=["']([^"']+)["']/gi);
  for (const match of sourceMatches) {
    resources.add(match[1]);
  }

  // Extract audio src attributes
  const audioMatches = html.matchAll(/<audio[^>]+src=["']([^"']+)["']/gi);
  for (const match of audioMatches) {
    resources.add(match[1]);
  }

  // Extract iframe src attributes
  const iframeMatches = html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi);
  for (const match of iframeMatches) {
    resources.add(match[1]);
  }

  // Extract object data attributes
  const objectMatches = html.matchAll(/<object[^>]+data=["']([^"']+)["']/gi);
  for (const match of objectMatches) {
    resources.add(match[1]);
  }

  // Extract embed src attributes
  const embedMatches = html.matchAll(/<embed[^>]+src=["']([^"']+)["']/gi);
  for (const match of embedMatches) {
    resources.add(match[1]);
  }

  return Array.from(resources);
}

/**
 * Extracts resources of a specific type from HTML
 * @param html - HTML content as string
 * @param type - Type of resource to extract ('script', 'stylesheet', 'image', 'video', 'audio')
 * @returns Array of resource URLs of the specified type
 */
export function extractResourcesByType(
  html: string,
  type: 'script' | 'stylesheet' | 'image' | 'video' | 'audio'
): string[] {
  const resources: string[] = [];

  switch (type) {
    case 'script':
      const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
      for (const match of scriptMatches) {
        resources.push(match[1]);
      }
      break;

    case 'stylesheet':
      const linkMatches = html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi);
      for (const match of linkMatches) {
        resources.push(match[1]);
      }
      // Also check href before rel
      const linkMatches2 = html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["']/gi);
      for (const match of linkMatches2) {
        resources.push(match[1]);
      }
      break;

    case 'image':
      const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
      for (const match of imgMatches) {
        resources.push(match[1]);
      }
      break;

    case 'video':
      const videoMatches = html.matchAll(/<video[^>]+src=["']([^"']+)["']/gi);
      for (const match of videoMatches) {
        resources.push(match[1]);
      }
      const videoSourceMatches = html.matchAll(/<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/gi);
      for (const match of videoSourceMatches) {
        resources.push(match[1]);
      }
      break;

    case 'audio':
      const audioMatches = html.matchAll(/<audio[^>]+src=["']([^"']+)["']/gi);
      for (const match of audioMatches) {
        resources.push(match[1]);
      }
      const audioSourceMatches = html.matchAll(/<audio[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/gi);
      for (const match of audioSourceMatches) {
        resources.push(match[1]);
      }
      break;
  }

  return resources;
}
