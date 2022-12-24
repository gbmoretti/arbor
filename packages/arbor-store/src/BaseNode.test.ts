import Arbor from "./Arbor"
import BaseNode from "./BaseNode"
import Repository from "./Repository"
import { ArborError, NotAnArborNodeError } from "./errors"

describe("BaseNode", () => {
  class Todo extends BaseNode<Todo> {
    uuid!: string
    text!: string
    completed: boolean
  }

  describe("#detach", () => {
    it("allows detaching a node from the state tree", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const todo1 = store.root.abc

      todo1.detach()

      expect(store.root.abc).toBeUndefined()
      expect(todo1.isAttached()).toBe(false)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.detach()).toThrowError(NotAnArborNodeError)
    })

    it("throws an error when trying to detach root node", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor(todo)

      expect(() => store.root.detach()).toThrowError(ArborError)
    })

    it("publishes mutation metadata to subscribers", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor({ todo })

      store.subscribe((event) => {
        expect(event.metadata.operation).toBe("delete")
        expect(event.metadata.props).toEqual(["todo"])
      })

      store.root.todo.detach()
    })
  })

  describe("#parent", () => {
    it("allows accessing a parent node in the state tree", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const todo = store.root.abc

      const todos = todo.parent()

      expect(todos).toBe(store.root)
    })

    it("returns undefined if parent node does not exist", () => {
      const store = new Arbor(
        Todo.from<Todo>({
          uuid: "abc",
          text: "Do the dishes",
          completed: false,
        })
      )

      const parent = store.root.parent()

      expect(parent).toBe(undefined)
    })
  })

  describe("#attach", () => {
    it("allows attaching nodes back into the state tree", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const todo1 = store.root.abc

      delete store.root.abc

      expect(store.root.abc).toBeUndefined()
      expect(todo1.isAttached()).toBe(false)

      todo1.attach()

      expect(todo1.isAttached()).toBe(true)
      expect(store.root.abc).toEqual(todo1)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.attach()).toThrowError(NotAnArborNodeError)
    })

    it("publishes mutation metadata to subscribers", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor({ todo })

      const node = store.root.todo
      node.detach()

      store.subscribe((event) => {
        expect(event.metadata.operation).toBe("set")
        expect(event.metadata.props).toEqual(["todo"])
      })

      node.attach()
    })
  })

  describe("#merge", () => {
    it("allows merging attributes to the node", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const root = store.root
      const todo1 = store.root.abc
      const todo2 = store.root.bcd

      todo1.merge({ text: "Walk the dogs" })

      expect(store.root).not.toBe(root)
      expect(store.root.bcd).toBe(todo2)
      expect(store.root.abc).not.toBe(todo1)
      expect(store.root.abc).toEqual(
        Todo.from<Todo>({
          uuid: "abc",
          text: "Walk the dogs",
          completed: false,
        })
      )
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.merge({})).toThrowError(NotAnArborNodeError)
    })

    it("publishes mutation metadata to subscribers", () => {
      const todo = Todo.from<Todo>({
        uuid: "abc",
        text: "Do the dishes",
        completed: false,
      })

      const store = new Arbor({
        todoId: todo,
      })

      store.subscribe((event) => {
        expect(event.metadata.operation).toBe("merge")
        expect(event.metadata.props).toEqual(["text", "completed"])
      })

      store.root.todoId.merge({
        text: "New Todo",
        completed: true,
      })
    })
  })

  describe("#reload", () => {
    it("allows reloading stale nodes", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const todo = store.root.abc

      expect(todo.isStale()).toBe(false)

      todo.merge({ text: "Walk the dogs" })

      expect(todo.isStale()).toBe(true)

      const reloaded = todo.reload()

      expect(todo).not.toBe(store.root.abc)
      expect(reloaded).toBe(store.root.abc)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.reload()).toThrowError(NotAnArborNodeError)
    })
  })

  describe("#isAttached", () => {
    it("checks whether or not a node belongs to the state tree", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const todo = store.root.abc

      expect(todo.isAttached()).toBe(true)
      delete store.root.abc
      expect(todo.isAttached()).toBe(false)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.isAttached()).toThrowError(NotAnArborNodeError)
    })
  })

  describe("#isStale", () => {
    it("checks whether or not a node is out dated", () => {
      const store = new Arbor(
        new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        )
      )

      const todo = store.root.abc

      expect(todo.isStale()).toBe(false)
      todo.text = "Walk the dogs"
      expect(todo.isStale()).toBe(true)
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.isStale()).toThrowError(NotAnArborNodeError)
    })
  })

  describe("#path", () => {
    it("retrieves the node path within the state tree", () => {
      const store = new Arbor({
        todos: new Repository(
          Todo.from<Todo>({
            uuid: "abc",
            text: "Do the dishes",
            completed: false,
          }),
          Todo.from<Todo>({
            uuid: "bcd",
            text: "Clean the house",
            completed: true,
          })
        ),
      })

      const todo = store.root.todos.abc

      expect(todo.path).toBe("/todos/abc")
    })

    it("throws an error when used on an instance not bound to an Arbor store", () => {
      const todo = new Todo()

      expect(() => todo.path).toThrowError(NotAnArborNodeError)
    })
  })
})
