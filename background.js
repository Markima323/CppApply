importScripts("generator.js", "extension-runner.js");

const TARGET_URL = "https://www.allcpp.cn/mng/action.do";
const TARGET_ORIGIN = "https://www.allcpp.cn";
const EXECUTE_MESSAGE = "allcpp:open-and-execute";

chrome.action.onClicked.addListener(async () => {
  const panelUrl = chrome.runtime.getURL("index.html");

  try {
    const existingTabs = await chrome.tabs.query({});
    const existingTab = existingTabs.find(
      (tab) => typeof tab.id === "number" && tab.url === panelUrl
    );

    if (existingTab) {
      await chrome.tabs.update(existingTab.id, { active: true });
      if (typeof existingTab.windowId === "number") {
        await chrome.windows.update(existingTab.windowId, { focused: true });
      }
      return;
    }

    await chrome.tabs.create({ url: panelUrl, active: true });
  } catch (error) {
    console.error("打开申摊助手失败：", error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== EXECUTE_MESSAGE) {
    return false;
  }

  openAllcppAndExecute(message)
    .then((response) => sendResponse(response))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    });

  return true;
});

async function openAllcppAndExecute(message) {
  const generator = globalThis.AllcppCodeGenerator;
  const validation = generator.validateInput(message.mode, message.values);

  if (!validation.valid) {
    throw new Error("申请资料未通过校验，请返回助手页面检查后重试。");
  }

  const tab = await chrome.tabs.create({ url: TARGET_URL, active: true });

  if (typeof tab.id !== "number") {
    throw new Error("无法创建 ALLCPP 管理页面标签页。");
  }

  const loadedTab = await waitForTabComplete(tab.id);
  const loadedUrl = new URL(loadedTab.url || TARGET_URL);

  if (loadedUrl.origin !== TARGET_ORIGIN) {
    throw new Error("ALLCPP 管理页面未正常打开，请确认登录状态后重试。");
  }

  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: globalThis.executeAllcppFlow,
    args: [
      {
        mode: validation.mode,
        values: validation.values,
        expectedUrl: TARGET_URL
      }
    ]
  });

  const mainFrameResult = injectionResults[0] && injectionResults[0].result;

  if (!mainFrameResult) {
    throw new Error("代码已注入，但没有取得执行结果。");
  }

  return {
    ok: true,
    tabId: tab.id,
    result: mainFrameResult
  };
}

async function waitForTabComplete(tabId) {
  const currentTab = await chrome.tabs.get(tabId);
  if (currentTab.status === "complete") {
    return currentTab;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("等待 ALLCPP 页面加载超时，请检查网络后重试。"));
    }, 45000);

    function cleanup() {
      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    }

    function onUpdated(updatedTabId, changeInfo, updatedTab) {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") {
        return;
      }

      cleanup();
      resolve(updatedTab);
    }

    function onRemoved(removedTabId) {
      if (removedTabId !== tabId) {
        return;
      }

      cleanup();
      reject(new Error("ALLCPP 页面在执行前被关闭。"));
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    // 防止页面恰好在首次检查与事件监听注册之间完成加载。
    chrome.tabs
      .get(tabId)
      .then((latestTab) => {
        if (latestTab.status === "complete") {
          cleanup();
          resolve(latestTab);
        }
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}
