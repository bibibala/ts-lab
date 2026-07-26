import { describe, expect, it } from 'vitest'
import { getObjById, getParentNodes, getPathById, getTopLevelNode } from '../src'

const tree = [
  {
    id: 1,
    name: 'root-1',
    children: [
      {
        id: 11,
        name: 'child-1-1',
        children: [
          { id: 111, name: 'leaf-1-1-1' },
          { id: 112, name: 'leaf-1-1-2' },
        ],
      },
      { id: 12, name: 'child-1-2' },
    ],
  },
  {
    id: 2,
    name: 'root-2',
    children: [
      {
        id: 21,
        name: 'child-2-1',
        children: [
          { id: 211, name: 'leaf-2-1-1' },
        ],
      },
    ],
  },
]

const customKeyTree = [
  {
    uid: 'a',
    subs: [
      { uid: 'b', subs: [{ uid: 'c' }] },
    ],
  },
]

describe('getObjById', () => {
  it('should find node at root level', () => {
    expect(getObjById(tree, 1)?.name).toBe('root-1')
  })

  it('should find node at deep level', () => {
    expect(getObjById(tree, 111)?.name).toBe('leaf-1-1-1')
  })

  it('should return null if not found', () => {
    expect(getObjById(tree, 999)).toBeNull()
  })

  it('should return null for empty array', () => {
    expect(getObjById([], 1)).toBeNull()
  })

  it('should return null for non-array input', () => {
    expect(getObjById(null as any, 1)).toBeNull()
  })

  it('should work with custom idKey and childrenKey', () => {
    expect(getObjById(customKeyTree, 'c', 'uid', 'subs')?.uid).toBe('c')
  })
})

describe('getParentNodes', () => {
  it('should find direct parent of a leaf', () => {
    const parents = getParentNodes(tree, [111])
    expect(parents).toHaveLength(1)
    expect(parents[0].id).toBe(11)
  })

  it('should find parents for multiple children', () => {
    const parents = getParentNodes(tree, [111, 12])
    expect(parents).toHaveLength(2)
    expect(parents.map(p => p.id).sort()).toEqual([1, 11])
  })

  it('should return empty array if no match', () => {
    expect(getParentNodes(tree, [999])).toEqual([])
  })

  it('should work with custom keys', () => {
    const parents = getParentNodes(customKeyTree, ['b'], 'uid', 'subs')
    expect(parents).toHaveLength(1)
    expect(parents[0].uid).toBe('a')
  })
})

describe('getTopLevelNode', () => {
  it('should find top-level ancestor for a leaf', () => {
    const top = getTopLevelNode(tree, 111)
    expect(top?.id).toBe(1)
  })

  it('should return itself if target is already a top-level node', () => {
    const top = getTopLevelNode(tree, 1)
    expect(top?.id).toBe(1)
  })

  it('should return null if target not found', () => {
    expect(getTopLevelNode(tree, 999)).toBeNull()
  })

  it('should work with custom keys', () => {
    const top = getTopLevelNode(customKeyTree, 'c', 'uid', 'subs')
    expect(top?.uid).toBe('a')
  })
})

describe('getPathById', () => {
  it('should return full path from root to leaf', () => {
    const path = getPathById(tree, 111)
    expect(path).toHaveLength(3)
    expect(path![0].id).toBe(1)
    expect(path![1].id).toBe(11)
    expect(path![2].id).toBe(111)
  })

  it('should return single-element path for root-level node', () => {
    const path = getPathById(tree, 1)
    expect(path).toHaveLength(1)
    expect(path![0].id).toBe(1)
  })

  it('should return null if not found', () => {
    expect(getPathById(tree, 999)).toBeNull()
  })

  it('should return null for empty array', () => {
    expect(getPathById([], 1)).toBeNull()
  })

  it('should work with custom keys', () => {
    const path = getPathById(customKeyTree, 'c', 'uid', 'subs')
    expect(path).toHaveLength(3)
    expect(path![0].uid).toBe('a')
    expect(path![1].uid).toBe('b')
    expect(path![2].uid).toBe('c')
  })
})
