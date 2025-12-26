# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此仓库中工作的指导。

## 项目概述

这是一个 **pnpm workspace monorepo**，用于构建 React 状态管理库生态系统。项目使用 Biome 作为一体化的 linter 和 formatter，使用 Vitest 进行测试，并强制执行严格的提交规范。

**设计理念：** 无构建系统 TypeScript 项目 - 直接从源码导出，依赖使用方的构建工具进行编译

## 包架构

### 发布包 (`packages/`)

#### **@runes/store** - React 状态管理库
**核心功能：**
- 基于 `useSyncExternalStore` 的 React 18+ 状态管理
- 两种存储引擎：Memory（内存）和 Storage（localStorage/sessionStorage）
- 发布订阅系统实现响应式更新
- 支持跨标签页同步（localStorage 模式）
- 版本化数据迁移

**主要导出：**
```typescript
// 存储构造函数
createMemoryStore(initialData?: Record<string, any>)
createStorageStore(version?: string, appKey?: string, engine?: Storage)

// React Hooks
useStore<T>(key: string, defaultValue?: T): [T, Setter<T>]
useStoreContext(): Store
useResetStore(): () => void
useRemoveFromStore(key?: string): (key?: string) => void
useRemoveItemsFromStore(prefix?: string): (prefix?: string) => void

// 组件
<StoreContextProvider value={store}>
<StoreSetter name="key" value={value}>
```

**Store 接口：**
```typescript
interface Store {
  setup(): void;                    // 初始化（注册事件监听器）
  teardown(): void;                 // 清理（移除监听器）
  getItem<T>(key: string, defaultValue?: T): T | undefined;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  removeItems(keyPrefix: string): void;  // 批量删除
  reset(): void;                    // 清空所有数据
  subscribe(key: string, callback: (value: any) => void): () => void;
}
```

**架构模式：**
- **Adapter Pattern**: Store 接口抽象存储后端
- **Observer Pattern**: 订阅系统实现响应式更新
- **Provider Pattern**: React Context 依赖注入
- **Factory Pattern**: createMemoryStore/createStorageStore 工厂函数

**存储键格式：**
- Memory: 直接使用 key
- Storage: `runes${appKey}.${key}` （例如 `runesMyApp.theme`）
- 版本键: `runes${appKey}.version`

**重要实现细节：**
- Memory Store 在 setup 前可以排队操作
- Storage Store 使用 JSON 序列化，解析失败时返回原始字符串
- 版本不匹配时自动清空所有数据
- 跨标签页同步通过 `window.addEventListener('storage')` 实现
- STORE 常量定义为 `"runes"`，导出供测试使用

### 内部包 (`internal/`)

#### **@runes/typescript-config**
- `base.json` - ES2022, strict, bundler resolution
- `node.json` - NodeNext 模块系统
- `react-library.json` - JSX 支持，React 类型

#### **@runes/biome-config**
- `base.json` - 基础规则（VCS 集成、格式化、linting）
- `react-library.json` - React 专用（禁用某些严格规则）

## 开发命令

**测试：**
```bash
pnpm test                    # Watch 模式运行所有测试
pnpm coverage                # 生成覆盖率报告
cd packages/store && pnpm test  # 单个包测试
```

**代码质量：**
```bash
pnpm check          # format + lint + 自动修复（最常用）
pnpm format         # 仅格式化
pnpm lint           # 仅 lint
pnpm typecheck      # TypeScript 类型检查
```

**包管理：**
```bash
pnpm install        # 安装所有依赖（强制使用 pnpm）
```

**注意：** 本项目采用无构建设计，包直接从 `src/` 导出 TypeScript 源码，由使用方的构建工具（如 Vite、Next.js 等）负责编译

## 测试架构

**框架：** Vitest 4.0.16 + Testing Library

**配置：**
- 全局 test API (`describe`, `it`, `expect`)
- jsdom 环境模拟浏览器 DOM
- 多线程并行执行
- React 组件测试支持

**测试文件位置：**
- 与源文件并列：`*.test.ts` / `*.test.tsx`
- 例如：`memory.ts` → `memory.test.ts`

**测试质量：**
- 147 个测试用例，全部通过
- 测试行数约为源码 4 倍（2835 vs 738 行）
- 覆盖边界情况、空值、类型推断、生命周期

**运行特定测试：**
```bash
# 从根目录
pnpm test packages/store/src/memory.test.ts

# 从包目录
cd packages/store
pnpm test memory.test.ts
```

## 提交规范

**格式：** `<type>(<scope>): <subject>`

**类型：**
feat, fix, docs, dx, style, refactor, perf, test, workflow, build, ci, chore, types, wip, release

**示例：**
- `feat(store): 添加跨标签页同步支持`
- `fix(storage): 修复 JSON 解析错误处理`
- `test(memory): 增加边界情况测试`

**自动验证：**
- Pre-commit: Biome 检查暂存文件
- Commit-msg: 格式验证（`scripts/verify-commit.js`）
- 错误信息为中文

## 开发工作流

### 添加新功能到 @runes/store

1. **在 `packages/store/src/` 创建源文件**
2. **编写对应的 `.test.ts` 文件**
3. **在 `index.ts` 中导出 API**
4. **运行测试确保通过**
5. **提交更改**

### 添加新包

1. **在 `packages/` 创建目录**
2. **添加 `package.json`：**
   ```json
   {
     "name": "@runes/package-name",
     "version": "0.0.1",
     "type": "module",
     "main": "src/index.ts",
     "devDependencies": {
       "@runes/biome-config": "workspace:*",
       "@runes/typescript-config": "workspace:*"
     }
   }
   ```
3. **添加 `tsconfig.json` 和 `biome.json`**
4. **创建 `src/index.ts`**
5. **运行 `pnpm install` 链接依赖**

### 修复测试失败

**常见问题：**
- **localStorage key 不匹配**: 确保使用 `STORE` 常量（从 storage.ts 导入）
- **React hook 错误**: 检查是否在 `renderHook` 或组件内调用
- **异步状态更新**: 使用 `act()` 包装状态变更

## 配置文件

**共享配置：**
- `internal/biome-config/base.json` - Biome 核心规则
- `internal/typescript-config/base.json` - TS 严格模式配置
- `internal/typescript-config/node.json` - Node 环境配置
- `internal/typescript-config/react-library.json` - React 库配置

**包级配置示例：**
```json
// packages/store/tsconfig.json
{
  "extends": "@runes/typescript-config/react-library.json",
  "include": ["src"]
}

// packages/store/biome.json
{
  "extends": ["@runes/biome-config/react-library.json"]
}
```

## CI/CD

**GitHub Actions：**
- 触发：推送到 `main` 或针对 `main` 的 PR
- 矩阵：Ubuntu + Windows
- 步骤：安装 → 测试
- 配置文件：`.github/workflows/test.yml`

**说明：**
- 仅运行测试和类型检查
- 无构建步骤（符合项目设计）
- 未来可能添加 npm 发布流程

## 重要注意事项

**包管理器：**
- **必须使用 pnpm 10.26.0**
- preinstall hook 强制执行

**Node.js：**
- 当前：24.12.0（`.node-version`）
- 最低：20.0.0

**工具链：**
- **Biome** 替代 ESLint + Prettier
- **Vitest** 替代 Jest
- **pnpm workspaces** 管理 monorepo

**代码风格：**
- 双引号
- 2 空格缩进
- LF 行尾
- 自动 import 排序

**国际化：**
- 代码注释使用中文
- JSDoc 示例使用中文
- 错误信息使用中文

## 项目特性

**核心设计决策：**
- ✅ 无构建系统 - 直接发布 TypeScript 源码
- ✅ 依赖现代构建工具 - 由使用方负责编译（Vite、Next.js、Webpack 5+ 等）
- ✅ 类型安全优先 - 完整的 TypeScript 类型定义
- ✅ 测试驱动 - 高覆盖率的单元测试

**优势：**
- 无需维护构建配置
- 使用方可以利用自己的构建优化
- 开发体验快速（无编译步骤）
- Tree-shaking 友好

**未来计划：**
- [ ] npm 发布流程
- [ ] API 文档网站
- [ ] 更多生态包
- [ ] 使用示例和最佳实践文档
