# Recursion · 树形数据查询

树形数据结构的遍历工具集。

## TreeNode

```ts
interface TreeNode {
  id: string | number
  children?: TreeNode[]
  [key: string]: any
}
```

## getObjById

在树中按 `id` 查找节点。

```ts
function getObjById<T extends TreeNode>(
  list: T[],
  id: string | number,
  idKey?: string,
  childrenKey?: string,
): T | null
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `list` | `T[]` | — | 树形数据数组 |
| `id` | `string \| number` | — | 目标节点 ID |
| `idKey` | `string` | `'id'` | ID 字段名 |
| `childrenKey` | `string` | `'children'` | 子节点字段名 |

```ts
const tree = [
  { id: 1, children: [{ id: 11, children: [{ id: 111 }] }] },
  { id: 2, children: [{ id: 21 }] },
]

getObjById(tree, 111) // { id: 111 }
getObjById(tree, 999) // null
```

## getParentNodes

获取指定节点 ID 的**直接父节点**列表。

```ts
function getParentNodes<T extends TreeNode>(
  list: T[],
  childIds: (string | number)[],
  idKey?: string,
  childrenKey?: string,
): T[]
```

```ts
getParentNodes(tree, [111, 21])
// [
//   { id: 11, children: [{ id: 111 }] },
//   { id: 2, children: [{ id: 21 }] },
// ]
```

## getPathById

获取从根节点到目标节点的完整路径。找不到时返回 `null`。

```ts
function getPathById<T extends TreeNode>(
  list: T[],
  id: string | number,
  idKey?: string,
  childrenKey?: string,
): T[] | null
```

```ts
getPathById(tree, 111)
// [{ id: 1, ... }, { id: 11, ... }, { id: 111 }]

getPathById(tree, 999)
// null
```

## getTopLevelNode

查找某个节点的**顶级祖先节点**。

```ts
function getTopLevelNode<T extends TreeNode>(
  list: T[],
  targetId: string | number,
  idKey?: string,
  childrenKey?: string,
): T | null
```

```ts
getTopLevelNode(tree, 111) // { id: 1, ... }
```
