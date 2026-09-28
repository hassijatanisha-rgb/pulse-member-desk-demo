const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const htmlFiles = ['index.html', 'privacy.html', 'support.html'];
const html = htmlFiles.map(read).join('\n');
const app = read('app.js');
const styles = `${read('styles.css')}\n${read('brand-overrides.css')}`;

for (const name of htmlFiles) {
  const source = read(name);
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|#|mailto:|tel:)/.test(target)) continue;
    assert(fs.existsSync(path.join(root, target)), `${name} has a missing local asset: ${target}`);
  }
}

for (const marker of ['CONCEPT DEMO · FICTIONAL DATA', 'nothing leaves this browser', 'No affiliation is implied', 'privacy.html', 'support.html']) assert(html.includes(marker), marker);
for (const marker of ['sessionStorage.setItem', 'crypto.randomUUID', 'Reset demo']) assert(`${app}${html}`.includes(marker), marker);
for (const forbidden of ['localStorage', 'script.google.com/macros', 'google.script.run', 'fonts.googleapis.com', '<form action=', 'OWNER_PASSWORD', 'staff-token']) assert(!`${html}${app}${styles}`.includes(forbidden), forbidden);
const publishedNames = fs.readdirSync(root);
for (const privateFile of ['Code.gs', 'Desk.html', 'Index.html', 'SETUP.md', 'OPERATIONS.md']) assert(!publishedNames.includes(privateFile), privateFile);
assert(html.includes('name="robots" content="noindex"'));
assert(read('privacy.html').includes('no analytics'));
assert(read('support.html').includes('website-rescue-sprint/#contact'));

console.log('Pulse Member Desk public artifact: 25+ checks passed');
