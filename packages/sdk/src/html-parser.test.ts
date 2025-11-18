// Property-based tests for HTML resource parser
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractLinkedResources, extractResourcesByType } from './html-parser';

describe('HTML Resource Parser', () => {
  // Feature: shadow-cache, Property 26: HTML parsing extracts linked resources
  // Validates: Requirements 13.1
  describe('Property 26: HTML parsing extracts linked resources', () => {
    // Generator for valid URLs (excluding quotes and other HTML-problematic characters)
    const urlArb = fc.oneof(
      fc.webUrl().filter(url => !url.includes("'") && !url.includes('"') && !url.includes('<') && !url.includes('>')),
      fc.stringMatching(/^\/[a-z0-9/-]+\.[a-z]{2,4}$/), // Relative URLs
      fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,4}$/) // Simple filenames
    );

    // Generator for HTML attributes (to add noise)
    const htmlAttributeArb = fc.record({
      name: fc.constantFrom('class', 'id', 'data-test', 'alt', 'title', 'width', 'height'),
      value: fc.stringMatching(/^[a-z0-9- ]+$/)
    });

    it('should extract script src attributes from any valid HTML', () => {
      fc.assert(
        fc.property(
          fc.array(urlArb, { minLength: 1, maxLength: 10 }),
          fc.array(htmlAttributeArb, { minLength: 0, maxLength: 3 }),
          (urls, extraAttrs) => {
            // Build HTML with script tags
            const scriptTags = urls.map(url => {
              const attrs = extraAttrs.map(a => `${a.name}="${a.value}"`).join(' ');
              return `<script src="${url}" ${attrs}></script>`;
            }).join('\n');
            
            const html = `<html><head>${scriptTags}</head><body></body></html>`;
            const extracted = extractLinkedResources(html);
            
            // All URLs should be extracted
            urls.forEach(url => {
              expect(extracted).toContain(url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract link href attributes from any valid HTML', () => {
      fc.assert(
        fc.property(
          fc.array(urlArb, { minLength: 1, maxLength: 10 }),
          fc.array(htmlAttributeArb, { minLength: 0, maxLength: 3 }),
          (urls, extraAttrs) => {
            // Build HTML with link tags
            const linkTags = urls.map(url => {
              const attrs = extraAttrs.map(a => `${a.name}="${a.value}"`).join(' ');
              return `<link rel="stylesheet" href="${url}" ${attrs}>`;
            }).join('\n');
            
            const html = `<html><head>${linkTags}</head><body></body></html>`;
            const extracted = extractLinkedResources(html);
            
            // All URLs should be extracted
            urls.forEach(url => {
              expect(extracted).toContain(url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract img src attributes from any valid HTML', () => {
      fc.assert(
        fc.property(
          fc.array(urlArb, { minLength: 1, maxLength: 10 }),
          fc.array(htmlAttributeArb, { minLength: 0, maxLength: 3 }),
          (urls, extraAttrs) => {
            // Build HTML with img tags
            const imgTags = urls.map(url => {
              const attrs = extraAttrs.map(a => `${a.name}="${a.value}"`).join(' ');
              return `<img src="${url}" ${attrs} />`;
            }).join('\n');
            
            const html = `<html><body>${imgTags}</body></html>`;
            const extracted = extractLinkedResources(html);
            
            // All URLs should be extracted
            urls.forEach(url => {
              expect(extracted).toContain(url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract video src attributes from any valid HTML', () => {
      fc.assert(
        fc.property(
          fc.array(urlArb, { minLength: 1, maxLength: 10 }),
          (urls) => {
            // Build HTML with video tags
            const videoTags = urls.map(url => 
              `<video src="${url}" controls></video>`
            ).join('\n');
            
            const html = `<html><body>${videoTags}</body></html>`;
            const extracted = extractLinkedResources(html);
            
            // All URLs should be extracted
            urls.forEach(url => {
              expect(extracted).toContain(url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract audio src attributes from any valid HTML', () => {
      fc.assert(
        fc.property(
          fc.array(urlArb, { minLength: 1, maxLength: 10 }),
          (urls) => {
            // Build HTML with audio tags
            const audioTags = urls.map(url => 
              `<audio src="${url}" controls></audio>`
            ).join('\n');
            
            const html = `<html><body>${audioTags}</body></html>`;
            const extracted = extractLinkedResources(html);
            
            // All URLs should be extracted
            urls.forEach(url => {
              expect(extracted).toContain(url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract source tags from any valid HTML', () => {
      fc.assert(
        fc.property(
          fc.array(urlArb, { minLength: 1, maxLength: 10 }),
          (urls) => {
            // Build HTML with source tags
            const sourceTags = urls.map(url => 
              `<source src="${url}" type="video/mp4">`
            ).join('\n');
            
            const html = `<html><body><video>${sourceTags}</video></body></html>`;
            const extracted = extractLinkedResources(html);
            
            // All URLs should be extracted
            urls.forEach(url => {
              expect(extracted).toContain(url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract all resource types from mixed HTML content', () => {
      fc.assert(
        fc.property(
          urlArb,
          urlArb,
          urlArb,
          urlArb,
          urlArb,
          (scriptUrl, styleUrl, imgUrl, videoUrl, audioUrl) => {
            const html = `
              <html>
                <head>
                  <script src="${scriptUrl}"></script>
                  <link rel="stylesheet" href="${styleUrl}">
                </head>
                <body>
                  <img src="${imgUrl}" alt="test">
                  <video src="${videoUrl}" controls></video>
                  <audio src="${audioUrl}" controls></audio>
                </body>
              </html>
            `;
            
            const extracted = extractLinkedResources(html);
            
            // All different resource types should be extracted
            expect(extracted).toContain(scriptUrl);
            expect(extracted).toContain(styleUrl);
            expect(extracted).toContain(imgUrl);
            expect(extracted).toContain(videoUrl);
            expect(extracted).toContain(audioUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle duplicate URLs correctly (return unique set)', () => {
      fc.assert(
        fc.property(
          urlArb,
          fc.integer({ min: 2, max: 10 }),
          (url, count) => {
            // Create HTML with the same URL repeated multiple times
            const scriptTags = Array(count).fill(null).map(() => 
              `<script src="${url}"></script>`
            ).join('\n');
            
            const html = `<html><head>${scriptTags}</head></html>`;
            const extracted = extractLinkedResources(html);
            
            // URL should appear only once in the result
            const urlCount = extracted.filter(u => u === url).length;
            expect(urlCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty or whitespace-only HTML', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\n\n', '\t\t', '   \n  \t  '),
          (html) => {
            const extracted = extractLinkedResources(html);
            expect(extracted).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle HTML with no resource tags', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9 .,!?]+$/),
          (text) => {
            const html = `<html><body><p>${text}</p><div>${text}</div></body></html>`;
            const extracted = extractLinkedResources(html);
            expect(extracted).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malformed HTML gracefully', () => {
      fc.assert(
        fc.property(
          urlArb,
          (url) => {
            // Various malformed HTML scenarios
            const malformedCases = [
              `<script src="${url}"`,  // Missing closing >
              `<img src="${url}`,      // Missing closing >
              `script src="${url}">`,  // Missing opening <
              `<script src=${url}></script>`,  // Missing quotes (should not match)
            ];
            
            malformedCases.forEach(html => {
              const extracted = extractLinkedResources(html);
              // Should not crash, may or may not extract depending on malformation
              expect(Array.isArray(extracted)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single vs double quotes consistently', () => {
      fc.assert(
        fc.property(
          urlArb,
          (url) => {
            const htmlSingle = `<script src='${url}'></script>`;
            const htmlDouble = `<script src="${url}"></script>`;
            
            const extractedSingle = extractLinkedResources(htmlSingle);
            const extractedDouble = extractLinkedResources(htmlDouble);
            
            // Both should extract the URL
            expect(extractedSingle).toContain(url);
            expect(extractedDouble).toContain(url);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('extractResourcesByType', () => {
    const urlArb = fc.oneof(
      fc.webUrl().filter(url => !url.includes("'") && !url.includes('"') && !url.includes('<') && !url.includes('>')),
      fc.stringMatching(/^\/[a-z0-9/-]+\.[a-z]{2,4}$/),
      fc.stringMatching(/^[a-z0-9-]+\.[a-z]{2,4}$/)
    );

    it('should extract only scripts when type is "script"', () => {
      fc.assert(
        fc.property(
          urlArb,
          urlArb,
          urlArb,
          (scriptUrl, styleUrl, imgUrl) => {
            const html = `
              <html>
                <head>
                  <script src="${scriptUrl}"></script>
                  <link rel="stylesheet" href="${styleUrl}">
                </head>
                <body>
                  <img src="${imgUrl}" alt="test">
                </body>
              </html>
            `;
            
            const extracted = extractResourcesByType(html, 'script');
            
            expect(extracted).toContain(scriptUrl);
            expect(extracted).not.toContain(styleUrl);
            expect(extracted).not.toContain(imgUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract only stylesheets when type is "stylesheet"', () => {
      fc.assert(
        fc.property(
          urlArb,
          urlArb,
          (scriptUrl, styleUrl) => {
            const html = `
              <html>
                <head>
                  <script src="${scriptUrl}"></script>
                  <link rel="stylesheet" href="${styleUrl}">
                </head>
              </html>
            `;
            
            const extracted = extractResourcesByType(html, 'stylesheet');
            
            expect(extracted).toContain(styleUrl);
            expect(extracted).not.toContain(scriptUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract only images when type is "image"', () => {
      fc.assert(
        fc.property(
          urlArb,
          urlArb,
          (scriptUrl, imgUrl) => {
            const html = `
              <html>
                <head>
                  <script src="${scriptUrl}"></script>
                </head>
                <body>
                  <img src="${imgUrl}" alt="test">
                </body>
              </html>
            `;
            
            const extracted = extractResourcesByType(html, 'image');
            
            expect(extracted).toContain(imgUrl);
            expect(extracted).not.toContain(scriptUrl);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
