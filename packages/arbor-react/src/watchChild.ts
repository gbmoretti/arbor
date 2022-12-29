import { ArborNode, isNode, MutationEvent } from "@arborjs/store"
import { ChildrenNodeProps, NodeProps } from "./watchChildren"
import { watchPaths } from "./watchPaths"

export type ObjectProps<T> = {
  [K in keyof T]: T[K] extends Function ? never : T[K] extends object ? K : never;
}[keyof T];

export type WatchableProps<T> = T extends Array<any>
  ? number
  : Extract<ObjectProps<T>, NodeProps<T>>

export function watchChild<T extends object>(childKey: WatchableProps<T>, ...props: ChildrenNodeProps<T>[]) {
  return (node: ArborNode<T>, event: MutationEvent) => {
    if (!isNode(node)) return false
    const childPath = node.$path.child(String(childKey))
    const potentialChildPath = event.mutationPath.child(event.metadata.props[0])
    if (potentialChildPath.targets(childPath)) return true

    const paths = props.length === 0
      ? [childPath.toString()]
      : props.map((prop) => childPath.child(`#${String(prop)}`).toString())

    return watchPaths(...paths)(node as ArborNode<T>, event)
  }
}
