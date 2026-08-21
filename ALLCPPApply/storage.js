(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.AllcppPreferences = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STORAGE_KEY = "allcpp-apply-code-generator:defaults:v1";
  const STORAGE_VERSION = 1;
  const MODES = new Set(["apply", "update"]);
  const FIELD_LIMITS = Object.freeze({
    eventMainId: 2048,
    doujinshiid: 2048,
    agentuserid: 40,
    circleid: 2048,
    conname: 80,
    conidentity: 64,
    contel: 32,
    conemail: 254
  });
  const FIELD_NAMES = Object.freeze(Object.keys(FIELD_LIMITS));

  function emptyValues() {
    return Object.fromEntries(FIELD_NAMES.map((name) => [name, ""]));
  }

  function normalizeValues(source) {
    const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
    const values = emptyValues();

    for (const name of FIELD_NAMES) {
      const value = input[name];
      if (typeof value === "string" && value.length <= FIELD_LIMITS[name]) {
        values[name] = value;
      }
    }

    return values;
  }

  function createSnapshot(mode, values) {
    return {
      version: STORAGE_VERSION,
      mode: MODES.has(mode) ? mode : "apply",
      values: normalizeValues(values)
    };
  }

  function isValidSnapshot(value) {
    return Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.version === STORAGE_VERSION &&
        MODES.has(value.mode) &&
        value.values &&
        typeof value.values === "object" &&
        !Array.isArray(value.values)
    );
  }

  function storageAvailable(storage) {
    return Boolean(
      storage &&
        typeof storage.getItem === "function" &&
        typeof storage.setItem === "function" &&
        typeof storage.removeItem === "function"
    );
  }

  function discardInvalidValue(storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // 损坏数据无法删除时仍继续使用空表单，不阻断代码生成。
    }
  }

  function loadDefaults(storage) {
    if (!storageAvailable(storage)) {
      return { ok: false, found: false, snapshot: null, reason: "unavailable" };
    }

    let raw;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      return { ok: false, found: false, snapshot: null, reason: "unavailable" };
    }

    if (raw === null) {
      return { ok: true, found: false, snapshot: null, reason: "empty" };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      discardInvalidValue(storage);
      return { ok: true, found: false, snapshot: null, reason: "invalid" };
    }

    if (!isValidSnapshot(parsed)) {
      discardInvalidValue(storage);
      return { ok: true, found: false, snapshot: null, reason: "invalid" };
    }

    return {
      ok: true,
      found: true,
      snapshot: createSnapshot(parsed.mode, parsed.values),
      reason: "restored"
    };
  }

  function saveDefaults(storage, mode, values) {
    if (!storageAvailable(storage)) {
      return { ok: false, reason: "unavailable" };
    }

    const snapshot = createSnapshot(mode, values);
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      return { ok: true, snapshot };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }

  function clearDefaults(storage) {
    if (!storageAvailable(storage)) {
      return { ok: false, reason: "unavailable" };
    }

    try {
      storage.removeItem(STORAGE_KEY);
      return { ok: true };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }

  return Object.freeze({
    STORAGE_KEY,
    STORAGE_VERSION,
    FIELD_NAMES,
    createSnapshot,
    loadDefaults,
    saveDefaults,
    clearDefaults
  });
});
