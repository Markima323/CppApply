(function () {
  "use strict";

  const generator = globalThis.AllcppCodeGenerator;
  const preferences = globalThis.AllcppPreferences;

  if (!generator || !preferences) {
    throw new Error("页面功能模块加载失败。");
  }

  const form = document.querySelector("#generator-form");
  const clearButton = document.querySelector("#clear-button");
  const executeButton = document.querySelector("#execute-button");
  const executeButtonLabel = document.querySelector("#execute-button-label");
  const formMessage = document.querySelector("#form-message");
  const modeBadge = document.querySelector("#mode-badge");
  const validationCard = document.querySelector("#validation-card");
  const validationIcon = document.querySelector("#validation-icon");
  const validationTitle = document.querySelector("#validation-title");
  const validationDescription = document.querySelector("#validation-description");
  const validationList = document.querySelector("#validation-list");
  const updateOnlyField = document.querySelector(".mode-only-update");
  const circleInput = document.querySelector("#circle-id");
  const identityInput = document.querySelector("#contact-identity");
  const identityToggle = document.querySelector("#identity-toggle");
  const browserStorage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  let storageWarningShown = false;

  function extensionAvailable() {
    return Boolean(globalThis.chrome && chrome.runtime && chrome.runtime.id);
  }

  function currentMode() {
    const checked = form.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : generator.MODES.APPLY;
  }

  function readValues() {
    const data = new FormData(form);
    return {
      eventMainId: data.get("eventMainId"),
      doujinshiid: data.get("doujinshiid"),
      agentuserid: data.get("agentuserid"),
      circleid: data.get("circleid"),
      conname: data.get("conname"),
      conidentity: data.get("conidentity"),
      contel: data.get("contel"),
      conemail: data.get("conemail")
    };
  }

  function setMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = "form-message";

    if (message && type) {
      formMessage.classList.add(`is-${type}`);
    }
  }

  function saveFormDefaults() {
    const result = preferences.saveDefaults(browserStorage, currentMode(), readValues());

    if (!result.ok && !storageWarningShown) {
      storageWarningShown = true;
      setMessage("浏览器阻止了本机自动保存；本次填写仍可正常执行申摊。", "error");
    }

    return result.ok;
  }

  function restoreFormDefaults() {
    const result = preferences.loadDefaults(browserStorage);

    if (!result.ok) {
      storageWarningShown = true;
      return { restored: false, unavailable: true };
    }

    if (!result.found) {
      return { restored: false, unavailable: false };
    }

    const { mode, values } = result.snapshot;
    const modeInput = form.querySelector(`input[name="mode"][value="${mode}"]`);
    if (modeInput) modeInput.checked = true;

    for (const name of preferences.FIELD_NAMES) {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) {
        input.value = values[name];
      }
    }

    return { restored: true, unavailable: false };
  }

  function clearErrors() {
    form.querySelectorAll(".field.has-error").forEach((field) => {
      field.classList.remove("has-error");
    });
    form.querySelectorAll(".field-error").forEach((element) => {
      element.textContent = "";
    });
    form.querySelectorAll("[aria-invalid]").forEach((input) => {
      input.removeAttribute("aria-invalid");
    });
  }

  function clearFieldError(name) {
    const wrapper = form.querySelector(`[data-field="${name}"]`);
    if (!wrapper) return;

    wrapper.classList.remove("has-error");
    const input = wrapper.querySelector("input");
    const error = wrapper.querySelector(".field-error");
    if (input) input.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  }

  function showErrors(errors) {
    clearErrors();

    Object.entries(errors).forEach(([name, message]) => {
      const wrapper = form.querySelector(`[data-field="${name}"]`);
      if (!wrapper || wrapper.hidden) return;

      wrapper.classList.add("has-error");
      const input = wrapper.querySelector("input");
      const error = wrapper.querySelector(".field-error");
      if (input) input.setAttribute("aria-invalid", "true");
      if (error) error.textContent = message;
    });
  }

  function markContentChanged() {
    if (formMessage.classList.contains("is-success")) {
      setMessage("资料已更改，请重新执行申摊。", "info");
    }
  }

  function updateModeUi() {
    const mode = currentMode();
    const isUpdate = mode === generator.MODES.UPDATE;
    updateOnlyField.hidden = !isUpdate;
    circleInput.required = isUpdate;
    modeBadge.textContent = generator.MODE_META[mode].label;
    clearFieldError("circleid");
    updateValidationSummary();
  }

  function updateValidationSummary(precomputedValidation) {
    const validation =
      precomputedValidation || generator.validateInput(currentMode(), readValues());
    validationList.replaceChildren();

    if (validation.valid) {
      validationCard.classList.remove("is-incomplete");
      validationCard.classList.add("is-ready");
      validationIcon.textContent = "✓";
      validationTitle.textContent = "资料填写完成";
      validationDescription.textContent =
        "所有必填信息格式正确，现在可以点击“点击打开ALLCPP申摊”运行。";
      validationList.hidden = true;
      return validation;
    }

    const errorMessages = Object.values(validation.errors);
    validationCard.classList.add("is-incomplete");
    validationCard.classList.remove("is-ready");
    validationIcon.textContent = "!";
    validationTitle.textContent = `还需检查 ${errorMessages.length} 项信息`;
    validationDescription.textContent = "请补充缺失信息或修正格式：";
    validationList.hidden = false;

    for (const message of errorMessages) {
      const item = document.createElement("li");
      item.textContent = message;
      validationList.appendChild(item);
    }

    return validation;
  }

  function prepareExecution() {
    const mode = currentMode();
    const validation = generator.validateInput(mode, readValues());
    showErrors(validation.errors);
    updateValidationSummary(validation);

    if (!validation.valid) {
      const count = Object.keys(validation.errors).length;
      setMessage(`还有 ${count} 项资料需要检查。`, "error");
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return null;
    }

    saveFormDefaults();
    return { mode, validation };
  }

  function requestExtensionExecution(mode, values) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "allcpp:open-and-execute",
          mode,
          values
        },
        (response) => {
          const runtimeError = chrome.runtime.lastError;
          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }
          resolve(response);
        }
      );
    });
  }

  executeButton.addEventListener("click", async () => {
    const prepared = prepareExecution();
    if (!prepared) return;

    if (!extensionAvailable()) {
      setMessage("申摊功能需要先把当前目录加载为 Chrome 扩展。", "error");
      return;
    }

    executeButton.disabled = true;
    executeButtonLabel.textContent = "正在打开并等待执行…";
    setMessage("正在打开 ALLCPP 管理页面，加载完成后会自动执行。", "info");

    try {
      const response = await requestExtensionExecution(
        prepared.mode,
        prepared.validation.values
      );

      if (!response || response.ok !== true) {
        throw new Error((response && response.error) || "扩展没有返回执行结果。");
      }

      const success = response.result && response.result.success;
      setMessage(
        success === true
          ? "ALLCPP 返回申摊成功，申摊结果已显示在目标页面。"
          : "执行已经结束，申摊结果已显示在目标页面。",
        success === true ? "success" : "info"
      );
    } catch (error) {
      setMessage(`自动执行失败：${error.message}`, "error");
    } finally {
      executeButton.disabled = false;
      executeButtonLabel.textContent = "点击打开ALLCPP申摊";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name) {
      clearFieldError(target.name);
    }
    markContentChanged();
    saveFormDefaults();
    updateValidationSummary();
  });

  form.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === "mode") {
      markContentChanged();
      updateModeUi();
      saveFormDefaults();
    }
  });

  clearButton.addEventListener("click", () => {
    const storageCleared = preferences.clearDefaults(browserStorage);
    form.reset();
    clearErrors();
    setMessage(
      storageCleared.ok
        ? "已清空表单，并删除当前浏览器保存的默认资料。"
        : "表单已清空，但浏览器未允许删除本机保存资料。",
      storageCleared.ok ? "info" : "error"
    );
    identityInput.type = "password";
    identityToggle.textContent = "显示";
    identityToggle.setAttribute("aria-label", "显示身份证号");
    identityToggle.setAttribute("aria-pressed", "false");
    updateModeUi();
    form.querySelector("input:not([type=radio])").focus();
  });

  identityToggle.addEventListener("click", () => {
    const show = identityInput.type === "password";
    identityInput.type = show ? "text" : "password";
    identityToggle.textContent = show ? "隐藏" : "显示";
    identityToggle.setAttribute("aria-label", show ? "隐藏身份证号" : "显示身份证号");
    identityToggle.setAttribute("aria-pressed", String(show));
    identityInput.focus();
  });

  const restoreState = restoreFormDefaults();
  updateModeUi();

  if (restoreState.restored) {
    setMessage("已自动载入上次保存的默认资料。", "success");
  } else if (restoreState.unavailable) {
    setMessage("浏览器阻止了本机自动保存；填写和申摊功能仍可正常使用。", "error");
  }
})();
