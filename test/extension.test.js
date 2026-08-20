const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

test("Chrome 扩展使用 Manifest V3 和后台 Service Worker", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.service_worker, "background.js");
  assert.equal(manifest.action.default_title, "打开 ALLCPP 申摊助手");
});

test("扩展仅声明执行流程需要的权限和 ALLCPP 域名", () => {
  assert.deepEqual([...manifest.permissions].sort(), ["scripting", "tabs"]);
  assert.deepEqual(manifest.host_permissions, ["https://www.allcpp.cn/*"]);
});

test("扩展入口和注入脚本均存在", () => {
  for (const file of ["index.html", "background.js", "extension-runner.js"]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} 不存在`);
  }
});

test("面板包含自动执行按钮且不使用字符串 eval 注入", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const background = fs.readFileSync(path.join(root, "background.js"), "utf8");

  assert.match(html, /id="execute-button"/);
  assert.match(background, /chrome\.scripting\.executeScript/);
  assert.doesNotMatch(background, /\beval\s*\(/);
});
