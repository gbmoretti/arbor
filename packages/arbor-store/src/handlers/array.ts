import { Arbor } from "arbor"
import { isNode } from "../guards"
import { Node, IteratorWrapper } from "../types"
import { pathFor } from "../utilities"
import { DefaultHandler } from "./default"

function refreshChildrenLinks(
  tree: Arbor,
  nodeValue: object[],
  { from = 0 } = {}
) {
  const node = tree.getNodeFor<unknown[]>(nodeValue) as Node<Node[]>
  for (let i = from; i < node.length; i++) {
    tree.attachNode(node[i], i.toString())
  }
}

export class ArrayHandler<T extends object = object> extends DefaultHandler<
  Node<T>[]
> {
  static accepts(value: unknown) {
    return Array.isArray(value)
  }

  /**
   * Provides an iterator that can be used to traverse the underlying Map data.
   *
   * @param wrap an optional wrapping function that can be used by scoped stores
   * to wrap items with their own scope providing path tracking behavior.
   */
  *[Symbol.iterator](wrap: IteratorWrapper = (n) => n) {
    for (const link of this.$value.keys()) {
      const child = this[link]
      yield isNode(child) ? wrap(child) : child
    }
  }

  deleteProperty(target: T[], prop: string): boolean {
    this.$tree.detachNodeFor(target[prop])

    this.$tree.mutate(this, (node: T[]) => {
      node.splice(parseInt(prop, 10), 1)

      return {
        operation: "delete",
        props: [prop],
      }
    })

    refreshChildrenLinks(this.$tree, this.$value, { from: parseInt(prop) })

    return true
  }

  push(...item: T[]): number {
    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.push(...item)

      return {
        operation: "push",
        props: [],
      }
    })

    return size
  }

  reverse() {
    this.$tree.mutate(this, (node: T[]) => {
      node.reverse()

      return {
        operation: "reverse",
        props: [],
      }
    })

    refreshChildrenLinks(this.$tree, this.$value)

    return this.$tree.getNodeAt<Node<T>[]>(pathFor(this))
  }

  pop(): T {
    let popped: T

    this.$tree.mutate(this, (node: T[]) => {
      const poppedIndex = node.length - 1
      popped = node.pop()

      return {
        operation: "pop",
        props: [String(poppedIndex)],
      }
    })

    this.$tree.detachNodeFor(popped)

    return popped
  }

  shift(): T {
    let shifted: T

    this.$tree.mutate(this, (node: T[]) => {
      shifted = node.shift()

      return {
        operation: "shift",
        props: ["0"],
      }
    })

    this.$tree.detachNodeFor(shifted)
    refreshChildrenLinks(this.$tree, this.$value)

    return shifted
  }

  sort(compareFn: (a: T, b: T) => number) {
    this.$tree.mutate(this, (node: T[]) => {
      node.sort(compareFn)

      return {
        operation: "sort",
        props: [],
      }
    })

    refreshChildrenLinks(this.$tree, this.$value)

    return this.$tree.getNodeAt(pathFor(this))
  }

  splice(start: number, deleteCount: number, ...items: T[]): T[] {
    let deleted: T[] = []

    this.$tree.mutate(this, (node: T[]) => {
      deleted = node.splice(start, deleteCount, ...items)

      return {
        operation: "splice",
        props: Array(deleteCount)
          .fill(0)
          .map((_, i) => String(start + i)),
      }
    })

    deleted.forEach(this.$tree.detachNodeFor.bind(this.$tree))
    refreshChildrenLinks(this.$tree, this.$value, { from: start })
    return deleted
  }

  unshift(...items: T[]): number {
    let size: number

    this.$tree.mutate(this, (node: T[]) => {
      size = node.unshift(...items)

      return {
        operation: "unshift",
        props: [],
      }
    })

    refreshChildrenLinks(this.$tree, this.$value)

    return size
  }
}
