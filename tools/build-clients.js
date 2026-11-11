#!/usr/bin/env node
/* Builds 1-to-1 client tracker pages from the shared client-plan engine.
   Usage: node tools/build-clients.js            (builds every clients/*.js)
          node tools/build-clients.js paul-bruce (builds one)
   Each clients/<page>.js holds the plan as plain JS that defines CLIENT and SESSIONS,
   plus a first-line header comment:  // @code 123456  @name Paul Bruce
   Output: pages/<page>.html  (load it in Kajabi with mount.js data-page="<page>") */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), parts = path.join(root, 'templates', 'parts');
const tpl = fs.readdirSync(parts).filter(f => f.endsWith('.html')).sort().map(f => fs.readFileSync(path.join(parts, f), 'utf8')).join('');
const only = process.argv[2];
fs.readdirSync(path.join(root, 'clients')).filter(f => f.endsWith('.js')).forEach(f => {
  const page = f.replace(/\.js$/, '');
  if (only && only !== page) return;
  const src = fs.readFileSync(path.join(root, 'clients', f), 'utf8');
  const code = (src.match(/@code\s+(\d+)/) || [])[1], name = (src.match(/@name\s+([^\n@]+)/) || [])[1];
  if (!code || !name) throw new Error(f + ': header needs "// @code <number>  @name <client name>"');
  const out = tpl.replace('/*@@CLIENT@@*/', () => src.trim()).replace('@@CODE@@', code).replace('@@NAME@@', name.trim());
  fs.writeFileSync(path.join(root, 'pages', page + '.html'), out);
  console.log('built pages/' + page + '.html  (code ' + code + ', ' + name.trim() + ')');
});
