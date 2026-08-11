import type { TreeNode } from './types'

export function findNodeInTree<T extends Record<string, any> = TreeNode>(
  node: T,
  targetId: string | number,
  idKey: string = 'id',
  childrenKey: string = 'children',
): boolean {
  if (node[idKey] === targetId)
    return true

  const children = node[childrenKey] as T[] | undefined
  if (children) {
    for (const child of children) {
      if (findNodeInTree(child, targetId, idKey, childrenKey))
        return true
    }
  }

  return false
}
