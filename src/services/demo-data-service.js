// ecos — reset/backup/restore for local demo data.
// Owns the single-slot "last reset backup" used by the dashboard's
// "איפוס לדאטה התחלתי" / "שחזר גיבוי אחרון" controls.

(function () {
  if (window.DemoDataService) return;

  const BACKUP_KEY = "ecosystemOS.lastResetBackup.v1";

  function hasBackup() {
    return window.EcosStorage.read(BACKUP_KEY, null) !== null;
  }

  function createBackup() {
    const backup = {
      companies: window.CompanyStore.getCompanies(),
      submissions: window.SubmissionStore.getSubmissions(),
      needs: window.NeedsStore ? window.NeedsStore.getNeeds() : [],
      taxonomy: window.TaxonomyStore ? window.TaxonomyStore.getOptions() : null,
      backedUpAt: new Date().toISOString(),
    };
    window.EcosStorage.write(BACKUP_KEY, backup);
    return backup;
  }

  function resetToSeed() {
    const backup = createBackup();
    window.CompanyStore.resetCompaniesToSeed();
    window.SubmissionStore.saveSubmissions([]);
    if (window.NeedsStore) window.NeedsStore.saveNeeds([]);
    if (window.TaxonomyStore) window.TaxonomyStore.GROUP_KEYS.forEach((k) => window.TaxonomyStore.resetGroup(k));
    return backup;
  }

  function restoreBackup() {
    const backup = window.EcosStorage.read(BACKUP_KEY, null);
    if (!backup) return null;
    window.CompanyStore.saveCompanies(backup.companies || []);
    window.SubmissionStore.saveSubmissions(backup.submissions || []);
    if (window.NeedsStore) window.NeedsStore.saveNeeds(backup.needs || []);
    if (window.TaxonomyStore && backup.taxonomy) window.TaxonomyStore.setOptions(backup.taxonomy);
    return backup;
  }

  window.DemoDataService = {
    key: BACKUP_KEY,
    hasBackup,
    resetToSeed,
    restoreBackup,
  };
})();
