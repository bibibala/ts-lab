import type { TreeNode } from './types'
/**
 * Generic tree node type (field names can be overridden via params)
 */
import { findNodeInTree } from './internal'

export type { TreeNode }

/**
 * @description Recursively find a node by id
 * @param list Tree array
 * @param id Target id
 * @param idKey Unique identifier field name, default 'id'
 * @param childrenKey Children field name, default 'children'
 */
export function getObjById<T extends Record<string, any> = TreeNode>(
  list: T[],
  id: string | number,
  idKey: string = 'id',
  childrenKey: string = 'children',
): T | null {
  if (!Array.isArray(list)) {
    return null
  }

  for (const item of list) {
    if (item[idKey] === id) {
      return item
    }
    const children = item[childrenKey] as T[] | undefined
    if (children && children.length) {
      const value = getObjById(children, id, idKey, childrenKey)
      if (value)
        return value
    }
  }

  return null
}

/**
 * @description Recursively find all direct parent nodes by child id array
 */
export function getParentNodes<T extends Record<string, any> = TreeNode>(
  treeList: T[],
  childIds: (string | number)[],
  idKey: string = 'id',
  childrenKey: string = 'children',
): T[] {
  const parentNodes: T[] = []

  function findParent(node: T): void {
    const children = node[childrenKey] as T[] | undefined
    if (children && children.some(child => childIds.includes(child[idKey]))) {
      parentNodes.push(node)
    }
    if (children && children.length > 0) {
      for (const childNode of children) {
        findParent(childNode)
      }
    }
  }

  for (const rootNode of treeList) {
    findParent(rootNode)
  }
  return parentNodes
}

/**
 * @description Find the top-level (root) node that contains the target node
 */
export function getTopLevelNode<T extends Record<string, any> = TreeNode>(
  treeList: T[],
  targetId: string | number,
  idKey: string = 'id',
  childrenKey: string = 'children',
): T | null {
  const parentIds = new Set<string | number>()
  treeList.forEach((node) => {
    const children = node[childrenKey] as T[] | undefined
    children?.forEach(child => parentIds.add(child[idKey]))
  })

  const topLevelNodes = treeList.filter(node => !parentIds.has(node[idKey]))

  for (const topLevelNode of topLevelNodes) {
    if (findNodeInTree(topLevelNode, targetId, idKey, childrenKey)) {
      return topLevelNode
    }
  }

  return null
}

export function getPathById<T extends Record<string, any> = TreeNode>(
  list: T[],
  id: string | number,
  idKey: string = 'id',
  childrenKey: string = 'children',
): T[] | null {
  for (const item of list) {
    if (item[idKey] === id) {
      return [item]
    }
    const children = item[childrenKey] as T[] | undefined
    if (children && children.length) {
      const subPath = getPathById(children, id, idKey, childrenKey)
      if (subPath)
        return [item, ...subPath]
    }
  }
  return null
}
