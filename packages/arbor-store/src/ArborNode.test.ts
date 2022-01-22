import Arbor from "./Arbor"
import ArborNode from "./ArborNode"
import Collection from "./Collection"

describe("ArborNode", () => {
  class Todo extends ArborNode<Todo> {
    uuid!: string
    text!: string
    completed: boolean
  }

  describe("#detach", () => {
    it("allows detaching a node from the state tree", () => {
      const store = new Arbor(
        new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        )
      )

      const todo1 = store.root.fetch("abc")

      todo1.detach()

      expect(store.root.fetch("abc")).toBeUndefined()
      expect(todo1.isAttached()).toBe(false)
    })
  })

  describe("#attach", () => {
    it("allows attaching nodes back into the state tree", () => {
      const store = new Arbor(
        new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        )
      )

      const todo1 = store.root.fetch("abc")

      store.root.delete(todo1)

      expect(store.root.fetch("abc")).toBeUndefined()
      expect(todo1.isAttached()).toBe(false)

      todo1.attach()

      expect(todo1.isAttached()).toBe(true)
      expect(store.root.fetch("abc")).toBe(todo1)
    })
  })

  describe("#merge", () => {
    it("allows merging attributes to the node", () => {
      const store = new Arbor(
        new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        )
      )

      const root = store.root
      const todo1 = store.root.fetch("abc")
      const todo2 = store.root.fetch("bcd")

      todo1.merge({ text: "Walk the dogs" })

      expect(store.root).not.toBe(root)
      expect(store.root.fetch("bcd")).toBe(todo2)
      expect(store.root.fetch("abc")).not.toBe(todo1)
      expect(store.root.fetch("abc")).toEqual(
        new Todo({ uuid: "abc", text: "Walk the dogs", completed: false })
      )
    })
  })

  describe("#reload", () => {
    it("allows reloading stale nodes", () => {
      const store = new Arbor(
        new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        )
      )

      const todo = store.root.fetch("abc")

      expect(todo.isStale()).toBe(false)

      todo.merge({ text: "Walk the dogs" })

      expect(todo.isStale()).toBe(true)

      const reloaded = todo.reload()

      expect(todo).not.toBe(store.root.fetch("abc"))
      expect(reloaded).toBe(store.root.fetch("abc"))
    })
  })

  describe("#isAttached", () => {
    it("checks whether or not a node belongs to the state tree", () => {
      const store = new Arbor(
        new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        )
      )

      const todo = store.root.fetch("abc")

      expect(todo.isAttached()).toBe(true)
      store.root.delete("abc")
      expect(todo.isAttached()).toBe(false)
    })
  })

  describe("#isStale", () => {
    it("checks whether or not a node is out dated", () => {
      const store = new Arbor(
        new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        )
      )

      const todo = store.root.fetch("abc")

      expect(todo.isStale()).toBe(false)
      todo.text = "Walk the dogs"
      expect(todo.isStale()).toBe(true)
    })
  })

  describe("#path", () => {
    it("retrieves the node path within the state tree", () => {
      const store = new Arbor({
        todos: new Collection(
          new Todo({ uuid: "abc", text: "Do the dishes", completed: false }),
          new Todo({ uuid: "bcd", text: "Clean the house", completed: true })
        ),
      })

      const todo = store.root.todos.fetch("abc")

      expect(todo.path).toBe("/todos/abc")
    })
  })
})