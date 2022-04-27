import classnames from "classnames"
import { useArborNode } from "@arborjs/react"
import React, { memo, useState } from "react"

import { store } from "../store/useTodos"

export interface TodoProps {
  id: string
}

export default memo(function TodoView({ id }: TodoProps) {
  const [editing, setEditing] = useState(false)
  const todo = useArborNode(store.root.fetch(id)!)

  return (
    <div className={classnames("todo-view", { completed: todo.completed })}>
      <input
        id={todo.id}
        type="checkbox"
        checked={todo.completed}
        onChange={todo.toggle}
      />
      {editing && (
        <input
          autoFocus
          type="text"
          value={todo.text}
          onBlur={() => setEditing(false)}
          onChange={(e) => (todo.text = e.target.value)}
        />
      )}
      {!editing && <label htmlFor={todo.id}>{todo.text}</label>}
      <button
        className="edit-btn"
        type="button"
        onClick={() => setEditing(!editing)}
      >
        ✏️
      </button>
      <button type="button" onClick={todo.detach}>
        ❌
      </button>
    </div>
  )
})
