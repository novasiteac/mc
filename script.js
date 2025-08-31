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



// --- 共通: フォームデータを整形する関数 ---
function formatFormData(formData) {
  const labels = {
    "client_name": "お名前",
    "client_email": "メールアドレス",
    "shop_name": "店舗名",
    "bg_color": "背景色",
    "catchcopy": "キャッチコピー",
    "intro": "紹介文",
    "faq": "よくある質問",
    "address": "住所",
    "hours": "営業時間",
    "tel": "電話番号",
    "email": "メール",
    "sns_instax": "Instagram・X",
    "sns_fbly": "Facebook・LINE",
    "sns_yt": "YouTube",
    "concept": "コンセプト説明",
    "story": "店舗の歴史",
    "menu_name[]": "メニュー名",
    "menu_desc[]": "メニュー説明",
    "formspree_link": "Formspreeリンク",
    "others": "その他",
    "plan": "プラン"
  };
  let output = "";
  for (let [key, value] of formData.entries()) {
    if (!value) value = "（未入力）";
    output += (labels[key] || key) + ": " + value + "\n";
  }
  return output;
}

// create.html のフォーム送信処理
const createForm = document.querySelector('form[action="/api/upload"]');
if(createForm){
  createForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const endpoint = FORMSPREE_CONTACT_ENDPOINT.trim();
    if(!endpoint){ alert('Formspree のURLを script.js に設定してください。'); return; }
    const formData = new FormData(createForm);
    const textBody = formatFormData(formData);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'text/plain' },
      body: textBody
    });
    if(res.ok){ alert('送信しました。ありがとうございます！'); createForm.reset(); }
    else { alert('送信に失敗しました。'); }
  });
}
