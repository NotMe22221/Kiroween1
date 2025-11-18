import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

const PACKAGES_DIR = resolve(process.cwd(), 'packages');
const SIZE_LIMIT_KB = 50; // Core SDK limit

async function analyzeFile(filepath) {
  try {
    const content = readFileSync(filepath);
    const gzipped = await gzipAsync(content);
    
    return {
      size: content.length,
      gzippedSize: gzipped.length,
      sizeKB: (content.length / 1024).toFixed(2),
      gzippedKB: (gzipped.length / 1024).toFixed(2)
    };
  } catch (error) {
    return null;
  }
}

async function analyzePackage(packageName) {
  const packagePath = join(PACKAGES_DIR, packageName);
  const distPath = join(packagePath, 'dist');
  
  try {
    const files = readdirSync(distPath).filter(f => f.endsWith('.js'));
    const results = [];
    
    for (const file of files) {
      const filepath = join(distPath, file);
      const analysis = await analyzeFile(filepath);
      
      if (analysis) {
        results.push({
          file,
          ...analysis
        });
      }
    }
    
    return results;
  } catch (error) {
    return [];
  }
}

async function main() {
  console.log('📊 ShadowCache Bundle Analysis\n');
  console.log('='.repeat(70));
  
  const packages = readdirSync(PACKAGES_DIR).filter(name => {
    const stat = statSync(join(PACKAGES_DIR, name));
    return stat.isDirectory();
  });
  
  let totalGzipped = 0;
  let sdkGzipped = 0;
  const packageResults = [];
  
  for (const pkg of packages) {
    const results = await analyzePackage(pkg);
    
    if (results.length > 0) {
      const pkgTotal = results.reduce((sum, r) => sum + parseFloat(r.gzippedKB), 0);
      packageResults.push({ pkg, results, total: pkgTotal });
      totalGzipped += pkgTotal;
      
      if (pkg === 'sdk') {
        sdkGzipped = pkgTotal;
      }
    }
  }
  
  // Sort by size (largest first)
  packageResults.sort((a, b) => b.total - a.total);
  
  // Display results
  for (const { pkg, results, total } of packageResults) {
    console.log(`\n📦 @shadowcache/${pkg}`);
    console.log('-'.repeat(70));
    
    for (const result of results) {
      const bar = '█'.repeat(Math.ceil(parseFloat(result.gzippedKB) / 2));
      console.log(`  ${result.file.padEnd(25)} ${result.sizeKB.padStart(8)} KB  ${result.gzippedKB.padStart(8)} KB (gz)  ${bar}`);
    }
    
    console.log(`  ${'TOTAL'.padEnd(25)} ${'-'.padStart(8)}     ${total.toFixed(2).padStart(8)} KB (gz)`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`  Total bundle size (all packages): ${totalGzipped.toFixed(2)} KB (gzipped)`);
  console.log(`  Core SDK bundle size: ${sdkGzipped.toFixed(2)} KB (gzipped)`);
  console.log(`  Size limit for core SDK: ${SIZE_LIMIT_KB} KB (gzipped)`);
  
  if (sdkGzipped > SIZE_LIMIT_KB) {
    console.log(`\n❌ FAILED: Core SDK exceeds size limit by ${(sdkGzipped - SIZE_LIMIT_KB).toFixed(2)} KB`);
    console.log(`\n💡 Optimization suggestions:`);
    console.log(`  - Review and remove unused exports`);
    console.log(`  - Consider lazy loading optional features`);
    console.log(`  - Check for duplicate dependencies`);
    console.log(`  - Use dynamic imports for large modules`);
    process.exit(1);
  } else {
    const remaining = SIZE_LIMIT_KB - sdkGzipped;
    console.log(`\n✅ PASSED: Core SDK is ${remaining.toFixed(2)} KB under the limit`);
  }
  
  console.log('\n' + '='.repeat(70));
}

main().catch(error => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
