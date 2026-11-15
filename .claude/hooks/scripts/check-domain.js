#!/usr/bin/env node
/**
 * Domain Availability Checker via RDAP Protocol
 * Queries Verisign's RDAP endpoint for .com domain availability.
 * Cost: $0 — no API keys, no accounts needed.
 *
 * Usage:
 *   node check-domain.js domain1.com domain2.com
 *   node check-domain.js --file domains.txt
 *   node check-domain.js --template "{Name}.com,Restaurant{Name}.com" --names names.txt
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const RDAP_ENDPOINT = 'https://rdap.verisign.com/com/v1/domain/';
const RATE_LIMIT = 5; // requests per second
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Accept': 'application/rdap+json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function checkDomain(domain, retries = 0) {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  try {
    const { statusCode, data } = await httpsGet(RDAP_ENDPOINT + cleanDomain);

    if (statusCode === 200) {
      let registrar = '—';
      try {
        const parsed = JSON.parse(data);
        const entity = (parsed.entities || []).find(e =>
          (e.roles || []).includes('registrar')
        );
        if (entity && entity.vcardArray && entity.vcardArray[1]) {
          const fn = entity.vcardArray[1].find(v => v[0] === 'fn');
          if (fn) registrar = fn[3];
        }
      } catch {}
      return { domain: cleanDomain, status: 'TAKEN', registrar };
    }

    if (statusCode === 404) {
      return { domain: cleanDomain, status: 'AVAILABLE', registrar: '—' };
    }

    if (statusCode === 429) {
      if (retries < MAX_RETRIES) {
        const backoff = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, retries), MAX_BACKOFF_MS);
        await sleep(backoff);
        return checkDomain(domain, retries + 1);
      }
      return { domain: cleanDomain, status: 'RATE_LIMITED', registrar: '—' };
    }

    return { domain: cleanDomain, status: `ERROR_${statusCode}`, registrar: '—' };
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const backoff = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, retries), MAX_BACKOFF_MS);
      await sleep(backoff);
      return checkDomain(domain, retries + 1);
    }
    return { domain: cleanDomain, status: 'ERROR', registrar: err.message };
  }
}

function parseDomains(args) {
  const domains = [];
  let i = 0;

  while (i < args.length) {
    if (args[i] === '--file') {
      i++;
      if (i < args.length) {
        const filePath = path.resolve(args[i]);
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) domains.push(trimmed);
        });
      }
      i++;
    } else if (args[i] === '--template') {
      i++;
      const templates = args[i] ? args[i].split(',') : [];
      i++;
      if (args[i] === '--names') {
        i++;
        const namesFile = path.resolve(args[i]);
        const names = fs.readFileSync(namesFile, 'utf-8')
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        for (const name of names) {
          for (const tpl of templates) {
            domains.push(tpl.replace(/\{Name\}/g, name)); 
          }
        }
        i++;
      }
    } else {
      domains.push(args[i]);
      i++;
    }
  }

  // Ensure .com suffix
  return domains.map(d => {
    if (!d.includes('.')) return d + '.com';
    return d;
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node check-domain.js domain1.com domain2.com');
    console.log('  node check-domain.js --file domains.txt');
    console.log('  node check-domain.js --template "{Name}.com,Restaurant{Name}.com" --names names.txt');
    process.exit(1);
  }

  const domains = parseDomains(args);

  if (domains.length === 0) {
    console.log('No domains to check.');
    process.exit(1);
  }

  const startTime = Date.now();
  const results = [];

  // Process in batches of RATE_LIMIT
  for (let i = 0; i < domains.length; i += RATE_LIMIT) {
    const batch = domains.slice(i, i + RATE_LIMIT);
    const batchResults = await Promise.all(batch.map(d => checkDomain(d)));
    results.push(...batchResults);

    // Rate limit: wait 1 second between batches
    if (i + RATE_LIMIT < domains.length) {
      await sleep(1000);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const available = results.filter(r => r.status === 'AVAILABLE').length;
  const taken = results.filter(r => r.status === 'TAKEN').length;
  const errors = results.filter(r => !['AVAILABLE', 'TAKEN'].includes(r.status)).length;

  // Output markdown table
  console.log(`\nDomain Availability Check (${domains.length} domains, ${elapsed}s)\n`);
  console.log('| Domain | Status | Registrar |');
  console.log('|--------|--------|-----------|');

  for (const r of results) {
    const statusIcon = r.status === 'AVAILABLE' ? 'AVAILABLE' : r.status === 'TAKEN' ? 'TAKEN' : r.status;
    console.log(`| ${r.domain} | ${statusIcon} | ${r.registrar} |`);
  }

  console.log(`\nAvailable: ${available}/${domains.length} | Taken: ${taken}/${domains.length}${errors > 0 ? ` | Errors: ${errors}/${domains.length}` : ''}`);

  // Also output JSON for programmatic use
  const jsonOutput = JSON.stringify({ domains: results, summary: { total: domains.length, available, taken, errors, elapsed_seconds: parseFloat(elapsed) } }, null, 2);
  console.log('\n<!-- JSON_OUTPUT');
  console.log(jsonOutput);
  console.log('JSON_OUTPUT -->');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
