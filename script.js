
const d=document.getElementById('dlg'),s1=document.getElementById('step1'),s2=document.getElementById('step2'),s3=document.getElementById('step3');
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{s1.style.display='';s2.style.display='none';s3.style.display='none';['cform','wform'].forEach(i=>{const f=document.getElementById(i);f.reset();f.style.display=''});['cok','wok'].forEach(i=>document.getElementById(i).style.display='');['wl','ww'].forEach(i=>document.getElementById(i).removeAttribute('href'));d.showModal()});
d.querySelector('[data-close]').onclick=()=>d.close();
d.addEventListener('click',e=>{if(e.target===d)d.close()});
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='v'){d.close();location.hash='vendors'}else{s1.style.display='none';(g==='c'?s2:s3).style.display=''}});
document.getElementById('cform').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const when=[f.get('date'),f.get('time')].filter(Boolean).join(' ')||'Flexible';const m='Hi Sau Solution, I need a '+f.get('sv')+'.\nName: '+f.get('n')+'\nPhone: '+f.get('p')+'\nArea: '+f.get('a')+'\nWhen: '+when+'\nDetails: '+(f.get('d')||'-');document.getElementById('wl').href='https://wa.me/919963182721?text='+encodeURIComponent(m);e.target.style.display='none';document.getElementById('cok').style.display='block'};
document.getElementById('wform').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const m='Hi Sau Solution, please notify me when the app launches.\nName: '+f.get('n')+'\nPhone: '+f.get('p')+'\nArea: '+f.get('a');document.getElementById('ww').href='https://wa.me/919963182721?text='+encodeURIComponent(m);e.target.style.display='none';document.getElementById('wok').style.display='block'};
document.getElementById('vform').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const m='Hi Sau Solution, I would like to register as a vendor.\nName: '+f.get('n')+'\nPhone: '+f.get('p')+'\nSkill or shop type: '+f.get('s')+'\nArea: '+f.get('a');document.getElementById('vw').href='https://wa.me/919963182721?text='+encodeURIComponent(m);e.target.querySelector('.ok').style.display='block';e.target.querySelector('button').style.display='none'};
const svc={'Welders':'Welder','Electricians':'Electrician','Plumbers':'Plumber','Mechanics':'Mechanic','Carpenters':'Carpenter','Painters':'Painter','Stationery shops':'Stationery items','And many more':'Other'};
document.querySelectorAll('.cat').forEach(c=>{c.tabIndex=0;c.setAttribute('role','button');c.style.cursor='pointer';const go=()=>{document.querySelector('[data-open]').click();s1.style.display='none';s2.style.display='';document.querySelector('#cform select').value=svc[c.lastChild.textContent.trim()]||'Other'};c.onclick=go;c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
const tg=document.getElementById('tg');
function setTheme(theme,save=false){document.documentElement.dataset.theme=theme;const dark=theme==='dark';tg.textContent=dark?'☀':'☾';tg.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');if(save){try{localStorage.setItem('sau-theme',theme)}catch{}}}
const colorPreference=window.matchMedia('(prefers-color-scheme: dark)');
let themeOverride=false;
try{const savedTheme=localStorage.getItem('sau-theme');if(savedTheme==='dark'||savedTheme==='light'){themeOverride=true;setTheme(savedTheme)}else if(colorPreference.matches)setTheme('dark')}catch{if(colorPreference.matches)setTheme('dark')}
colorPreference.addEventListener?.('change',event=>{if(!themeOverride)setTheme(event.matches?'dark':'light')});
tg.addEventListener('click',()=>{themeOverride=true;setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true)});
const hd=document.querySelector('header'),pg=document.getElementById('pg');
addEventListener('scroll',()=>{const h=document.documentElement;hd.classList.toggle('sc',scrollY>10);pg.style.width=(scrollY/Math.max(1,h.scrollHeight-innerHeight)*100)+'%'},{passive:true});
const SV=[['Welder','welder welding fabrication gate grill'],['Electrician','electrician electric wiring fan light switch'],['Plumber','plumber plumbing pipe tap leak water'],['Mechanic','mechanic bike car repair garage'],['Carpenter','carpenter wood furniture door'],['Painter','painter painting paint wall'],['Stationery items','stationery pen book paper print notebook']];
const q=document.getElementById('q'),sg=document.getElementById('sg');
function req(v,t){document.querySelector('[data-open]').click();s1.style.display='none';s2.style.display='';const f=document.getElementById('cform');f.sv.value=v;if(t)f.d.value=t}
function match(){const t=q.value.trim().toLowerCase();return t?SV.filter(s=>s[1].includes(t)||s[0].toLowerCase().includes(t)):[]}
q.oninput=()=>{const m=match();sg.innerHTML='';if(!q.value.trim()){sg.style.display='none';return}(m.length?m.map(s=>[s[0],s[0]]):[['Other','Ask for “'+q.value.trim()+'”']]).forEach(([v,l])=>{const li=document.createElement('li');li.textContent=l;li.onclick=()=>{sg.style.display='none';req(v,v==='Other'?q.value.trim():'')};sg.appendChild(li)});sg.style.display='block'};
document.getElementById('qb').onclick=()=>{const m=match();req(m.length?m[0][0]:'Other',m.length?'':q.value.trim())};
q.onkeydown=e=>{if(e.key==='Enter')document.getElementById('qb').click()};
document.addEventListener('click',e=>{if(!e.target.closest('.search'))sg.style.display='none'});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const el=e.target;el.classList.add('in');setTimeout(()=>{el.classList.remove('rv','in');el.style.transitionDelay=''},1400);io.unobserve(el)}}),{threshold:.12});
document.querySelectorAll('section h2,.cat,.step,.vcard,#vform,details,.report').forEach((el,i)=>{el.classList.add('rv');el.style.transitionDelay=(i%4)*70+'ms';io.observe(el)});

document.querySelectorAll('#dlg a[href^="#"]').forEach(a=>a.addEventListener("click",()=>d.close()));

const dateField=document.querySelector('#cform input[name=date]');const today=new Date();dateField.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
