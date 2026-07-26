/**
 * Generic tree node type (field names can be overridden via params)
 */
export interface TreeNode {
  id?: string | number
  children?: TreeNode[]

  [key: string]: any
}
