export function bindJsonToggle(button: HTMLElement, targetPre: HTMLElement){
  button.addEventListener('click', ()=>{
    const hidden = targetPre.hasAttribute('hidden');
    if(hidden){ targetPre.removeAttribute('hidden'); button.setAttribute('aria-expanded','true'); button.textContent = 'Hide JSON'; }
    else { targetPre.setAttribute('hidden',''); button.setAttribute('aria-expanded','false'); button.textContent = 'Show JSON'; }
  });
}

export default bindJsonToggle;
