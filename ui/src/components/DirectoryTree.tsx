import type { IndexDoc, DirectoryNode } from '../lib/loadIndex';
import { navigateToSchema } from '../router';

export type TreeOptions = {
  filter?: string;
  hiddenFolderNames?: Set<string>;
  onFolderOpen?: (path: string) => void;
};

function matchesFilter(name: string, filter?: string){
  if(!filter) return true; return name.toLowerCase().includes(filter.trim().toLowerCase());
}

function isHidden(node: DirectoryNode, hidden?: Set<string>){
  return node.type === 'folder' && !!hidden && hidden.has(node.name);
}

function renderNode(node: DirectoryNode, ul: HTMLElement, opts: TreeOptions){
  if (isHidden(node, opts.hiddenFolderNames)) return;
  const li = document.createElement('li');
  if (node.type === 'folder'){
    const btn = document.createElement('button');
    btn.textContent = '📁 ' + node.name;
    btn.addEventListener('click', ()=> opts.onFolderOpen?.(node.path));
    li.appendChild(btn);
    const childUl = document.createElement('ul');
    (node.children||[]).filter(c=>matchesFilter(c.name, opts.filter)).forEach(c=>renderNode(c, childUl, opts));
    li.appendChild(childUl);
  } else {
    const btn = document.createElement('button');
    btn.textContent = '📄 ' + node.name;
    btn.addEventListener('click', ()=> navigateToSchema(node.path));
    li.appendChild(btn);
  }
  ul.appendChild(li);
}

export function renderDirectoryTree(container: HTMLElement, index: IndexDoc, opts: TreeOptions = {}){
  const ul = document.createElement('ul');
  ul.setAttribute('role','tree');
  (index.root.children||[]).filter(c=>matchesFilter(c.name, opts.filter)).forEach(c=>renderNode(c, ul, opts));
  container.replaceChildren(ul);
}

export default renderDirectoryTree;
