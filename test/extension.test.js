const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

test("Chrome 扩展使用 Manifest V3 和后台 Service Worker", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.description, "自动使用填写好的信息抢摊");
  assert.equal(manifest.background.service_worker, "background.js");
  assert.equal(manifest.action.default_title, "打开 ALLCPP自动申摊器");
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

test("面板只包含自动执行按钮且不使用字符串 eval 注入", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const background = fs.readFileSync(path.join(root, "background.js"), "utf8");

  assert.match(html, /id="execute-button"/);
  assert.match(html, /点击打开ALLCPP抢摊/);
  assert.doesNotMatch(html, /id="copy-button"/);
  assert.doesNotMatch(html, /id="code-preview"/);
  assert.match(html, /id="validation-list"/);
  assert.match(background, /chrome\.scripting\.executeScript/);
  assert.doesNotMatch(background, /\beval\s*\(/);
});

test("完成后的结果框只展示指定的三项结果", () => {
  const runner = fs.readFileSync(path.join(root, "extension-runner.js"), "utf8");

  assert.match(runner, /操作类型：/);
  assert.match(runner, /活动名称：/);
  assert.match(runner, /抢摊结果：/);
  assert.doesNotMatch(runner, /服务器完整回复/);
  assert.doesNotMatch(runner, /实际 eventId：/);
});

test("完成结果框包含申摊结果页面入口", () => {
  const runner = fs.readFileSync(path.join(root, "extension-runner.js"), "utf8");

  assert.match(runner, /点击查看申摊结果/);
  assert.match(runner, /https:\/\/www\.allcpp\.cn\/mng\/apply\.do\?t=1&pageNo=1/);
});
