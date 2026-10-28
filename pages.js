'use strict';
(() => {
  const topics = ['Product enquiry','Website feedback','Accessibility issue','Project collaboration','General question'];
  function validateEnquiry(input) {
    const fields = ['name','email','topic','subject','message'];
    const data = Object.fromEntries(fields.map(key => [key,String(input[key] || '').trim()]));
    const errors = {};
    if(data.name.length < 2 || data.name.length > 100) errors.name = 'Enter your name (2–100 characters).';
    if(data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
    if(!topics.includes(data.topic)) errors.topic = 'Choose a topic for your enquiry.';
    if(data.subject.length < 3 || data.subject.length > 150) errors.subject = 'Enter a subject (3–150 characters).';
    if(data.message.length < 20 || data.message.length > 2000) errors.message = 'Enter a message between 20 and 2,000 characters.';
    return {data,errors,valid:Object.keys(errors).length === 0};
  }
  function formatEnquiry(d) { return `EDUMARTH ENQUIRY\n\nName: ${d.name}\nEmail: ${d.email}\nTopic: ${d.topic}\nSubject: ${d.subject}\n\n${d.message}\n\nPrepared locally. This enquiry has not been sent.`; }
  window.EduMarthContact = Object.freeze({validateEnquiry,formatEnquiry});
  const menu = document.getElementById('menuToggle');
  const nav = document.getElementById('navigation');
  // Catalogue pages already handle their own menu and year.
  if(menu && nav) {
    const close = () => {nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');};
    menu.addEventListener('click',() => {const open=menu.getAttribute('aria-expanded') !== 'true';nav.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open ? 'Close navigation' : 'Open navigation');});
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click',close));
    document.addEventListener('keydown',e => {if(e.key === 'Escape')close();});
    const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  }
  const dialog = document.getElementById('contactDialog');
  if(dialog) {
    document.querySelectorAll('[data-open-contact]').forEach(b => b.addEventListener('click',() => dialog.showModal()));
    dialog.querySelector('[data-close-contact]').addEventListener('click',() => dialog.close());
    dialog.addEventListener('click',e => {if(e.target !== dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  }
  document.querySelectorAll('.contact-form').forEach(form => {
    let draft='';
    let requestKey=crypto.randomUUID();
    let submitting=false;
    const submitButton=form.querySelector('button[type=submit]');
    const get = name => form.elements.namedItem(name);
    const result = form.querySelector('.enquiry-result');
    const summary = form.querySelector('.form-error-summary');
    const preview = form.querySelector('.enquiry-preview');
    const count = form.querySelector('#message-count');
    const status = form.querySelector('.copy-status');
    const names = ['name','email','topic','subject','message'];
    function clearErrors() {summary.hidden=true;summary.textContent='';names.forEach(name => {get(name).removeAttribute('aria-invalid');const help=name==='message' ? 'message-help message-count' : '';if(help)get(name).setAttribute('aria-describedby',help);else get(name).removeAttribute('aria-describedby');form.querySelector(`#error-${name}`).textContent='';});}
    form.addEventListener('submit', async e => {
      e.preventDefault();if(submitting)return;clearErrors();
      const {data,errors,valid}=validateEnquiry(Object.fromEntries(names.map(name => [name,get(name).value])));
      if(!valid) {
        draft='';result.hidden=true;
        Object.entries(errors).forEach(([name,error]) => {get(name).setAttribute('aria-invalid','true');get(name).setAttribute('aria-describedby',`error-${name}${name==='message' ? ' message-help message-count' : ''}`);form.querySelector(`#error-${name}`).textContent=error;});
        summary.textContent=`Please correct ${Object.keys(errors).length} ${Object.keys(errors).length===1 ? 'field' : 'fields'} below. ${Object.values(errors).join(' ')}`;summary.hidden=false;get(Object.keys(errors)[0]).focus();return;
      }
      submitting=true;submitButton.disabled=true;submitButton.textContent='Saving…';
      const controls=Array.from(form.querySelectorAll('input,select,textarea,button[type=reset]'));
      controls.forEach(control=>control.disabled=true);
      try {
        const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:JSON.stringify(data)});
        const saved=await response.json();
        if(!response.ok)throw new Error(saved.error||'Unable to save your enquiry.');
        draft=formatEnquiry(data).replace('Prepared locally. This enquiry has not been sent.',`Saved enquiry #${saved.id}. No email has been sent.`);
        preview.textContent=draft;status.textContent=saved.message;result.hidden=false;result.focus();
      } catch(error) {
        summary.textContent='Your enquiry could not be confirmed. '+error.message+' Keep your message and try again; retries will not create duplicate enquiries.';
        summary.hidden=false;summary.focus();
      } finally {
        submitting=false;submitButton.disabled=false;submitButton.textContent='Submit enquiry';
        controls.forEach(control=>control.disabled=false);
      }
    });
    form.addEventListener('input',() => {requestKey=crypto.randomUUID();count.textContent=`${get('message').value.length.toLocaleString('en-AU')} / 2,000`;if(draft){draft='';result.hidden=true;status.textContent='';}});
    form.addEventListener('change',() => {requestKey=crypto.randomUUID();if(draft){draft='';result.hidden=true;}});
    form.addEventListener('reset',() => {requestKey=crypto.randomUUID();draft='';result.hidden=true;status.textContent='';count.textContent='0 / 2,000';clearErrors();});
    form.querySelector('[data-copy-enquiry]').addEventListener('click',async () => {
      if(!draft)return;
      try {await navigator.clipboard.writeText(draft);status.textContent='Enquiry receipt copied.';}
      catch {const selection=window.getSelection();if(selection){const range=document.createRange();range.selectNodeContents(preview);selection.removeAllRanges();selection.addRange(range);}status.textContent='Automatic copying is unavailable. The text is selected; use Copy or download the .txt file.';}
    });
    form.querySelector('[data-download-enquiry]').addEventListener('click',() => {
      if(!draft)return;
      const blob=new Blob([draft],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='EduMarth_Enquiry.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(() => URL.revokeObjectURL(url),1000);status.textContent='Enquiry receipt downloaded. No email has been sent.';
    });
  });
})();
