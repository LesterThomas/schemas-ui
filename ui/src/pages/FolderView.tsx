import type { IndexDoc, DirectoryNode } from '../lib/loadIndex';
import renderBreadcrumbs from '../components/Breadcrumbs';
import renderDirectoryTree from '../components/DirectoryTree';

export type FolderViewOptions = {
  filter?: string;
  hiddenFolderNames?: Set<string>;
};

export function renderFolderView(rootEl: HTMLElement, crumbsEl: HTMLElement, index: IndexDoc, currentPath: string[], opts: FolderViewOptions = {}){
  renderBreadcrumbs(crumbsEl, currentPath);
  renderDirectoryTree(rootEl, index, {
    filter: opts.filter,
    hiddenFolderNames: opts.hiddenFolderNames,
    onFolderOpen: (path)=>{
      // update crumbs only; router change is handled elsewhere by hash
      const parts = path.split('/').filter(Boolean);
      renderBreadcrumbs(crumbsEl, parts);
    }
  });
}

export default renderFolderView;
