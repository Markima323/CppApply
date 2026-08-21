# ALLCPP自动申摊器

[![Version](https://img.shields.io/badge/version-1.3.3-e85b3f)](https://github.com/Markima323/CppApply/releases)
[![Chrome](https://img.shields.io/badge/Chrome-102%2B-4285F4?logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![Manifest](https://img.shields.io/badge/Manifest-V3-34A853)](ALLCPPApply/manifest.json)
[![Tests](https://img.shields.io/badge/tests-20%20passing-2f855a)](bin/test)

一个零依赖的 Chrome 扩展，自动使用填写好的资料完成 ALLCPP 申摊，并支持将已退摊记录更新为申请状态。

> [!WARNING]
> 点击“点击打开ALLCPP申摊”后会立即向 ALLCPP 发起真实申请。请先登录正确账号并仔细核对活动、展品、UID 和联系人资料。

本项目是非官方辅助工具，与 ALLCPP 官方无隶属或合作关系。请自行确认使用行为符合平台规则，并自行承担操作结果。

## 目录

- [主要功能](#主要功能)
- [环境要求](#环境要求)
- [下载与安装](#下载与安装)
- [使用方法](#使用方法)
- [字段说明](#字段说明)
- [权限说明](#权限说明)
- [隐私与安全](#隐私与安全)
- [常见问题](#常见问题)
- [项目结构](#项目结构)
- [本地开发](#本地开发)
- [发布新版本](#发布新版本)
- [问题反馈与贡献](#问题反馈与贡献)
- [许可证](#许可证)

## 主要功能

- 支持“申摊”和“已退摊更新为申请”两种操作。
- 自动从活动主页、展品和社团页面链接中提取对应 ID。
- 实时检查必填项和输入格式，资料正确后才允许执行。
- 自动打开 ALLCPP 管理页面，等待页面加载完成后执行申请。
- 在 ALLCPP 页面显示操作类型、活动名称，以及成功或失败原因。
- 可一键前往申摊结果页面查看记录。
- 自动在当前浏览器本机保存表单资料，方便下次继续使用。
- 不包含第三方 JavaScript 依赖、遥测或云端同步。

## 环境要求

- Google Chrome 102 或更高版本。
- 已解压的扩展文件夹 `ALLCPPApply`。
- 执行申请前，已在同一个 Chrome 浏览器中登录 ALLCPP。

## 下载与安装

### 从 Release 安装（推荐）

1. 打开项目的 [Releases 页面](https://github.com/Markima323/CppApply/releases)。
2. 展开最新版本的 **Assets**。
3. 下载 `ALLCPP自动申摊器-v1.3.3.zip`，不要下载 GitHub 自动生成的 Source code 压缩包。
4. 将 ZIP 完整解压到一个不会随意移动的位置。
5. 在 Chrome 地址栏输入 `chrome://extensions/`。
6. 打开页面右上角的“开发者模式”。
7. 点击“加载未打包的扩展程序”。
8. 选择解压出来的 `ALLCPPApply` 文件夹。该文件夹中应直接包含 `manifest.json`。
9. 确认“ALLCPP自动申摊器”卡片处于启用状态。
10. 点击 Chrome 工具栏上的扩展程序图标，可将本扩展固定到工具栏。

压缩包内还附带 `使用教程.docx`，其中提供逐步安装和使用说明。

### 从源码安装

```powershell
git clone https://github.com/Markima323/CppApply.git
cd CppApply
```

然后在 `chrome://extensions/` 中加载仓库里的 `ALLCPPApply` 文件夹。

## 使用方法

1. 点击 Chrome 工具栏中的“ALLCPP自动申摊器”。
2. 选择“申摊”或“已退摊更新为申请”。
3. 填写活动、展品、账号和联系人资料。
4. 等待右侧状态变为“资料填写完成”。
5. 确认当前 Chrome 已登录正确的 ALLCPP 账号。
6. 点击“点击打开ALLCPP申摊”。
7. 扩展会打开 `https://www.allcpp.cn/mng/action.do`，页面加载完成后自动执行申请。
8. 在提示框中查看操作类型、活动名称和申摊结果；失败时会同时显示原因。
9. 可点击“点击查看申摊结果”前往 ALLCPP 的申请记录页面。

## 字段说明

| 字段 | 两种模式是否必填 | 示例或说明 |
| --- | --- | --- |
| 活动主页链接 | 是 | `https://www.allcpp.cn/allcpp/event/event.do?event=********` |
| 随意一个展品链接 | 是 | `https://www.allcpp.cn/d/********.do`，应使用当前账号的展品 |
| UID | 是 | ALLCPP 用户数字 ID |
| 社团页面链接 | 仅更新模式 | `https://www.allcpp.cn/c/********.do` |
| 姓名 | 是 | 联系人姓名 |
| 身份证号 | 是 | 默认遮罩显示，可点击“显示”核对 |
| 联系电话 | 是 | 申摊联系人电话 |
| 电子邮箱 | 是 | 申摊联系人邮箱 |

展品 ID、社团 ID 和活动 ID 也兼容直接填写数字，但推荐粘贴完整页面链接以减少抄写错误。

## 权限说明

扩展只声明执行流程需要的权限：

| 权限 | 用途 |
| --- | --- |
| `tabs` | 打开 ALLCPP 管理页面并等待目标标签页完成加载 |
| `scripting` | 在目标 ALLCPP 页面中注入并执行申请流程 |
| `https://www.allcpp.cn/*` | 将扩展能力限制在 ALLCPP 域名下 |

## 隐私与安全

- 姓名、身份证号、电话、邮箱等资料会以明文形式保存在扩展自己的 `localStorage` 中。
- 数据不会被上传到开发者服务器，也没有遥测或云同步；执行申摊时，必要资料会发送给 ALLCPP。
- 请勿将已经填写个人资料的浏览器配置、截图或导出文件分享给他人。
- 在共用电脑上使用后，请点击“清空保存”，或在 Chrome 中移除该扩展及其网站数据。
- `.gitignore` 已排除常见密钥、私有资料、日志和本地导出目录，但提交前仍应运行 `git status` 人工检查。

## 常见问题

### Chrome 提示无法加载扩展

确认选择的是 `ALLCPPApply` 文件夹，而不是它的上一级目录或尚未解压的 ZIP。所选目录中必须直接存在 `manifest.json`。

### 页面提示“申摊功能需要先把当前目录加载为 Chrome 扩展”

不要双击 `index.html`。请先按照安装步骤加载扩展，再从 Chrome 工具栏打开面板。

### 点击按钮后提示未登录或页面异常

先在同一个 Chrome 用户配置中访问并登录 ALLCPP，再重新执行。若登录已经过期，请完成重新登录。

### 链接一直提示格式错误

请从 ALLCPP 页面复制完整链接。活动链接应包含 `event` 参数，展品和社团链接路径中应包含数字 ID。

### 页面自动出现上次填写的资料

这是本机自动保存功能。点击面板右上角“清空保存”可清空表单并删除已保存资料。

### 如何更新扩展

下载并解压新版 ZIP，用新版 `ALLCPPApply` 替换旧文件夹，然后打开 `chrome://extensions/`，点击扩展卡片上的刷新按钮。重要资料请先自行核对或备份。

## 项目结构

```text
CppApply/
├─ ALLCPPApply/            # 可直接加载到 Chrome 的完整扩展
│  ├─ manifest.json
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js
│  ├─ background.js
│  ├─ extension-runner.js
│  ├─ generator.js
│  └─ storage.js
├─ bin/                    # 测试和发布辅助文件
│  ├─ test/
│  └─ package.json
├─ .gitignore
├─ README.md
└─ 使用教程.docx           # 随 Release 一同提供的使用教程
```

## 本地开发

项目运行代码没有第三方依赖。测试需要 Node.js，进入 `bin` 后运行：

```powershell
npm test
```

也可以在仓库根目录直接运行：

```powershell
node --test bin/test/*.test.js
```

## 发布新版本

维护者发布前应完成以下检查：

1. 更新 `ALLCPPApply/manifest.json` 和 `bin/package.json` 中的版本号。
2. 运行全部测试，并手动验证两种申请模式。
3. 检查 `git status`，确认没有身份证号、电话、邮箱、Cookie、Token 或真实链接被提交。
4. 创建只包含 `ALLCPPApply` 文件夹与 `使用教程.docx` 的发布 ZIP。
5. 提交并推送代码，为该提交创建形如 `v1.3.3` 的 Git 标签。
6. 在 GitHub 的 Releases 页面新建 Release，填写版本说明并上传发布 ZIP。
7. 下载刚上传的文件并重新解压验证，确认 `manifest.json` 位于 `ALLCPPApply` 文件夹第一层。

详细发布操作可参阅 [GitHub 官方 Release 文档](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository?tool=webui)。

## 问题反馈与贡献

- 遇到问题时，请在 [Issues](https://github.com/Markima323/CppApply/issues) 中说明 Chrome 版本、扩展版本、操作模式和错误提示。
- 请勿在 Issue、截图或日志中提交身份证号、电话、邮箱、Cookie、Token、UID 或未公开的活动资料。
- 欢迎提交修复和改进建议。提交 Pull Request 前请先运行全部测试。

## 许可证

当前仓库尚未包含开源许可证。在作者添加明确的 `LICENSE` 文件之前，默认保留全部权利；公开可见不等于允许复制、修改或再分发源代码。
