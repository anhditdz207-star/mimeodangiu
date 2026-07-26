/* ==========================================================
   ui.js — DOM rendering & interactions for popup, sidebar,
   viewer, results list and toast notifications.
   ========================================================== */

const UI = (() => {
  const els = {
    app: document.getElementById('app'),
    setupGate: document.getElementById('setupGate'),
    chooseFolderBtn: document.getElementById('chooseFolderBtn'),
    setupError: document.getElementById('setupError'),

    listBtn: document.getElementById('listBtn'),
    addBtn: document.getElementById('addBtn'),
    searchInput: document.getElementById('searchInput'),
    resultsList: document.getElementById('resultsList'),
    emptyState: document.getElementById('emptyState'),

    popupOverlay: document.getElementById('popupOverlay'),
    popupClose: document.getElementById('popupClose'),
    saveBtn: document.getElementById('saveBtn'),

    sidebarOverlay: document.getElementById('sidebarOverlay'),
    sidebar: document.getElementById('sidebar'),
    sidebarClose: document.getElementById('sidebarClose'),
    sidebarTree: document.getElementById('sidebarTree'),

    viewerOverlay: document.getElementById('viewerOverlay'),
    viewerClose: document.getElementById('viewerClose'),
    viewerDate: document.getElementById('viewerDate'),
    viewerKhach: document.getElementById('viewerKhach'),
    viewerBan: document.getElementById('viewerBan'),
    viewerCtv: document.getElementById('viewerCtv'),
    viewerCtvBlock: document.getElementById('viewerCtvBlock'),

    toast: document.getElementById('toast'),
  };

  let pendingFiles = { khach: null, ban: null, ctv: null };
  let toastTimer = null;

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2200);
  }

  /* ---------------- Popup ---------------- */
  function resetPopup() {
    pendingFiles = { khach: null, ban: null, ctv: null };
    document.querySelectorAll('.upload-zone').forEach((zone) => {
      zone.classList.remove('filled');
      const preview = zone.querySelector('.upload-preview');
      preview.src = '';
      preview.classList.add('hidden');
      const input = zone.querySelector('.upload-input');
      input.value = '';
    });
    updateSaveState();
  }

  function updateSaveState() {
    els.saveBtn.disabled = !(pendingFiles.khach && pendingFiles.ban);
  }

  function openPopup() {
    resetPopup();
    els.popupOverlay.classList.remove('hidden');
    requestAnimationFrame(() => els.popupOverlay.classList.add('open'));
  }

  function closePopup() {
    els.popupOverlay.classList.remove('open');
    setTimeout(() => els.popupOverlay.classList.add('hidden'), 260);
  }

  function bindUploadZones(onChange) {
    document.querySelectorAll('.upload-input').forEach((input) => {
      input.addEventListener('change', () => {
        const file = input.files[0];
        const slot = input.dataset.slot;
        if (!file) return;
        pendingFiles[slot] = file;
        const zone = input.closest('.upload-zone');
        const preview = zone.querySelector('.upload-preview');
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
        zone.classList.add('filled');
        updateSaveState();
        if (onChange) onChange(pendingFiles);
      });
    });
  }

  /* ---------------- Results list ---------------- */
  function renderResults(records) {
    els.resultsList.innerHTML = '';
    if (!records.length) {
      els.emptyState.classList.remove('hidden');
      return;
    }
    els.emptyState.classList.add('hidden');
    const sorted = [...records].sort((a, b) => b.savedAt - a.savedAt);
    for (const r of sorted) {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.dataset.id = r.id;
      card.innerHTML = `
        <img class="result-thumb" src="${r.khachUrl}" alt="" loading="lazy" decoding="async">
        <div class="result-meta">
          <span class="result-date">${r.dateStr}</span>
          <span class="result-time">${r.hh}:${r.mi}</span>
        </div>`;
      els.resultsList.appendChild(card);
    }
  }

  /* ---------------- Sidebar tree ---------------- */
  function buildTree(records) {
    const tree = {};
    for (const r of records) {
      tree[r.year] ??= {};
      tree[r.year][r.month] ??= {};
      tree[r.year][r.month][r.day] ??= [];
      tree[r.year][r.month][r.day].push(r);
    }
    return tree;
  }

  function renderSidebar(records, onLeafClick) {
    const tree = buildTree(records);
    els.sidebarTree.innerHTML = '';
    const years = Object.keys(tree).sort((a, b) => b.localeCompare(a));
    if (!years.length) {
      els.sidebarTree.innerHTML = '<p class="empty-state">Chưa có dữ liệu.</p>';
      return;
    }
    for (const year of years) {
      const yearNode = makeNode(year);
      els.sidebarTree.appendChild(yearNode.node);
      const months = Object.keys(tree[year]).sort((a, b) => b.localeCompare(a));
      for (const month of months) {
        const monthNode = makeNode(`Tháng ${month}`);
        yearNode.childrenEl.appendChild(monthNode.node);
        const days = Object.keys(tree[year][month]).sort((a, b) => b.localeCompare(a));
        for (const day of days) {
          const dayNode = makeNode(`Ngày ${day}`);
          monthNode.childrenEl.appendChild(dayNode.node);
          const items = tree[year][month][day].sort((a, b) => b.savedAt - a.savedAt);
          for (const r of items) {
            const leaf = document.createElement('div');
            leaf.className = 'tree-leaf';
            leaf.textContent = `${r.hh}:${r.mi}`;
            leaf.addEventListener('click', () => onLeafClick(r));
            dayNode.childrenEl.appendChild(leaf);
          }
        }
      }
    }
  }

  function makeNode(labelText) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    const label = document.createElement('div');
    label.className = 'tree-label';
    label.innerHTML = `<span class="tree-caret">▸</span><span>${labelText}</span>`;
    const childrenEl = document.createElement('div');
    childrenEl.className = 'tree-children';
    label.addEventListener('click', () => node.classList.toggle('open'));
    node.appendChild(label);
    node.appendChild(childrenEl);
    return { node, childrenEl };
  }

  function openSidebar() {
    els.sidebarOverlay.classList.remove('hidden');
    els.sidebar.classList.remove('hidden');
    requestAnimationFrame(() => {
      els.sidebarOverlay.classList.add('open');
      els.sidebar.classList.add('open');
    });
  }

  function closeSidebar() {
    els.sidebarOverlay.classList.remove('open');
    els.sidebar.classList.remove('open');
    setTimeout(() => {
      els.sidebarOverlay.classList.add('hidden');
      els.sidebar.classList.add('hidden');
    }, 300);
  }

  /* ---------------- Viewer ---------------- */
  function openViewer(record) {
    els.viewerDate.textContent = `${record.dateStr} — ${record.hh}:${record.mi}`;
    els.viewerOverlay.classList.remove('hidden');
    requestAnimationFrame(() => els.viewerOverlay.classList.add('open'));
    els.viewerKhach.src = record.khachUrl;
    els.viewerBan.src = record.banUrl;
    if (record.hasCtv && record.ctvUrl) {
      els.viewerCtv.src = record.ctvUrl;
      els.viewerCtvBlock.classList.remove('hidden');
    } else {
      els.viewerCtvBlock.classList.add('hidden');
    }
  }

  function closeViewer() {
    els.viewerOverlay.classList.remove('open');
    setTimeout(() => els.viewerOverlay.classList.add('hidden'), 300);
  }

  return {
    els,
    showToast,
    openPopup, closePopup, bindUploadZones, updateSaveState,
    get pendingFiles() { return pendingFiles; },
    renderResults,
    renderSidebar, openSidebar, closeSidebar,
    openViewer, closeViewer,
  };
})();
