# 便利贴（dsh-sticky-notes）

一款运行在 DSH（DeepSeek Harness）中的轻量便签插件。左侧栏提供入口，打开后可在中央面板以彩色卡片形式记录想法，数据自动保存在浏览器本地。

## 插件信息

- **包名**：`@oakzhong/dsh-sticky-notes`
- **版本**：`1.1.0`
- **入口**：`index.js`（包 / Host 半部）与 `client.js`（Client 半部）；界面入口为左侧栏「便利贴」
- **类型**：DSH Cordis bundle，Client 端插件（`dsh.client.platform: web`、`immediately: true`）；Host 半部为空实现，全部 UI 与逻辑在 Client

## 使用技术

| 层面 | 技术 |
|---|---|
| 插件框架 | DSH Cordis bundle（`cordis.patch.yml` 插入 Loader 行） |
| Host 半部 | ESM `export function apply() {}`，无后端路由 |
| Client 半部 | `window.__ModuleLoader__` 注册的前端模块，React 无 JSX（`React.createElement`） |
| UI 样式 | 组件内注入 `<style>`（`data-plugin-css` 标识），使用 DSH 主题 token，自动适配明暗主题 |
| 国际化 | `ctx.locale.register / bind`，中英双语（zh / en） |
| 数据存储 | 浏览器 `localStorage`，键 `dsh-sticky-notes.notes.v1` |
| 图形 | CSS 绘制卡片（便签纸折角用渐变模拟），无图片依赖 |

## 功能

### 1. 便签管理
- **新建**便利贴，自动生成一张带默认颜色的卡片
- **标题 + 正文**两个输入区，直接编辑，输入即自动保存
- **删除**单张便签（带确认提示）
- **6 种颜色**一键切换卡片背景（黄 / 粉 / 绿 / 蓝 / 橙 / 紫）

### 2. 浏览与展示
- 卡片以响应式网格排列，尺寸宽松（最小 260 × 230），标题 / 正文区域充足
- 卡片底部**同一行**显示「创建时间 / 更新时间」
- **搜索**：按标题或正文模糊过滤
- **缩放**：工具栏 `−` / 百分比 / `+`，范围 60%~200%，点百分比重置到 100%

### 3. 数据、主题与安全
- 所有便签保存到 `localStorage`，刷新 / 重启不丢失
- 读取时兼容旧数据（自动补标题字段、校验颜色值、补时间戳）
- 中英双语，随 DSH 语言设置切换
- 使用宿主主题 token，文字与背景自动适配明暗主题
- 便签正文仅以 React 元素渲染，绝不作为 HTML 解析

### 数据结构

每张便签为一个对象：

```js
{
  id: string,          // 唯一标识
  heading: string,     // 标题
  text: string,        // 正文
  color: string,       // 背景色（COLORS 之一）
  createdAt: number,   // 创建时间戳
  updatedAt: number,   // 最后更新时间戳
}
```

## 目录结构

```
dsh-sticky-notes/
├── package.json        # 清单、bundle 配置、client 注入声明
├── cordis.patch.yml    # Loader 插入行
├── index.js            # Host 半部（空实现）
├── client.js           # Client 半部：UI、状态、存储、样式
├── locale/
│   ├── zh.json         # 中文显示元信息
│   └── en.json         # 英文显示元信息
├── icon.svg            # 插件图标
├── README.md           # 英文文档
└── README.zh.md        # 中文文档
```

## 安装与使用

1. 通过插件管理器安装该 bundle（`install_bundle` 指向本目录）
2. 左侧栏点击「便利贴」
3. 点「新建便利贴」开始记录，标题和正文可随时编辑，自动保存
4. 用颜色按钮区分便签，用搜索快速定位，用缩放调整卡片大小

### 置顶与导入导出
- **置顶**：点击便利贴右上角的图钉（📍/📌）置顶或取消；置顶便利贴排在最前，并带金色高亮边框。
- **导出**：工具栏「导出」下载全部便利贴为 JSON（`sticky-notes.json`）。
- **导入**：工具栏「导入」读取 JSON 文件，追加到现有便利贴；导入时重新生成 id 避免冲突，并校验颜色/时间等字段。
