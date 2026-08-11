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
import { detectEnv } from '@bilibaba/ts-lab/browser'
import { createBus, getObjById } from '@bilibaba/ts-lab/tools'
```

打包工具（Vite / Rollup / webpack / esbuild 等）会自动 Tree-shake 未使用的模块。

也可以继续从根入口导入已有 API；分类入口更适合在 API 变多时保持清晰：

```ts
import { writeText } from '@bilibaba/ts-lab/browser'
import { progress } from '@bilibaba/ts-lab/ui'
import { getIco } from '@bilibaba/ts-lab/wasm'
```

## TypeScript

类型定义已内置在包中，无需额外安装 `@types/*`。

```ts
import { createBus } from '@bilibaba/ts-lab/tools'

interface Events {
  login: { user: string }
  logout: void
}

const bus = createBus<Events>()
//     ^? Bus<Events>
```
