const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STORAGE_KEY,
  FIELD_NAMES,
  loadDefaults,
  saveDefaults,
  clearDefaults
} = require("../storage.js");

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

const values = {
  eventMainId: "7214",
  doujinshiid: "allcpp.cn/d/1412772.do",
  agentuserid: "3913204",
  circleid: "https://www.allcpp.cn/c/3005850.do",
  conname: "测试联系人",
  conidentity: "ID-1234567890",
  contel: "13800000000",
  conemail: "test@example.com"
};

test("保存并恢复模式和全部表单字段", () => {
  const storage = createMemoryStorage();
  assert.equal(saveDefaults(storage, "update", values).ok, true);

  const restored = loadDefaults(storage);
  assert.equal(restored.ok, true);
  assert.equal(restored.found, true);
  assert.equal(restored.snapshot.mode, "update");
  assert.deepEqual(restored.snapshot.values, values);
});

test("空字符串会覆盖旧值，不会让已清空字段复活", () => {
  const storage = createMemoryStorage();
  saveDefaults(storage, "apply", values);
  saveDefaults(storage, "apply", { ...values, conname: "", circleid: "" });

  const restored = loadDefaults(storage);
  assert.equal(restored.snapshot.values.conname, "");
  assert.equal(restored.snapshot.values.circleid, "");
});

test("只恢复白名单字符串字段并忽略未知字段", () => {
  const storage = createMemoryStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      mode: "apply",
      values: { ...values, conname: 123, unknown: "ignored" }
    })
  );

  const restored = loadDefaults(storage);
  assert.equal(restored.snapshot.values.conname, "");
  assert.equal(Object.hasOwn(restored.snapshot.values, "unknown"), false);
  assert.deepEqual(Object.keys(restored.snapshot.values), [...FIELD_NAMES]);
});

test("损坏或旧版本数据会被丢弃", () => {
  const malformedStorage = createMemoryStorage();
  malformedStorage.setItem(STORAGE_KEY, "not-json");
  const malformed = loadDefaults(malformedStorage);
  assert.equal(malformed.ok, true);
  assert.equal(malformed.found, false);
  assert.equal(malformedStorage.getItem(STORAGE_KEY), null);

  const oldStorage = createMemoryStorage();
  oldStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, mode: "apply", values }));
  const old = loadDefaults(oldStorage);
  assert.equal(old.found, false);
  assert.equal(oldStorage.getItem(STORAGE_KEY), null);
});

test("清空会删除保存快照", () => {
  const storage = createMemoryStorage();
  saveDefaults(storage, "update", values);
  assert.equal(clearDefaults(storage).ok, true);
  assert.equal(loadDefaults(storage).found, false);
});

test("存储不可用或抛错时安全降级", () => {
  const throwingStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    }
  };

  assert.equal(loadDefaults(null).ok, false);
  assert.equal(saveDefaults(throwingStorage, "apply", values).ok, false);
  assert.equal(loadDefaults(throwingStorage).ok, false);
  assert.equal(clearDefaults(throwingStorage).ok, false);
});
