# 贡献指南

感谢你对「打工人生存指南」项目的关注！欢迎参与贡献。

## 开发环境

1. Clone 仓库
   ```bash
   git clone https://github.com/hhyomi/dagong.git
   cd dagong
   ```

2. 直接用浏览器打开 `lite/index.html` 或使用任意静态服务器
   ```bash
   npx serve lite
   ```

## 项目结构

```
dagong/
├── lite/          # 轻量版（当前主版本）
├── prototype/     # 原型版本
└── README.md      # 项目说明
```

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 样式/格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `chore`: 构建/工具变更

示例：`feat: 添加打工成就系统`

## PR 流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交改动：`git commit -m "feat: 添加xxx"`
4. 推送分支：`git push origin feat/your-feature`
5. 发起 Pull Request

## 代码风格

- 使用 2 空格缩进
- 中文注释
- CSS 类名使用 kebab-case
- JS 变量使用 camelCase

## 报告问题

发现问题请在 Issues 中反馈，包含以下信息：

- 浏览器版本
- 复现步骤
- 期望行为 vs 实际行为
- 截图（如有）

## 待开发方向

参考 README 中的功能需求和后续规划，以下方向欢迎贡献：

- 深色模式
- 更多角色/贴纸
- 打工成就系统
- 移动端体验优化
- 图片压缩与缓存优化
