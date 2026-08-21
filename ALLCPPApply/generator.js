(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.AllcppCodeGenerator = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MODES = Object.freeze({
    APPLY: "apply",
    UPDATE: "update"
  });

  const MODE_META = Object.freeze({
    [MODES.APPLY]: {
      label: "申摊",
      configName: "applyConfig",
      functionName: "applyPosition",
      endpoint: "https://www.allcpp.cn/allcpp/event/orderPosition.do",
      runningMessage: "🚀 正在提交摊位申请",
      successMessage: "🎉 ALLCPP 申摊成功",
      failureMessage: "❌ ALLCPP 申摊失败",
      processTitle: "ALLCPP 自动申摊",
      processFailure: "自动申摊流程中止"
    },
    [MODES.UPDATE]: {
      label: "已退摊更新为申请",
      configName: "updateConfig",
      functionName: "updatePosition",
      endpoint: "https://www.allcpp.cn/allcpp/event/updatePosition.do",
      runningMessage: "♻️ 正在重新提交已有摊位申请",
      successMessage: "🎉 ALLCPP 摊位更新成功",
      failureMessage: "❌ ALLCPP 摊位更新失败",
      processTitle: "ALLCPP 退摊后自动重新申摊",
      processFailure: "自动重新申摊流程中止"
    }
  });

  const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
  const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_PATTERN = /^[0-9+()\-\s]+$/;

  function stringValue(value) {
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function extractEventMainId(input) {
    const value = stringValue(input);

    if (POSITIVE_INTEGER_PATTERN.test(value)) {
      return value;
    }

    try {
      const url = new URL(value);
      return stringValue(url.searchParams.get("event"));
    } catch {
      return value;
    }
  }

  function extractAllcppPathId(input, pathType) {
    const value = stringValue(input);

    if (POSITIVE_INTEGER_PATTERN.test(value)) {
      return value;
    }

    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

    try {
      const url = new URL(candidate);
      const hostname = url.hostname.toLowerCase();
      const isAllcpp = hostname === "allcpp.cn" || hostname.endsWith(".allcpp.cn");

      if (!isAllcpp || (pathType !== "c" && pathType !== "d")) {
        return value;
      }

      const match = url.pathname.match(new RegExp(`^/${pathType}/([1-9]\\d*)\\.do/?$`));
      return match ? match[1] : value;
    } catch {
      return value;
    }
  }

  function isSafePositiveInteger(value) {
    if (!POSITIVE_INTEGER_PATTERN.test(value)) {
      return false;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0;
  }

  function validateInput(mode, rawValues) {
    const normalizedMode = MODE_META[mode] ? mode : MODES.APPLY;
    const source = rawValues || {};
    const values = {
      eventMainId: extractEventMainId(source.eventMainId),
      doujinshiid: extractAllcppPathId(source.doujinshiid, "d"),
      agentuserid: stringValue(source.agentuserid),
      circleid: extractAllcppPathId(source.circleid, "c"),
      conname: stringValue(source.conname),
      conidentity: stringValue(source.conidentity),
      contel: stringValue(source.contel),
      conemail: stringValue(source.conemail)
    };
    const errors = {};

    if (!isSafePositiveInteger(values.eventMainId)) {
      errors.eventMainId = "请输入有效的 ALLCPP 活动主页链接，或直接填写活动 ID。";
    }

    if (!POSITIVE_INTEGER_PATTERN.test(values.doujinshiid)) {
      errors.doujinshiid = "请输入有效的 ALLCPP 展品链接，或直接填写展品 ID。";
    } else if (values.doujinshiid.length > 40) {
      errors.doujinshiid = "展品 ID 长度不正确。";
    }

    if (!isSafePositiveInteger(values.agentuserid)) {
      errors.agentuserid = "UID 必须是有效的正整数。";
    }

    if (normalizedMode === MODES.UPDATE && !isSafePositiveInteger(values.circleid)) {
      errors.circleid = "请输入有效的 ALLCPP 社团页面链接，或直接填写社团 ID。";
    }

    if (!values.conname) {
      errors.conname = "请输入联系人姓名。";
    } else if (values.conname.length > 80 || CONTROL_CHARACTER_PATTERN.test(values.conname)) {
      errors.conname = "联系人姓名包含无效字符或长度过长。";
    }

    if (!values.conidentity) {
      errors.conidentity = "请输入身份证号。";
    } else if (
      values.conidentity.length > 64 ||
      CONTROL_CHARACTER_PATTERN.test(values.conidentity)
    ) {
      errors.conidentity = "身份证号包含无效字符或长度过长。";
    }

    if (!values.contel) {
      errors.contel = "请输入联系电话。";
    } else if (
      values.contel.length < 5 ||
      values.contel.length > 32 ||
      CONTROL_CHARACTER_PATTERN.test(values.contel) ||
      !PHONE_PATTERN.test(values.contel)
    ) {
      errors.contel = "请输入有效的联系电话，可使用数字、空格、+、- 和括号。";
    }

    if (!values.conemail) {
      errors.conemail = "请输入电子邮箱。";
    } else if (values.conemail.length > 254 || !EMAIL_PATTERN.test(values.conemail)) {
      errors.conemail = "请输入有效的电子邮箱地址。";
    }

    return {
      valid: Object.keys(errors).length === 0,
      mode: normalizedMode,
      values,
      errors
    };
  }

  function jsString(value) {
    return JSON.stringify(value);
  }

  function buildConfigLines(mode, values) {
    const meta = MODE_META[mode];
    const lines = [
      `  const ${meta.configName} = {`,
      "    positioncount: 1,",
      '    positionname: "",',
      "    sectionid: 0,",
      '    extra: "",',
      "",
      `    doujinshiid: ${jsString(values.doujinshiid)},`,
      "",
      `    conname: ${jsString(values.conname)},`,
      `    conidentity: ${jsString(values.conidentity)},`,
      `    contel: ${jsString(values.contel)},`,
      `    conemail: ${jsString(values.conemail)},`,
      "",
      '    contbpay: "",',
      `    agentuserid: ${values.agentuserid},`,
      '    conaddress: "",',
      '    boundCircleIds: ""'
    ];

    if (mode === MODES.UPDATE) {
      lines[lines.length - 1] += ",";
      lines.push(
        "",
        '    deldoujinshiid: "",',
        '    adddoujinshiid: "",',
        "",
        `    circleid: ${values.circleid}`
      );
    }

    lines.push("  };");
    return lines;
  }

  function generateCode(mode, rawValues) {
    const validation = validateInput(mode, rawValues);

    if (!validation.valid) {
      const error = new Error("输入资料未通过校验。请先修正字段后再生成代码。");
      error.validation = validation;
      throw error;
    }

    const normalizedMode = validation.mode;
    const values = validation.values;
    const meta = MODE_META[normalizedMode];
    const configLines = buildConfigLines(normalizedMode, values);
    const updateLogLines =
      normalizedMode === MODES.UPDATE
        ? [
            '    console.log("circleId:", payload.circleid);',
            '    console.log("agentUserId:", payload.agentuserid);'
          ]
        : ['    console.log("摊位数量:", payload.positioncount);'];
    const updateReturnLines =
      normalizedMode === MODES.UPDATE
        ? [
            "      circleId: payload.circleid,",
            "      agentUserId: payload.agentuserid,"
          ]
        : ["      agentUserId: payload.agentuserid,"];

    return [
      "(async () => {",
      "  // =========================================================",
      "  // ① 配置区（由 ALLCPP自动申摊器生成）",
      "  // =========================================================",
      "",
      `  const eventMainId = ${values.eventMainId};`,
      "",
      ...configLines,
      "",
      "",
      "  // =========================================================",
      "  // ② eventMainId → eventId",
      "  // =========================================================",
      "",
      "  async function getEventId(eventMainId) {",
      "    const url =",
      '      "https://www.allcpp.cn/allcpp/event/getEventListApprove.do" +',
      '      "?eventmainid=" + encodeURIComponent(eventMainId) +',
      '      "&pageindex=1" +',
      '      "&pagesize=50" +',
      '      "&showapprove=0" +',
      '      "&eventEnabled=1" +',
      '      "&cityId=-1" +',
      '      "&typeId=-1";',
      "",
      '    console.log("━━━━━━━━━━━━━━━━━━━━━━━━");',
      '    console.log("🔍 正在查询活动");',
      '    console.log("eventMainId:", eventMainId);',
      "",
      "    const response = await fetch(url, {",
      '      method: "GET",',
      '      credentials: "include"',
      "    });",
      "",
      "    const rawText = await response.text();",
      "    let data;",
      "",
      "    try {",
      "      data = JSON.parse(rawText);",
      "    } catch {",
      '      throw new Error("查询 eventId 时返回的不是 JSON：\\n" + rawText.slice(0, 500));',
      "    }",
      "",
      "    if (!response.ok) {",
      "      throw new Error(",
      '        "查询 eventId HTTP 失败：" + response.status + " " + response.statusText',
      "      );",
      "    }",
      "",
      "    if (data.isSuccess !== true) {",
      "      throw new Error(",
      '        "ALLCPP 查询 eventId 失败：" + (data.message || "未知原因")',
      "      );",
      "    }",
      "",
      "    const list = data && data.result && data.result.list;",
      "",
      "    if (!Array.isArray(list) || list.length === 0) {",
      "      throw new Error(",
      '        "没有找到 eventMainId=" + eventMainId + " 对应的 eventId"',
      "      );",
      "    }",
      "",
      "    console.table(",
      "      list.map((event, index) => ({",
      "        index,",
      "        eventMainId: event.eventMain && event.eventMain.id,",
      "        eventId: event.id,",
      "        name: event.name,",
      "        date: event.enterTime,",
      "        approveClosed: event.approveClosed",
      "      }))",
      "    );",
      "",
      "    // 防止一个主活动对应多个实际场次时误操作。",
      "    if (list.length !== 1) {",
      "      throw new Error(",
      '        "检测到 " + list.length + " 个实际 event，已停止自动提交，避免操作错误场次。"',
      "      );",
      "    }",
      "",
      "    const event = list[0];",
      "",
      "    if (!event || !event.id) {",
      '      throw new Error("返回结果中不存在有效 eventId");',
      "    }",
      "",
      '    console.log("✅ 活动解析成功");',
      '    console.log("🔗 " + eventMainId + " → " + event.id);',
      '    console.log("活动名称:", event.name);',
      '    console.log("活动日期:", event.enterTime);',
      "",
      "    return event;",
      "  }",
      "",
      "",
      "  // =========================================================",
      `  // ③ ${meta.label}`,
      "  // =========================================================",
      "",
      `  async function ${meta.functionName}(event) {`,
      "    const payload = {",
      "      eventid: event.id,",
      `      ...${meta.configName}`,
      "    };",
      "",
      `    const url = new URL(${jsString(meta.endpoint)});`,
      "",
      "    // 与原代码一致：参数同时写入 URL Query 和 JSON Body。",
      "    for (const [key, value] of Object.entries(payload)) {",
      "      url.searchParams.set(key, String(value));",
      "    }",
      "",
      '    console.log("");',
      '    console.log("━━━━━━━━━━━━━━━━━━━━━━━━");',
      `    console.log(${jsString(meta.runningMessage)});`,
      '    console.log("活动:", event.name);',
      '    console.log("eventMainId:", eventMainId);',
      '    console.log("eventId:", payload.eventid);',
      '    console.log("doujinshiId:", payload.doujinshiid);',
      ...updateLogLines,
      "",
      "    const response = await fetch(url.toString(), {",
      '      method: "POST",',
      "      headers: {",
      '        "accept": "application/json, text/plain, */*",',
      '        "content-type": "application/json;charset=UTF-8",',
      '        "errorwrap": "json"',
      "      },",
      "      body: JSON.stringify(payload),",
      '      mode: "cors",',
      '      credentials: "include"',
      "    });",
      "",
      "    const rawText = await response.text();",
      "    let data;",
      "",
      "    try {",
      "      data = JSON.parse(rawText);",
      "    } catch {",
      "      data = rawText;",
      "    }",
      "",
      '    console.log("━━━━━━━━━━━━━━━━━━━━━━━━");',
      '    console.log("HTTP 状态:", response.status);',
      '    console.log("服务器返回:", data);',
      "",
      "    let success = null;",
      "",
      '    if (data && typeof data === "object") {',
      '      if (typeof data.isSuccess === "boolean") {',
      "        success = data.isSuccess;",
      '      } else if (typeof data.success === "boolean") {',
      "        success = data.success;",
      "      }",
      "    }",
      "",
      "    const message =",
      '      data && typeof data === "object"',
      '        ? (data.message || data.msg || data.error || "")',
      '        : "";',
      "",
      "    if (!response.ok) {",
      '      console.error("❌ HTTP 请求失败：", response.status, response.statusText);',
      '      if (message) console.error("服务器消息:", message);',
      "    } else if (success === true) {",
      `      console.log(${jsString(meta.successMessage)});`,
      '      if (message) console.log("服务器消息:", message);',
      "    } else if (success === false) {",
      `      console.error(${jsString(meta.failureMessage)});`,
      '      if (message) console.error("失败原因:", message);',
      "    } else {",
      "      console.warn(",
      '        "⚠️ HTTP 请求发送成功，但服务器没有返回明确的 isSuccess/success。"',
      "      );",
      "    }",
      "",
      "    return {",
      "      success,",
      "      eventMainId,",
      "      eventId: payload.eventid,",
      "      eventName: event.name,",
      "      doujinshiId: payload.doujinshiid,",
      ...updateReturnLines,
      "      httpSuccess: response.ok,",
      "      httpStatus: response.status,",
      "      message,",
      "      response: data",
      "    };",
      "  }",
      "",
      "",
      "  // =========================================================",
      "  // ④ 主流程",
      "  // =========================================================",
      "",
      "  try {",
      '    console.log("");',
      '    console.log("=================================");',
      `    console.log(${jsString(meta.processTitle)});`,
      '    console.log("=================================");',
      "",
      "    const event = await getEventId(eventMainId);",
      `    const result = await ${meta.functionName}(event);`,
      "",
      '    console.log("");',
      '    console.log("━━━━━━━━━━━━━━━━━━━━━━━━");',
      '    console.log("📋 最终执行结果");',
      "    console.log(result);",
      '    console.log("━━━━━━━━━━━━━━━━━━━━━━━━");',
      "",
      "    return result;",
      "  } catch (error) {",
      '    console.error("");',
      '    console.error("━━━━━━━━━━━━━━━━━━━━━━━━");',
      `    console.error(${jsString(`❌ ${meta.processFailure}`)});`,
      '    console.error("原因:", error.message);',
      '    console.error("━━━━━━━━━━━━━━━━━━━━━━━━");',
      "",
      "    return {",
      "      success: false,",
      "      error: error.message",
      "    };",
      "  }",
      "})();",
      ""
    ].join("\n");
  }

  return Object.freeze({
    MODES,
    MODE_META,
    extractEventMainId,
    extractAllcppPathId,
    validateInput,
    generateCode
  });
});
