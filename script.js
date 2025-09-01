// NovaSite JS (JavaScript animations & helpers)
const FORMSPREE_CONTACT_ENDPOINT = "https://formspree.io/f/xovlgzzy"; // ← ここに Formspree のフォームURLを入れると /contact.html が送信可能になります

// Simple scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target);} });
},{threshold:.1});
revealEls.forEach(el=>io.observe(el));

// Typewriter for hero
function typewriter(el, text, speed=55){
  let i=0; el.textContent="";
  const tick=()=>{
    if(i<=text.length){ el.textContent = text.slice(0,i); i++; requestAnimationFrame(()=>setTimeout(tick, speed)); }
  }; tick();
}
document.querySelectorAll('[data-typewriter]').forEach(el=>typewriter(el, el.dataset.typewriter));

// Repeatable groups (for create.html)
function setupRepeatable(containerId, templateId, addBtnId){
  const container = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  const addBtn = document.getElementById(addBtnId);
  if(!container || !template || !addBtn) return;
  const addItem = ()=>{
    const node = template.content.cloneNode(true);
    container.appendChild(node);
  };
  addBtn.addEventListener('click', addItem);
  // Start with one item
  if(container.children.length===0) addItem();
}
setupRepeatable('top-photos', 'tpl-photo', 'btn-add-top-photo');
setupRepeatable('main-visuals', 'tpl-main-visual', 'btn-add-main-visual');
setupRepeatable('menu-items', 'tpl-menu-item', 'btn-add-menu-item');

// Contact form (contact.html)
const contactForm = document.getElementById('contact-form');
if(contactForm){
  contactForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const endpoint = FORMSPREE_CONTACT_ENDPOINT.trim();
    if(!endpoint){ alert('Formspree のURLを script.js の FORMSPREE_CONTACT_ENDPOINT に設定してください。'); return; }
    const data = new FormData(contactForm);
    const res = await fetch(endpoint, { method:'POST', body:data, headers:{ 'Accept':'application/json' } });
    if(res.ok){ alert('送信しました。ありがとうございます！'); contactForm.reset(); }
    else { alert('送信に失敗しました。URLをご確認ください。'); }
  });
}


// ハンバーガーメニュー
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if(navToggle && navLinks){
  navToggle.addEventListener('click', ()=>{
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
}


// === Mobile nav UX enhancements (2025-09-01) ===
(function(){
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if(!toggle || !links) return;

  const openMenu = ()=>{
    toggle.classList.add('open');
    links.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden'; // prevent body scroll under drawer
  };
  const closeMenu = ()=>{
    toggle.classList.remove('open');
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  };

  // Toggle click
  toggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(links.classList.contains('open')) closeMenu(); else openMenu();
  });

  // Close when clicking outside the drawer
  document.addEventListener('click', (e)=>{
    if(!links.classList.contains('open')) return;
    if(links.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });

  // Close on ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && links.classList.contains('open')) closeMenu();
  });

  // Close after clicking a link
  links.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> closeMenu());
  });
})();
