# 安装

## 使用包管理器

::: code-group
```bash [pnpm]
pnpm add @bilibaba/ts-lab
```
```bash [npm]
npm install @bilibaba/ts-lab
```
```bash [yarn]
yarn add @bilibaba/ts-lab
```
:::

## ESM 导入

本包仅提供 ESM 格式，所有模块均可按需导入：

```ts
import { createBus, getObjById, detectEnv } from '@bilibaba/ts-lab'
```

打包工具（Vite / Rollup / webpack / esbuild 等）会自动 Tree-shake 未使用的模块。

## TypeScript

类型定义已内置在包中，无需额外安装 `@types/*`。

```ts
import { createBus } from '@bilibaba/ts-lab'

interface Events {
  login: { user: string }
  logout: void
}

const bus = createBus<Events>()
//     ^? Bus<Events>
```
