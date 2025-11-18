import { build } from 'esbuild';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Read package.json from the calling package
const packagePath = resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));

const srcDir = resolve(process.cwd(), 'src');
const distDir = resolve(process.cwd(), 'dist');

// Get all entry points from exports field or default to index.ts
function getEntryPoints() {
  const entryPoints = {};
  
  if (pkg.exports) {
    for (const [key, value] of Object.entries(pkg.exports)) {
      if (typeof value === 'object' && value.import) {
        // Extract the filename from the export path
        const filename = value.import.replace('./dist/', '').replace('.js', '');
        const srcFile = resolve(srcDir, `${filename}.ts`);
        
        // Check if source file exists
        try {
          statSync(srcFile);
          entryPoints[filename] = srcFile;
        } catch {
          // File doesn't exist, skip
        }
      }
    }
  }
  
  // Always include index.ts as default entry point
  const indexPath = resolve(srcDir, 'index.ts');
  try {
    statSync(indexPath);
    entryPoints['index'] = indexPath;
  } catch {
    // No index.ts
  }
  
  return entryPoints;
}

async function analyzeBundle(filepath) {
  try {
    const content = readFileSync(filepath);
    const gzipped = await gzipAsync(content);
    const size = content.length;
    const gzippedSize = gzipped.length;
    
    return {
      size,
      gzippedSize,
      sizeKB: (size / 1024).toFixed(2),
      gzippedKB: (gzippedSize / 1024).toFixed(2)
    };
  } catch (error) {
    return null;
  }
}

async function buildPackage() {
  try {
    const entryPoints = getEntryPoints();
    
    if (Object.keys(entryPoints).length === 0) {
      console.warn(`⚠ No entry points found for ${pkg.name}`);
      return;
    }
    
    // Build with optimizations
    await build({
      entryPoints,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2017',
      outdir: distDir,
      sourcemap: true,
      minify: true, // Enable minification
      treeShaking: true,
      splitting: true, // Enable code splitting for shared chunks
      metafile: true, // Generate metadata for analysis
      external: [
        // Mark workspace dependencies as external
        ...Object.keys(pkg.dependencies || {}).filter(dep => dep.startsWith('@shadowcache/')),
        // Mark peer dependencies as external
        ...Object.keys(pkg.peerDependencies || {})
      ],
      // Advanced optimizations
      pure: ['console.log', 'console.debug'], // Mark as side-effect free for removal
      drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
      legalComments: 'none', // Remove comments to reduce size
      logLevel: 'info'
    });

    console.log(`✓ Built ${pkg.name}`);
    
    // Analyze bundle sizes
    console.log('\n📦 Bundle Analysis:');
    let totalGzipped = 0;
    
    for (const [name, _] of Object.entries(entryPoints)) {
      const outputPath = resolve(distDir, `${name}.js`);
      const analysis = await analyzeBundle(outputPath);
      
      if (analysis) {
        console.log(`  ${name}.js: ${analysis.sizeKB} KB (${analysis.gzippedKB} KB gzipped)`);
        totalGzipped += parseFloat(analysis.gzippedKB);
      }
    }
    
    console.log(`  Total (gzipped): ${totalGzipped.toFixed(2)} KB`);
    
    // Check if SDK exceeds size limit
    if (pkg.name === '@shadowcache/sdk' && totalGzipped > 50) {
      console.error(`\n❌ Bundle size exceeds 50KB limit: ${totalGzipped.toFixed(2)} KB`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`✗ Failed to build ${pkg.name}:`, error);
    process.exit(1);
  }
}

buildPackage();
