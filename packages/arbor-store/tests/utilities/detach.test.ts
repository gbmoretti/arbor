import { describe, expect, it } from "vitest"
import { Arbor } from "../../src/arbor"
import {
  ArborError,
  NotAnArborNodeError,
  DetachedNodeError,
} from "../../src/errors"
import { ArborNode } from "../../src/types"
import { detach, unwrap } from "../../src/utilities"
import { proxiable } from "../../src/decorators"

describe("detach", () => {
  it("cannot detach the state tree's root node", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes" },
        { id: 2, text: "Walk the dogs" },
      ],
    })

    expect(() => detach(store.state)).toThrow(ArborError)
  })

  it("cannot detach values that are not already attached to the state tree", () => {
    expect(() => detach(123)).toThrow(NotAnArborNodeError)
    expect(() => detach("")).toThrow(NotAnArborNodeError)
    expect(() => detach({})).toThrow(NotAnArborNodeError)
  })

  it("cannot detach node already detached", () => {
    const store = new Arbor({
      todos: [
        { id: 1, text: "Do the dishes" },
        { id: 2, text: "Walk the dogs" },
      ],
    })

    const node = store.state.todos[0]
    detach(node)

    expect(() => detach(node)).toThrow(DetachedNodeError)
  })

  it("detaches a given ArborNode from the state tree", () => {
    const initialState = {
      todos: [
        { id: 1, text: "Do the dishes" },
        { id: 2, text: "Walk the dogs" },
      ],
    }

    const todo0 = initialState.todos[0]

    const store = new Arbor(initialState)

    const detched = detach(store.state.todos[0])

    expect(detched).toBe(todo0)
    expect(store.state).toEqual({
      todos: [{ id: 2, text: "Walk the dogs" }],
    })
  })

  it("detaches children from a Map node", () => {
    const todos = new Map<string, ArborNode<{ text: string }>>()
    todos.set("a", { text: "Do the dishes" })
    todos.set("b", { text: "Clean the house" })

    const store = new Arbor(todos)

    const todo = store.state.get("b")!
    const detachedTodo = detach(todo)

    expect(todos.get("b")).toBeUndefined()
    expect(store.state.get("b")).toBeUndefined()
    expect(detachedTodo).toBe(unwrap(todo))
  })

  it("dettaching on a complex data structure", () => {
    @proxiable
    class Todo {
      constructor(public id: number, public text: string) {}
    }

    @proxiable
    class Epic {
      constructor(
        public id: number,
        public name: string,
        public todos: Todo[]
      ) {}

      add({ id, text }: Todo) {
        this.todos.push(new Todo(id, text))
      }

      deleteTodoById(id: number) {
        const todo = this.todos.find((todo) => todo.id === id)
        if (todo) {
          return detach(todo)
        }
      }
    }

    @proxiable
    class Project {
      constructor(
        public id: number,
        public name: string,
        public epics: Epic[]
      ) {}
    }

    @proxiable
    class Namespace {
      constructor(public projects: Project[]) {}
    }

    const { state } = new Arbor(new Namespace([]))
    state.projects.push(new Project(1, "Project 1", []))

    const epic = new Epic(1, "Epic 1", [])
    state.projects[0].epics.push(epic)
    state.projects[0].epics.push(new Epic(2, "Epic 2", []))

    epic.add({ id: 1, text: "Walk the dog" })
    epic.add({ id: 2, text: "Do the dishes" })

    epic.deleteTodoById(2)

    expect(state.projects[0].epics.length).toBe(2)
    expect(epic.todos.length).toBe(1)
  })
})
