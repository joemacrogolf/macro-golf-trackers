/* tool-row.js: the H2H, Leaders and My PBs buttons used to float in the bottom-right corner, right where a right thumb scrolls.
   This puts them in one row near the top of the page instead (under the page header), so nothing floats over the game.
   It moves the buttons the other scripts make (h2h.js .h2h-tab, leaderboard.js .lb-tab, the page's .ux-pbtab), so their own
   click handlers keep working. Loaded by golfwarm.js on every golf game and test. */
(function(){
if(window.MGToolRow)return;window.MGToolRow=true;
var SEL=['.h2h-tab','.lb-tab','.ux-pbtab'];
function css(){if(document.getElementById('mgtr-css'))return;var s=document.createElement('style');s.id='mgtr-css';s.textContent=[
 '.mgtr{display:flex;gap:8px;margin:0;padding:10px max(16px,env(safe-area-inset-left,0px));background:#0B0B0B;border-bottom:1px solid rgba(244,241,234,.12)}',
 '.mgtr>button{position:static!important;inset:auto!important;transform:none!important;flex:1 1 0;min-width:0!important;min-height:44px!important;margin:0!important;padding:0 8px!important;justify-content:center!important;box-shadow:none!important;border:1px solid rgba(244,241,234,.22)!important;border-top:3px solid #FFD900!important;font-size:15px!important;white-space:nowrap;display:inline-flex!important}',
 'html.h2h-on .mgtr>.h2h-tab{display:none!important}'].join('');document.head.appendChild(s)}
function row(){var r=document.querySelector('.mgtr');if(r)return r;var root=document.getElementById('mg-root');if(!root)return null;
  r=document.createElement('div');r.className='mgtr';r.setAttribute('role','toolbar');r.setAttribute('aria-label','Head to head, leaderboard and personal bests');
  /* under the page's own header if it has one, otherwise at the top (after the day-streak bar) */
  var h=root.querySelector('header'),st=root.querySelector('.mgd');
  if(h&&h.parentNode)h.parentNode.insertBefore(r,h.nextSibling);else if(st)st.parentNode.insertBefore(r,st.nextSibling);else root.insertBefore(r,root.firstChild);
  return r}
function gather(){var btns=SEL.map(function(q){return document.querySelector(q)});if(!btns.some(Boolean))return;css();var r=row();if(!r)return;
  /* always in the same order: H2H, Leaders, My PBs */
  var cur=[].slice.call(r.children),want=btns.filter(Boolean);if(cur.length!==want.length||want.some(function(b,i){return cur[i]!==b}))want.forEach(function(b){r.appendChild(b)})}
var n=0;(function tick(){gather();if(++n<40)setTimeout(tick,400)})();
if(window.MutationObserver)new MutationObserver(function(){if(SEL.some(function(q){var b=document.querySelector(q);return b&&!(b.parentNode&&b.parentNode.classList&&b.parentNode.classList.contains('mgtr'))}))gather()}).observe(document.body,{childList:true});
})();
