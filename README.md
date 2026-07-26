# ts-lab

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

A collection of utility functions for everyday TypeScript development.

## Install

```bash
pnpm add ts-lab
```

## Modules

### Recursion

Tree traversal utilities.

```ts
import { getObjById, getParentNodes, getPathById, getTopLevelNode } from 'ts-lab'

const tree = [
  { id: 1, children: [{ id: 11, children: [{ id: 111 }] }] },
  { id: 2, children: [{ id: 21 }] },
]

getObjById(tree, 111) // { id: 111 }
getParentNodes(tree, [111, 21]) // [parent of 111, parent of 21]
getPathById(tree, 111) // [{ id: 1 }, { id: 11 }, { id: 111 }]
getTopLevelNode(tree, 111) // { id: 1 }
```

### Bus

Lightweight event bus.

```ts
import { createBus } from 'ts-lab'

interface Events { login: string, logout: void }

const bus = createBus<Events>()

bus.on('login', user => console.log(user))
bus.on('*', (type, event) => console.log(type, event))

bus.emit('login', 'bibibala')
// → "bibibala"
// → "login" "bibibala"

bus.off('login', handler)
```

## API

### `recursion`

| Function | Description |
|---|---|
| `getObjById(list, id, idKey?, childrenKey?)` | Find a node by id in a tree |
| `getParentNodes(list, childIds, idKey?, childrenKey?)` | Find direct parents of given child ids |
| `getPathById(list, id, idKey?, childrenKey?)` | Get the full path from root to target node |
| `getTopLevelNode(list, targetId, idKey?, childrenKey?)` | Find the root ancestor of a node |
| `TreeNode` | Generic tree node interface |

### `bus`

| Function | Description |
|---|---|
| `createBus(events?)` | Create a new event bus instance |
| `bus.on(type, handler)` | Register an event handler |
| `bus.off(type, handler)` | Remove an event handler |
| `bus.emit(type, event?)` | Emit an event |
| `bus.all` | Internal `Map` of all handlers (shareable across instances) |

## License

[MIT](./LICENSE) License © [bibibala](https://github.com/bibibala)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/ts-lab?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/ts-lab
[npm-downloads-src]: https://img.shields.io/npm/dm/ts-lab?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/ts-lab
[bundle-src]: https://img.shields.io/bundlephobia/minzip/ts-lab?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=ts-lab
[license-src]: https://img.shields.io/github/license/bibibala/ts-lab.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/bibibala/ts-lab/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/ts-lab
