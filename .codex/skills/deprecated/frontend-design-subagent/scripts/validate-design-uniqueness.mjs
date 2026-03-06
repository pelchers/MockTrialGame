#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

function arg(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function htmlTokens(content) {
  const tokens = [];
  const bodyClassMatch = content.match(/<body[^>]*class=['"]([^'"]+)['"]/i);
  if (bodyClassMatch) {
    for (const cls of bodyClassMatch[1].split(/\s+/).filter(Boolean)) {
      tokens.push(`body:${cls.toLowerCase()}`);
    }
  }

  const navStyleMatches = content.match(/class=['"][^'"]*\bnav-btn\b[^'"]*['"]/gi) ?? [];
  for (const match of navStyleMatches) {
    const classes = match
      .replace(/class=['"]/, "")
      .replace(/['"]$/, "")
      .split(/\s+/)
      .map((x) => x.toLowerCase());
    for (const cls of classes) {
      if (cls !== "nav-btn") tokens.push(`nav:${cls}`);
    }
  }

  const flowMatches = content.match(/class=['"][^'"]*\bflow-[a-z0-9-]+/gi) ?? [];
  for (const match of flowMatches) {
    const flow = match.match(/flow-[a-z0-9-]+/i)?.[0]?.toLowerCase();
    if (flow) tokens.push(`flow:${flow}`);
  }

  const dataAttrs = [
    "data-profile-id",
    "data-nav-pattern",
    "data-content-flow",
    "data-scroll-mode",
    "data-motion-language",
    "data-hero-treatment"
  ];
  for (const attr of dataAttrs) {
    const rx = new RegExp(`${attr}=['"]([^'"]+)['"]`, "gi");
    let match;
    while ((match = rx.exec(content)) !== null) {
      tokens.push(`meta:${attr}:${String(match[1]).toLowerCase()}`);
    }
  }

  return tokens;
}

function cssVariableTokens(content) {
  const tokens = [];
  const rootMatch = content.match(/:root\s*\{([^}]+)\}/i);
  if (!rootMatch) return tokens;
  const vars = rootMatch[1].match(/--[a-z0-9-]+\s*:\s*[^;]+/gi) ?? [];
  for (const v of vars) {
    tokens.push(`var:${v.replace(/\s+/g, "").toLowerCase()}`);
  }
  return tokens;
}

function freq(tokens) {
  const map = new Map();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}

function cosine(a, b) {
  const all = new Set([...a.keys(), ...b.keys()]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const key of all) {
    const va = a.get(key) ?? 0;
    const vb = b.get(key) ?? 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function jaccard(a, b) {
  const setA = new Set(a.keys());
  const setB = new Set(b.keys());
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const key of setA) {
    if (setB.has(key)) intersection += 1;
  }
  return intersection / union.size;
}

const conceptRoot = path.resolve(arg("--concept-root", ".docs/planning/concepts"));
const threshold = Number(arg("--threshold", "0.62"));

if (!(await exists(conceptRoot))) {
  console.error(`Concept root not found: ${conceptRoot}`);
  process.exit(1);
}

const styles = (await fs.readdir(conceptRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== "_orchestration");

const passes = [];
for (const style of styles) {
  const stylePath = path.join(conceptRoot, style.name);
  const passDirs = (await fs.readdir(stylePath, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("pass-"));

  for (const pass of passDirs) {
    const passPath = path.join(stylePath, pass.name);
    const htmlPath = path.join(passPath, "index.html");
    const cssPath = path.join(passPath, "style.css");
    if (!(await exists(htmlPath)) || !(await exists(cssPath))) {
      console.error(`Missing required files for uniqueness check: ${passPath}`);
      process.exit(2);
    }
    const html = await fs.readFile(htmlPath, "utf8");
    const css = await fs.readFile(cssPath, "utf8");
    const signatureTokens = [...htmlTokens(html), ...cssVariableTokens(css)];

    passes.push({
      id: `${style.name}/${pass.name}`,
      style: style.name,
      pass: pass.name,
      rawTokens: signatureTokens
    });
  }
}

const docFrequency = new Map();
for (const pass of passes) {
  for (const token of new Set(pass.rawTokens)) {
    docFrequency.set(token, (docFrequency.get(token) ?? 0) + 1);
  }
}

const maxShared = Math.max(2, Math.floor(passes.length * 0.6));
for (const pass of passes) {
  const filtered = pass.rawTokens.filter((token) => (docFrequency.get(token) ?? 0) <= maxShared);
  pass.tokens = freq(filtered);
}

const pairs = [];
let maxSimilarity = 0;
for (let i = 0; i < passes.length; i += 1) {
  for (let j = i + 1; j < passes.length; j += 1) {
    const similarity = jaccard(passes[i].tokens, passes[j].tokens);
    maxSimilarity = Math.max(maxSimilarity, similarity);
    pairs.push({
      a: passes[i].id,
      b: passes[j].id,
      similarity: Number(similarity.toFixed(4))
    });
  }
}

pairs.sort((a, b) => b.similarity - a.similarity);
const violations = pairs.filter((pair) => pair.similarity >= threshold);

const report = {
  conceptRoot,
  threshold,
  evaluatedAt: new Date().toISOString(),
  totalPasses: passes.length,
  maxSimilarity: Number(maxSimilarity.toFixed(4)),
  topPairs: pairs.slice(0, 10),
  violations
};

const outPath = path.join(conceptRoot, "uniqueness-report.json");
await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf8");

if (violations.length > 0) {
  console.error(`Uniqueness check failed. ${violations.length} pair(s) exceeded threshold ${threshold}.`);
  process.exit(3);
}

console.log(`Uniqueness check passed for ${passes.length} passes. Max similarity: ${report.maxSimilarity}`);
