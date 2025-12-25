# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此仓库中工作的指导。

## 项目概述

这是一个 **pnpm workspace monorepo**，用于管理带有共享配置的 TypeScript 包。项目使用 Biome 作为一体化的 linter 和 formatter，使用 Vitest 进行测试，并强制执行严格的提交规范。

## 架构

**Monorepo 结构：**
- `packages/*` - 主要包（目前为空，准备开发中）
- `internal/biome-config` - 共享的 Biome 配置，导出为 `@runes/biome-config`
- `internal/typescript-config` - 共享的 TypeScript 配置（`base.json`、`node.json`）
- `scripts/` - 构建工具和 git hooks

**Workspace 配置：**
- 所有包通过 pnpm workspaces 链接在一起
- 共享配置通过 workspace 协议（`workspace:*`）被所有包使用
- 只有 `esbuild` 和 `simple-git-hooks` 被构建为依赖项（在 `.npmrc` 中配置）

## 开发命令

**测试：**
```bash
pnpm test           # 以 watch 模式运行测试
pnpm coverage       # 生成覆盖率报告
```

**代码质量：**
```bash
pnpm check          # 运行 Biome 检查（format + lint）- 最常用
pnpm format         # 仅格式化代码
pnpm lint           # 仅 lint 并自动修复
pnpm typecheck      # TypeScript 类型检查（不生成文件）
```

**安装依赖：**
```bash
pnpm install        # 安装所有 workspace 依赖
# 注意：preinstall hook 强制使用 pnpm（使用 npm/yarn 会失败）
```

## 提交规范

**格式：** `<type>(<scope>): <subject>`（基于 Angular 规范）

**必需模式：**
```regexp
/^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/
```

**示例：**
- `feat(compiler): 添加 'comments' 选项`
- `fix(v-model): 处理 blur 事件 (close #28)`

**验证：**
- Pre-commit hook 运行 `lint-staged`（对暂存文件执行 Biome check）
- Commit-msg hook 通过 `scripts/verify-commit.js` 验证格式
- 提交信息验证错误以中文显示

详细信息请查看 `.github/commit-convention.md`。

## 配置文件

**共享配置：**
- `internal/biome-config/base.json` - Biome 规则（VCS 集成、import 排序、格式化）
- `internal/typescript-config/base.json` - 基础 TS 配置（ES2022、严格模式、bundler 解析）
- `internal/typescript-config/node.json` - Node 专用 TS 配置（NodeNext 模块）

**根配置：**
- `biome.json` - 扩展 `@runes/biome-config/base.json`
- `tsconfig.json` - 扩展 `@runes/typescript-config/node.json`
- `vitest.config.ts` - 测试配置，包含全局工具和多线程池

**编辑器集成：**
- VS Code：保存时使用 Biome 自动格式化（`.vscode/settings.json`）
- Zed：保存时使用 Biome 自动格式化，hard tabs（`.zed/settings.json`）

## CI/CD

**GitHub Actions：**
- 工作流：`.github/workflows/test.yml`
- 运行环境：Ubuntu 和 Windows（matrix 策略）
- 步骤：checkout → 安装 pnpm → 设置 Node.js（从 `.node-version`）→ 安装依赖 → 运行测试
- 触发条件：推送到 `main` 分支或针对 `main` 分支的 pull request

## 重要注意事项

**包管理器：**
- **必须使用 pnpm** - 由 preinstall hook 强制执行（`npx only-allow pnpm`）
- 版本：10.26.0（在 `package.json` 的 packageManager 字段中指定）

**Node.js：**
- 当前版本：24.12.0（`.node-version`）
- 最低要求：>=20.0.0（`package.json` 中的 `engines`）

**Git Hooks：**
- 由 `simple-git-hooks` 管理（通过 postinstall 自动安装）
- Lint-staged 使用 `--concurrent false` 运行以避免冲突

**Biome vs 传统工具：**
- Biome 替代了 ESLint + Prettier + Import Sorter
- 大多数代码质量任务使用 `pnpm check`
- Biome 配置在所有 workspace 包中共享
