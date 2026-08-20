const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MODES,
  extractEventMainId,
  extractAllcppPathId,
  validateInput,
  generateCode
} = require("../generator.js");

const validValues = {
  eventMainId: "7214",
  doujinshiid: "1412772",
  agentuserid: "3913204",
  circleid: "3005850",
  conname: "测试联系人",
  conidentity: "ID-1234567890",
  contel: "+86 138-0000-0000",
  conemail: "test@example.com"
};

test("申摊模式生成 orderPosition 代码且不包含 circleid", () => {
  const code = generateCode(MODES.APPLY, validValues);

  assert.match(code, /orderPosition\.do/);
  assert.doesNotMatch(code, /updatePosition\.do/);
  assert.doesNotMatch(code, /circleid/);
  assert.match(code, /agentuserid: 3913204/);
  assert.doesNotThrow(() => new Function(code));
});

test("更新模式生成 updatePosition 代码并写入 circleid", () => {
  const code = generateCode(MODES.UPDATE, validValues);

  assert.match(code, /updatePosition\.do/);
  assert.doesNotMatch(code, /orderPosition\.do/);
  assert.match(code, /circleid: 3005850/);
  assert.match(code, /deldoujinshiid: ""/);
  assert.doesNotThrow(() => new Function(code));
});

test("字符串资料通过 JSON 字面量安全写入", () => {
  const values = {
    ...validValues,
    conname: '王"测试\\name',
    conidentity: "ABC'123\\XYZ"
  };
  const code = generateCode(MODES.UPDATE, values);

  assert.ok(code.includes(`conname: ${JSON.stringify(values.conname)}`));
  assert.ok(code.includes(`conidentity: ${JSON.stringify(values.conidentity)}`));
  assert.doesNotThrow(() => new Function(code));
});

test("可以从 ALLCPP 活动链接提取 eventMainId", () => {
  assert.equal(
    extractEventMainId("https://www.allcpp.cn/allcpp/event/event.do?event=7214"),
    "7214"
  );

  const validation = validateInput(MODES.APPLY, {
    ...validValues,
    eventMainId: "https://www.allcpp.cn/allcpp/event/event.do?event=7214"
  });
  assert.equal(validation.valid, true);
  assert.equal(validation.values.eventMainId, "7214");
});

test("可以从展品链接和社团页面链接提取对应 ID", () => {
  assert.equal(extractAllcppPathId("allcpp.cn/d/1412772.do", "d"), "1412772");
  assert.equal(
    extractAllcppPathId("https://www.allcpp.cn/c/3005850.do", "c"),
    "3005850"
  );

  const validation = validateInput(MODES.UPDATE, {
    ...validValues,
    doujinshiid: "allcpp.cn/d/1412772.do",
    circleid: "https://www.allcpp.cn/c/3005850.do"
  });
  assert.equal(validation.valid, true);
  assert.equal(validation.values.doujinshiid, "1412772");
  assert.equal(validation.values.circleid, "3005850");

  const code = generateCode(MODES.UPDATE, validation.values);
  assert.match(code, /doujinshiid: "1412772"/);
  assert.match(code, /circleid: 3005850/);
});

test("不会从非 ALLCPP 域名或错误路径提取 ID", () => {
  assert.equal(extractAllcppPathId("https://example.com/d/1412772.do", "d"), "https://example.com/d/1412772.do");
  assert.equal(extractAllcppPathId("allcpp.cn/c/not-a-number.do", "c"), "allcpp.cn/c/not-a-number.do");
});

test("更新模式缺少 circleid 时校验失败，申摊模式不受影响", () => {
  const withoutCircle = { ...validValues, circleid: "" };
  const updateValidation = validateInput(MODES.UPDATE, withoutCircle);
  const applyValidation = validateInput(MODES.APPLY, withoutCircle);

  assert.equal(updateValidation.valid, false);
  assert.ok(updateValidation.errors.circleid);
  assert.equal(applyValidation.valid, true);
  assert.equal(applyValidation.errors.circleid, undefined);
});

test("拒绝不安全数字、无效邮箱和带换行的姓名", () => {
  const validation = validateInput(MODES.UPDATE, {
    ...validValues,
    agentuserid: "9007199254740993",
    conemail: "not-an-email",
    conname: "第一行\n第二行"
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.agentuserid);
  assert.ok(validation.errors.conemail);
  assert.ok(validation.errors.conname);
});
