export function renderBreadcrumbs(container: HTMLElement, parts: string[]){
  if (!parts.length){ container.textContent = 'Root'; return; }
  container.textContent = ['Root', ...parts].join(' / ');
}

export default renderBreadcrumbs;
