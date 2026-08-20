async function executeAllcppFlow(request) {
  "use strict";

  const modalId = "allcpp-apply-extension-result";
  const oldModal = document.getElementById(modalId);
  if (oldModal) oldModal.remove();

  function makeElement(tagName, styles, text) {
    const element = document.createElement(tagName);
    Object.assign(element.style, styles || {});
    if (text !== undefined) element.textContent = text;
    return element;
  }

  const overlay = makeElement("div", {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "rgba(24, 23, 20, 0.58)",
    backdropFilter: "blur(5px)",
    fontFamily: 'Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
  });
  overlay.id = modalId;

  const card = makeElement("section", {
    width: "min(620px, 100%)",
    maxHeight: "min(760px, calc(100vh - 48px))",
    overflow: "auto",
    color: "#24231f",
    background: "#ffffff",
    border: "1px solid #dedbd2",
    borderRadius: "20px",
    boxShadow: "0 30px 90px rgba(0, 0, 0, 0.32)"
  });

  const header = makeElement("header", {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    padding: "22px 24px 18px",
    borderBottom: "1px solid #ebe8e0"
  });
  const headingWrap = makeElement("div");
  const eyebrow = makeElement(
    "p",
    {
      margin: "0 0 5px",
      color: "#dd5b3e",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "0.12em"
    },
    "ALLCPP APPLY RESULT"
  );
  const title = makeElement(
    "h2",
    { margin: "0", color: "#24231f", fontSize: "22px", lineHeight: "1.3" },
    "正在执行申请…"
  );
  headingWrap.append(eyebrow, title);

  const statusBadge = makeElement(
    "span",
    {
      flex: "0 0 auto",
      color: "#786126",
      background: "#fff5d8",
      border: "1px solid #ead9a5",
      borderRadius: "999px",
      padding: "7px 11px",
      fontSize: "12px",
      fontWeight: "800"
    },
    "执行中"
  );
  header.append(headingWrap, statusBadge);

  const content = makeElement("div", { padding: "22px 24px" });
  const phase = makeElement(
    "p",
    {
      margin: "0 0 16px",
      color: "#68665f",
      fontSize: "14px",
      lineHeight: "1.7"
    },
    "目标页面已加载，正在查询活动信息。请不要关闭当前标签页。"
  );
  const summary = makeElement("pre", {
    display: "none",
    margin: "0 0 14px",
    padding: "14px 15px",
    color: "#34332f",
    background: "#f7f5f0",
    border: "1px solid #e4e0d7",
    borderRadius: "12px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontFamily: '"Cascadia Code", Consolas, monospace',
    fontSize: "12px",
    lineHeight: "1.65"
  });
  const responseLabel = makeElement(
    "p",
    {
      display: "none",
      margin: "18px 0 7px",
      color: "#706e67",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "0.08em"
    },
    "服务器完整回复"
  );
  const responseBox = makeElement("pre", {
    display: "none",
    maxHeight: "290px",
    overflow: "auto",
    margin: "0",
    padding: "14px 15px",
    color: "#d9dcd3",
    background: "#20211e",
    borderRadius: "12px",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontFamily: '"Cascadia Code", Consolas, monospace',
    fontSize: "11px",
    lineHeight: "1.6"
  });
  content.append(phase, summary, responseLabel, responseBox);

  const footer = makeElement("footer", {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "16px 24px 20px",
    borderTop: "1px solid #ebe8e0"
  });
  const closeButton = makeElement(
    "button",
    {
      minWidth: "96px",
      height: "40px",
      color: "#ffffff",
      background: "#dd5b3e",
      border: "0",
      borderRadius: "10px",
      padding: "0 18px",
      fontSize: "13px",
      fontWeight: "800",
      cursor: "pointer"
    },
    "关闭"
  );
  closeButton.addEventListener("click", () => overlay.remove());
  footer.append(closeButton);

  card.append(header, content, footer);
  overlay.append(card);
  document.documentElement.append(overlay);

  function setPhase(text) {
    phase.textContent = text;
  }

  function stringifyResponse(value) {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  function renderResult(result) {
    const failed = result.success === false || result.httpSuccess === false;
    const succeeded = result.success === true && result.httpSuccess !== false;
    const stateText = succeeded ? "成功" : failed ? "失败" : "结果待确认";
    const stateColor = succeeded ? "#34745a" : failed ? "#ba3d39" : "#786126";
    const stateBackground = succeeded ? "#eaf6ef" : failed ? "#fff0ef" : "#fff5d8";
    const stateBorder = succeeded ? "#bddfca" : failed ? "#efc4c1" : "#ead9a5";

    title.textContent = succeeded
      ? "申请执行成功"
      : failed
        ? "申请执行失败"
        : "申请请求已经完成";
    statusBadge.textContent = stateText;
    statusBadge.style.color = stateColor;
    statusBadge.style.background = stateBackground;
    statusBadge.style.borderColor = stateBorder;
    phase.textContent = result.error
      ? "执行过程中出现错误，请根据下方信息检查后重试。"
      : "ALLCPP 已返回结果，请核对以下信息。";

    const summaryLines = [
      `操作类型：${result.modeLabel || "-"}`,
      `活动名称：${result.eventName || "-"}`,
      `活动主页 ID：${result.eventMainId || "-"}`,
      `实际 eventId：${result.eventId || "-"}`,
      `展品 ID：${result.doujinshiId || "-"}`
    ];

    if (result.circleId !== undefined) {
      summaryLines.push(`社团 ID：${result.circleId || "-"}`);
    }

    summaryLines.push(
      `HTTP 状态：${result.httpStatus || "-"}`,
      `服务器消息：${result.message || result.error || "无"}`
    );

    summary.textContent = summaryLines.join("\n");
    summary.style.display = "block";
    responseLabel.style.display = "block";
    responseBox.textContent = stringifyResponse(
      result.response !== undefined ? result.response : { error: result.error || "未知错误" }
    );
    responseBox.style.display = "block";
  }

  try {
    const expectedUrl = new URL(request.expectedUrl);
    if (location.origin !== expectedUrl.origin || location.pathname !== expectedUrl.pathname) {
      throw new Error("当前不是 ALLCPP 管理页面。请先登录 ALLCPP，然后返回助手重试。");
    }

    const mode = request.mode === "update" ? "update" : "apply";
    const modeLabel = mode === "update" ? "已退摊更新为申请" : "申摊";
    const values = request.values || {};
    const eventMainId = Number(values.eventMainId);
    const config = {
      positioncount: 1,
      positionname: "",
      sectionid: 0,
      extra: "",
      doujinshiid: values.doujinshiid,
      conname: values.conname,
      conidentity: values.conidentity,
      contel: values.contel,
      conemail: values.conemail,
      contbpay: "",
      agentuserid: Number(values.agentuserid),
      conaddress: "",
      boundCircleIds: ""
    };

    if (mode === "update") {
      config.deldoujinshiid = "";
      config.adddoujinshiid = "";
      config.circleid = Number(values.circleid);
    }

    const eventListUrl =
      "https://www.allcpp.cn/allcpp/event/getEventListApprove.do" +
      `?eventmainid=${encodeURIComponent(eventMainId)}` +
      "&pageindex=1" +
      "&pagesize=50" +
      "&showapprove=0" +
      "&eventEnabled=1" +
      "&cityId=-1" +
      "&typeId=-1";

    setPhase("正在查询活动和实际场次…");
    const eventResponse = await fetch(eventListUrl, {
      method: "GET",
      credentials: "include"
    });
    const eventRawText = await eventResponse.text();
    let eventData;

    try {
      eventData = JSON.parse(eventRawText);
    } catch {
      throw new Error(`查询活动时服务器返回的不是 JSON：${eventRawText.slice(0, 300)}`);
    }

    if (!eventResponse.ok) {
      throw new Error(
        `查询活动 HTTP 失败：${eventResponse.status} ${eventResponse.statusText}`
      );
    }

    if (eventData.isSuccess !== true) {
      throw new Error(`ALLCPP 查询活动失败：${eventData.message || "未知原因"}`);
    }

    const eventList = eventData && eventData.result && eventData.result.list;
    if (!Array.isArray(eventList) || eventList.length === 0) {
      throw new Error(`没有找到活动主页 ID ${eventMainId} 对应的实际场次。`);
    }

    if (eventList.length !== 1) {
      throw new Error(
        `检测到 ${eventList.length} 个实际场次，已停止提交，避免申请到错误场次。`
      );
    }

    const event = eventList[0];
    if (!event || !event.id) {
      throw new Error("ALLCPP 返回的数据中没有有效的 eventId。");
    }

    setPhase(`已找到活动“${event.name || "未命名活动"}”，正在提交申请…`);
    const payload = { eventid: event.id, ...config };
    const endpoint =
      mode === "update"
        ? "https://www.allcpp.cn/allcpp/event/updatePosition.do"
        : "https://www.allcpp.cn/allcpp/event/orderPosition.do";
    const submitUrl = new URL(endpoint);

    for (const [key, value] of Object.entries(payload)) {
      submitUrl.searchParams.set(key, String(value));
    }

    const response = await fetch(submitUrl.toString(), {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json;charset=UTF-8",
        errorwrap: "json"
      },
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "include"
    });
    const rawText = await response.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    let serverSuccess = null;
    if (data && typeof data === "object") {
      if (typeof data.isSuccess === "boolean") {
        serverSuccess = data.isSuccess;
      } else if (typeof data.success === "boolean") {
        serverSuccess = data.success;
      }
    }

    const message =
      data && typeof data === "object"
        ? data.message ?? data.msg ?? data.error ?? ""
        : "";
    const success = !response.ok ? false : serverSuccess;
    const result = {
      success,
      mode,
      modeLabel,
      eventMainId,
      eventId: payload.eventid,
      eventName: event.name,
      doujinshiId: payload.doujinshiid,
      agentUserId: payload.agentuserid,
      httpSuccess: response.ok,
      httpStatus: response.status,
      message,
      response: data
    };

    if (mode === "update") {
      result.circleId = payload.circleid;
    }

    renderResult(result);
    return result;
  } catch (error) {
    const result = {
      success: false,
      mode: request && request.mode,
      modeLabel:
        request && request.mode === "update" ? "已退摊更新为申请" : "申摊",
      eventMainId: request && request.values && request.values.eventMainId,
      doujinshiId: request && request.values && request.values.doujinshiid,
      httpSuccess: false,
      httpStatus: null,
      message: "",
      error: error instanceof Error ? error.message : String(error)
    };
    renderResult(result);
    return result;
  }
}

if (typeof globalThis !== "undefined") {
  globalThis.executeAllcppFlow = executeAllcppFlow;
}

if (typeof module === "object" && module.exports) {
  module.exports = { executeAllcppFlow };
}
