#!/usr/bin/env node
/* Builds 1-to-1 client tracker pages from the shared client-plan engine.
   Usage: node tools/build-clients.js            (builds every clients/*.js)
          node tools/build-clients.js paul-bruce (builds one)
   Each clients/<page>.js holds the plan as plain JS that defines CLIENT and SESSIONS,
   plus a first-line header comment:  // @code 123456  @name Paul Bruce        (1-to-1 page, page-number sign-in)
                                   or // @plan build-my-plan  @planName Build My Plan  @pre src/plan-builder.js
   @plan pages sign in with email + PIN. @pre lists repo scripts to load before the plan (space-separated).
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
  const plan = (src.match(/@plan\s+([a-z0-9-]+)/) || [])[1], planName = (src.match(/@planName\s+([^\n@]+)/) || [])[1];
  const pre = ((src.match(/@pre\s+([^\n@]+)/) || [])[1] || '').trim().split(/\s+/).filter(Boolean);
  let sync;
  if (code && name) sync = 'MGSync.init({code:' + JSON.stringify(code) + ',name:' + JSON.stringify(name.trim()) + '})';
  else if (plan) sync = 'MGSync.init({plan:' + JSON.stringify(plan) + ',planName:' + JSON.stringify((planName || plan).trim()) + '})';
  else throw new Error(f + ': header needs "// @code <number>  @name <client name>" or "// @plan <id>  @planName <name>"');
  const marker = '<script>\n/* ================= LOAD STEPS';
  if (!tpl.includes(marker)) throw new Error('template marker missing');
  let out = tpl.replace(marker, () => pre.map(p => '<script charset="utf-8" src="{{BASE}}' + p + '"></script>\n').join('') + marker)
    .replace('/*@@CLIENT@@*/', () => src.trim()).replace('@@SYNC@@', () => sync);
  fs.writeFileSync(path.join(root, 'pages', page + '.html'), out);
  console.log('built pages/' + page + '.html  (' + (code ? 'code ' + code + ', ' + name.trim() : 'plan ' + plan) + ')');
});
