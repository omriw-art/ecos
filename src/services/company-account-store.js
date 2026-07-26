// ecos — local browser persistence for company login accounts
// (Admin Organization Intake / Company Accounts MVP).
//
// Deliberately a separate store from CompanyStore: a Company record's
// identity/profile must never carry credential material. CompanyAccount is
// the join between a canonical company (companyId) and a local login
// identity (username/credentialHash) — CompanyStore stays the single source
// of truth for company data; this store only answers "does this company
// have an account, and whose is it".
//
// IMPORTANT — credential handling is local-demo-only, not real auth:
// there is no backend, no server-verified session, and hashCredential()
// below is NOT a cryptographic hash (no per-account random salt, no slow
// KDF). It exists only so a temporary password is never written to
// localStorage in plaintext at rest, which also means this store can never
// show an existing password back to the Admin — only the moment-of-creation
// value, held in memory by the caller. Before any real user ever types a
// real password into this app, this must be replaced with a server-side
// salted hash (bcrypt/argon2) — do not carry this implementation forward
// into a backend migration.

(function () {
  if (window.CompanyAccountStore) return;

  const STORAGE_KEY = "ecosystemOS.companyAccounts.v1";

  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

  // Same slugify shape as CompanyStore's (src/services/company-store.js) —
  // duplicated on purpose so this store has no load-order dependency on
  // CompanyStore for its own id/username generation.
  function slugify(value) {
    const base = text(value)
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "company";
  }

  // NOT a cryptographic hash — see the file-level note above. A 32-bit
  // FNV-1a mix, salted with the username and a fixed store-local string, so
  // the same password produces different stored hashes per username.
  function insecureHash(value) {
    let hash = 0x811c9dc5;
    const str = String(value);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
  }

  function hashCredential(username, credential) {
    return insecureHash(`${username}::${credential}::ecos-local-account-salt-v1`);
  }

  const TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  function generateTempPassword(length) {
    const len = length || 12;
    let out = "";
    const cryptoObj = (typeof window !== "undefined" && window.crypto) ? window.crypto : null;
    if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
      const bytes = new Uint32Array(len);
      cryptoObj.getRandomValues(bytes);
      for (let i = 0; i < len; i++) out += TEMP_PASSWORD_CHARS[bytes[i] % TEMP_PASSWORD_CHARS.length];
    } else {
      for (let i = 0; i < len; i++) out += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)];
    }
    return out;
  }

  function uniqueUsername(base, accounts) {
    const taken = new Set(accounts.map((a) => a.username));
    let candidate = base;
    let i = 2;
    while (taken.has(candidate)) {
      candidate = `${base}-${i}`;
      i += 1;
    }
    return candidate;
  }

  function uniqueAccountId(username, accounts) {
    const ids = new Set(accounts.map((a) => a.id));
    let id = `acct-${username}-${Date.now().toString(36)}`;
    let i = 2;
    while (ids.has(id)) {
      id = `acct-${username}-${Date.now().toString(36)}-${i}`;
      i += 1;
    }
    return id;
  }

  function normalizeAccount(input) {
    const source = input || {};
    return {
      id: text(source.id),
      companyId: text(source.companyId),
      username: text(source.username).toLowerCase(),
      credentialHash: text(source.credentialHash),
      role: "company",
      createdAt: text(source.createdAt) || new Date().toISOString(),
      updatedAt: text(source.updatedAt) || new Date().toISOString(),
    };
  }

  function readAccounts() {
    const parsed = window.EcosLocalAdapter.readSync(STORAGE_KEY, []);
    return asArray(parsed).map(normalizeAccount);
  }

  function writeAccounts(accounts) {
    const normalized = asArray(accounts).map(normalizeAccount);
    if (!window.EcosLocalAdapter.writeSync(STORAGE_KEY, normalized)) {
      throw new Error("CompanyAccountStore: failed to persist company accounts");
    }
    return normalized;
  }

  // Strips credentialHash — the only shape ever handed back to callers other
  // than the moment an account is created/reset (see createForCompany /
  // resetCredential, which additionally return the plaintext temporaryCredential
  // once, out-of-band from the stored/returned account object).
  function toSafe(account) {
    if (!account) return null;
    const safe = Object.assign({}, account);
    delete safe.credentialHash;
    return safe;
  }

  function getRawByCompanyId(companyId) {
    const id = text(companyId);
    if (!id) return null;
    return readAccounts().find((a) => a.companyId === id) || null;
  }

  function list() {
    return readAccounts().map(toSafe);
  }

  function getByCompanyId(companyId) {
    return toSafe(getRawByCompanyId(companyId));
  }

  function getByUsername(username) {
    const normalized = text(username).toLowerCase();
    if (!normalized) return null;
    return toSafe(readAccounts().find((a) => a.username === normalized) || null);
  }

  // Creates a CompanyAccount for an unclaimed company and flips the
  // canonical company to "claimed" via CompanyStore.claimCompany — the one
  // place membershipStatus changes as a side effect of account creation.
  // Idempotent-safe: if the company already has an account, returns it
  // unchanged (alreadyExisted: true) rather than silently minting a second
  // one or rotating its credential.
  function createForCompany(company) {
    if (!company || !text(company.id)) return null;
    const existing = getRawByCompanyId(company.id);
    if (existing) {
      return { account: toSafe(existing), temporaryCredential: null, alreadyExisted: true };
    }

    const accounts = readAccounts();
    const username = uniqueUsername(slugify(company.name), accounts);
    const temporaryCredential = generateTempPassword();
    const now = new Date().toISOString();
    const account = normalizeAccount({
      id: uniqueAccountId(username, accounts),
      companyId: company.id,
      username,
      credentialHash: hashCredential(username, temporaryCredential),
      createdAt: now,
      updatedAt: now,
    });

    writeAccounts([account, ...accounts]);
    if (window.CompanyStore && typeof window.CompanyStore.claimCompany === "function") {
      window.CompanyStore.claimCompany(company.id);
    }

    return { account: toSafe(account), temporaryCredential, alreadyExisted: false };
  }

  // Rotates the credential for an existing account. Username is untouched —
  // only the stored hash and updatedAt move. Returns null if the company has
  // no account yet (reset is not a substitute for createForCompany).
  function resetCredential(companyId) {
    const accounts = readAccounts();
    const index = accounts.findIndex((a) => a.companyId === text(companyId));
    if (index < 0) return null;

    const temporaryCredential = generateTempPassword();
    const updated = normalizeAccount(Object.assign({}, accounts[index], {
      credentialHash: hashCredential(accounts[index].username, temporaryCredential),
      updatedAt: new Date().toISOString(),
    }));
    const next = accounts.slice();
    next[index] = updated;
    writeAccounts(next);

    return { account: toSafe(updated), temporaryCredential };
  }

  // username + credential -> companyId. The only path a login screen needs;
  // callers resolve the actual company via CompanyStore (this store never
  // duplicates company data). Returns null on any mismatch — deliberately
  // the same failure shape whether the username doesn't exist or the
  // credential is wrong, so a login form can't be used to enumerate usernames.
  function authenticate(username, credential) {
    const normalizedUsername = text(username).toLowerCase();
    if (!normalizedUsername || !credential) return null;
    const account = readAccounts().find((a) => a.username === normalizedUsername);
    if (!account) return null;
    if (account.credentialHash !== hashCredential(account.username, credential)) return null;
    return { companyId: account.companyId, account: toSafe(account) };
  }

  window.CompanyAccountStore = {
    key: STORAGE_KEY,
    list,
    getByCompanyId,
    getByUsername,
    createForCompany,
    resetCredential,
    authenticate,
  };
})();
