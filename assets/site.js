'use strict';
const menu = document.getElementById('menu');
const nav = document.getElementById('navlinks');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function closeMenu(restoreFocus = false) {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.textContent = 'Menu ☰';
  if (restoreFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Close ✕' : 'Menu ☰';
  if (open) nav.querySelector('a').focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
});
document.addEventListener('click', event => {
  if (event.target instanceof Element && !event.target.closest('.nav')) closeMenu();
});
document.addEventListener('focusin', event => {
  if (event.target instanceof Element && !event.target.closest('.nav')) closeMenu();
});
window.matchMedia('(min-width: 1101px)').addEventListener('change', () => closeMenu());
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  closeMenu();
  const target = document.querySelector(/** @type {HTMLAnchorElement} */ (a).hash);
  if (target instanceof HTMLElement) { target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); }
}));

const form = /** @type {HTMLFormElement} */ (document.getElementById('contactForm'));
const formStatus = document.getElementById('formstatus');
const panel = document.getElementById('draft-panel');
const service = /** @type {HTMLSelectElement} */ (document.getElementById('service'));
function invalidateDraft() { panel.hidden = true; formStatus.textContent = ''; }
form.addEventListener('input', event => {
  if ((event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) && !('readOnly' in event.target && event.target.readOnly)) {
    event.target.removeAttribute('aria-invalid');
    event.target.removeAttribute('aria-describedby');
    if (event.target.id === 'phone') event.target.setAttribute('aria-describedby','phone-hint');
    invalidateDraft();
  }
});
form.addEventListener('change', invalidateDraft);
document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {
  const requested = /** @type {HTMLElement} */ (a).dataset.service;
  if ([...service.options].some(o => o.value === requested)) service.value = requested;
  else if (/help me choose/i.test(requested)) service.value = 'Help me choose';
  else if (/website/i.test(requested)) service.value = 'Website Development';
  else if (/automation/i.test(requested)) service.value = 'AI Automation & CRM';
  else if (/marketing/i.test(requested)) service.value = 'Lead Generation';
  else service.value = 'Full-service package';
  invalidateDraft();
}));
/** @type {HTMLButtonElement} */ (form.querySelector('button[type="submit"]')).disabled = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  panel.hidden = true;
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  const values = Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,String(value).trim()]));
  let invalid;
  let error;
  if (!values.name) { invalid = 'name'; error = 'Please enter your name.'; }
  else if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || !(/** @type {HTMLInputElement} */ (form.querySelector('input[type=email]'))).validity.valid) { invalid = 'email'; error = 'Please enter a valid email address, such as name@example.com.'; }
  else if (values.phone && (!/^\+?[\d\s().-]+$/.test(values.phone) || values.phone.replace(/\D/g,'').length < 7 || values.phone.replace(/\D/g,'').length > 15)) { invalid = 'phone'; error = 'Please enter 7–15 phone digits, with an optional + country code, or leave phone blank.'; }
  else if (!values.message) { invalid = 'message'; error = 'Please tell us about your project.'; }
  if (invalid) {
    formStatus.textContent = error;
    const field = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (form.elements.namedItem(invalid));
    field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby', (invalid === 'phone' ? 'phone-hint ' : '') + 'formstatus');
    field.focus();
    return;
  }
  const draft = `Name: ${values.name}\nBusiness: ${values.business || 'Not provided'}\nEmail: ${values.email}\nPhone: ${values.phone || 'Not provided'}\nService: ${values.service || 'Help me choose'}\nBudget: ${values.budget || 'Not specified'}\n\nProject details:\n${values.message}`;
  /** @type {HTMLTextAreaElement} */ (document.getElementById('enquiry-draft')).value = draft;
  /** @type {HTMLAnchorElement} */ (document.getElementById('draft-email')).href = 'mailto:varunsaiofficial45@gmail.com?subject=' + encodeURIComponent('Flownix project enquiry: ' + (values.service || 'New project')) + '&body=' + encodeURIComponent(draft);
  /** @type {HTMLAnchorElement} */ (document.getElementById('draft-whatsapp')).href = 'https://wa.me/918610624572?text=' + encodeURIComponent(draft);
  panel.hidden = false;
  formStatus.textContent = 'Draft prepared. Nothing has been sent. Choose email or WhatsApp below to send it.';
  document.getElementById('draft-title').focus({preventScroll:true});
  panel.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'nearest'});
});
document.getElementById('copy-enquiry').addEventListener('click', async event => {
  const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
  button.disabled = true;
  try {
    await navigator.clipboard.writeText(/** @type {HTMLTextAreaElement} */ (document.getElementById('enquiry-draft')).value);
    formStatus.textContent = 'Enquiry copied. Paste it into your email or WhatsApp and send it.';
  } catch {
    const draft = /** @type {HTMLTextAreaElement} */ (document.getElementById('enquiry-draft'));
    draft.focus(); draft.select();
    formStatus.textContent = 'Copy was unavailable. Your draft is selected; use your device’s Copy command.';
  } finally { button.disabled = false; }
});

document.querySelectorAll('.service-carousel-row').forEach(row => {
  const lane = /** @type {HTMLElement} */ (row.querySelector('.service-lane'));
  const cards = [...row.querySelectorAll('.service-track > .service')];
  const prev = /** @type {HTMLButtonElement} */ (row.querySelector('button[data-direction="prev"]'));
  const next = /** @type {HTMLButtonElement} */ (row.querySelector('button[data-direction="next"]'));
  prev.setAttribute('aria-controls',lane.id); next.setAttribute('aria-controls',lane.id);
  let target = lane.scrollLeft;
  let movingUntil = 0;
  function maximum() { return Math.max(0,lane.scrollWidth-lane.clientWidth); }
  function update() { prev.disabled = target <= 1; next.disabled = target >= maximum()-1; }
  function move(direction) {
    if (performance.now() > movingUntil) target = lane.scrollLeft;
    const gap = parseFloat(getComputedStyle(row.querySelector('.service-track')).gap) || 0;
    const step = cards[0].getBoundingClientRect().width + gap;
    target = Math.max(0,Math.min(maximum(), target + direction*step));
    movingUntil = performance.now()+650;
    lane.scrollTo({left:target,behavior:reducedMotion.matches?'instant':'smooth'});
    update();
  }
  prev.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
  lane.addEventListener('keydown',event=>{
    if (event.target !== lane) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key==='ArrowRight'?1:-1); }
  });
  lane.addEventListener('scrollend',()=>{target=lane.scrollLeft; movingUntil=0; update();});
  let scrollTimer;
  lane.addEventListener('scroll',()=>{
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{target=lane.scrollLeft;movingUntil=0;update();},180);
  },{passive:true});
  ['pointerdown','wheel','touchstart'].forEach(name=>lane.addEventListener(name,()=>{movingUntil=0;target=lane.scrollLeft;},{passive:true}));
  new ResizeObserver(()=>{target=Math.min(lane.scrollLeft,maximum());update();}).observe(lane);
  update();
});
document.getElementById('year').textContent = String(new Date().getFullYear());
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }),{threshold:.1});
  document.querySelectorAll('.section-head,.band,.about-box').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
}
