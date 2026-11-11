/* Loads a tracker page from this repo into a Kajabi Custom Code block.
   Kajabi block:
   <div id="mg-root"></div>
   <script src="https://cdn.jsdelivr.net/gh/joemacrogolf/macro-golf-trackers@<commit>/src/mount.js" data-page="pure-power-gym"></script>
   The page file is pages/<data-page>.html from the same commit. "{{BASE}}" inside it becomes this commit's base URL. */
(function(){
  var me=document.currentScript;if(!me)return;
  var base=me.src.replace(/src\/mount\.js(\?.*)?$/,''),page=me.getAttribute('data-page');
  var root=document.getElementById(me.getAttribute('data-root')||'mg-root');
  if(!root){root=document.createElement('div');me.parentNode.insertBefore(root,me)}
  var css='#mg-load{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#F4F1EA;color:#0B0B0B;font:600 15px Inter,system-ui,sans-serif;text-align:center;padding:24px}'+
    '#mg-load i{width:42px;height:42px;border:5px solid #0B0B0B;border-top-color:#FFD900;border-radius:50%;animation:mgspin .8s linear infinite}@keyframes mgspin{to{transform:rotate(360deg)}}'+
    '#mg-load button{min-height:48px;padding:0 20px;border:0;background:#FFD900;color:#0B0B0B;font:400 18px Anton,Impact,sans-serif;text-transform:uppercase;cursor:pointer}'+
    '@media (prefers-reduced-motion:reduce){#mg-load i{animation:none}}';
  function loading(){root.innerHTML='<style>'+css+'</style><div id="mg-load" role="status"><i aria-hidden="true"></i>Loading your plan…</div>'}
  function failed(){root.innerHTML='<style>'+css+'</style><div id="mg-load" role="alert">Could not load your plan. Check your connection.<button type="button">Try again</button></div>';
    root.querySelector('button').addEventListener('click',go)}
  function run(list,i){if(i>=list.length)return;var old=list[i],s=document.createElement('script');
    for(var a=0;a<old.attributes.length;a++)s.setAttribute(old.attributes[a].name,old.attributes[a].value);
    if(old.src){s.onload=s.onerror=function(){run(list,i+1)};document.body.appendChild(s)}
    else{s.text=old.textContent;document.body.appendChild(s);run(list,i+1)}}
  function go(){loading();
    fetch(base+'pages/'+page+'.html').then(function(r){if(!r.ok)throw new Error(r.status);return r.text()}).then(function(html){
      var t=document.createElement('template');t.innerHTML=html.split('{{BASE}}').join(base);
      var scripts=[].slice.call(t.content.querySelectorAll('script'));scripts.forEach(function(s){s.parentNode.removeChild(s)});
      root.innerHTML='';root.appendChild(t.content);run(scripts,0)}).catch(failed)}
  go();
})();
