document.addEventListener("DOMContentLoaded", () => {
  const FORMSPREE_CONTACT_ENDPOINT = "https://formspree.io/f/xovlgzzy";

  function setupRepeatable(sectionId, templateId, addBtnId) {
    const section = document.getElementById(sectionId);
    const template = document.getElementById(templateId);
    const addBtn = document.getElementById(addBtnId);
    if (!section || !template || !addBtn) return;
    addBtn.addEventListener("click", () => {
      const clone = template.content.cloneNode(true);
      section.appendChild(clone);
    });
  }

  setupRepeatable("bg-photos", "bg-photo-template", "add-bg-btn");
  setupRepeatable("menu-items", "menu-item-template", "add-menu-btn");

  const contactForm = document.querySelector("form[action='/contact']");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      fetch(FORMSPREE_CONTACT_ENDPOINT, { method: "POST", body: data })
        .then(() => alert("送信しました！"))
        .catch(() => alert("エラーが発生しました"));
    });
  }
});
