# Recursion · Tree Data Query

A set of traversal utilities for tree data structures.

## TreeNode

```ts
interface TreeNode {
  id: string | number
  children?: TreeNode[]
  [key: string]: any
}
```

## getObjById

Find a node in the tree by `id`.

```ts
function getObjById<T extends TreeNode>(
  list: T[],
  id: string | number,
  idKey?: string,
  childrenKey?: string,
): T | null
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `list` | `T[]` | — | Tree data array |
| `id` | `string \| number` | — | Target node ID |
| `idKey` | `string` | `'id'` | ID field name |
| `childrenKey` | `string` | `'children'` | Children field name |

```ts
const tree = [
  { id: 1, children: [{ id: 11, children: [{ id: 111 }] }] },
  { id: 2, children: [{ id: 21 }] },
]

getObjById(tree, 111) // { id: 111 }
getObjById(tree, 999) // null
```

## getParentNodes

Get the list of **direct parent nodes** for the given node IDs.

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

Get the full path from the root node to the target node. Returns `null` if not found.

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

Find the **top-level ancestor node** of a given node.

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
