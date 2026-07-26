/* ==========================================================
   app.js — bootstraps the app against Firebase (Firestore + Storage),
   and wires all UI interactions. No folder permission step anymore.
   ========================================================== */

(async function init() {
  const { els } = UI;
  let allRecords = [];

  async function loadIndexAndRender() {
    allRecords = await FbStorage.getAllTransactions();
    applySearch();
  }

  function applySearch() {
    const filtered = Search.filter(allRecords, els.searchInput.value);
    UI.renderResults(filtered);
  }

  function enterApp() {
    els.setupGate.classList.add('hidden');
    els.app.classList.remove('hidden');
  }

  /* ---------------- Header / list button ---------------- */
  els.listBtn.addEventListener('click', () => {
    UI.renderSidebar(allRecords, (record) => {
      UI.closeSidebar();
      UI.openViewer(record);
    });
    UI.openSidebar();
  });
  els.sidebarClose.addEventListener('click', UI.closeSidebar);
  els.sidebarOverlay.addEventListener('click', UI.closeSidebar);

  /* ---------------- Search ---------------- */
  els.searchInput.addEventListener('input', applySearch);

  /* ---------------- Results click -> viewer ---------------- */
  els.resultsList.addEventListener('click', (e) => {
    const card = e.target.closest('.result-card');
    if (!card) return;
    const record = allRecords.find((r) => r.id === card.dataset.id);
    if (record) UI.openViewer(record);
  });

  /* ---------------- Viewer close ---------------- */
  els.viewerClose.addEventListener('click', UI.closeViewer);
  els.viewerOverlay.addEventListener('click', (e) => {
    if (e.target === els.viewerOverlay) UI.closeViewer();
  });

  /* ---------------- Add popup ---------------- */
  els.addBtn.addEventListener('click', UI.openPopup);
  els.popupClose.addEventListener('click', UI.closePopup);
  els.popupOverlay.addEventListener('click', (e) => {
    if (e.target === els.popupOverlay) UI.closePopup();
  });
  UI.bindUploadZones();

  els.saveBtn.addEventListener('click', async () => {
    if (els.saveBtn.disabled) return;
    els.saveBtn.disabled = true;
    try {
      await FbStorage.saveTransaction(UI.pendingFiles);
      UI.closePopup();
      UI.showToast('Đã lưu giao dịch.');
      await loadIndexAndRender();
    } catch (e) {
      UI.showToast('Lưu thất bại. Vui lòng thử lại.');
      UI.updateSaveState();
    }
  });

  /* ---------------- Boot ---------------- */
  try {
    await loadIndexAndRender();
    enterApp();
  } catch (e) {
    document.getElementById('setupTitle').textContent = 'Không thể kết nối Firebase.';
    els.setupError.textContent = 'Kiểm tra lại cấu hình trong js/firebase-config.js, js/cloudinary.js và quy tắc bảo mật Firestore.';
  }
})();
