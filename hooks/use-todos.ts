import { create } from "zustand";
import * as SQLite from "expo-sqlite";
import { useEffect } from "react";
import { GenerateRandomId } from "@/utils/generate-random-id";

export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "completed" | "pending";
export type TodoType = "task" | "event" | "reminder";
export type TodoCategory = "work" | "personal" | "shopping" | "other";

export type Todo = {
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  priority: TodoPriority;
  status: TodoStatus;
  type: TodoType;
  category: TodoCategory;
  dueDate: Date;
  dueTime: Date;
  tags: string[];
  location: string;
};

// Helper to deserialize a DB row into a Todo object
const deserializeTodo = (row: any): Todo => ({
  ...row,
  completed: !!row.completed, // Convert 0/1 back to boolean
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
  // Handle potential null values from DB for dates
  dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
  dueTime: row.dueTime ? new Date(row.dueTime) : undefined,
  tags: JSON.parse(row.tags || "[]"), // Parse JSON string back to array
});

const serializeTodoForDB = (todo: Partial<Todo>) => ({
  id: todo.id ?? GenerateRandomId.generate(), // Use existing ID if available
  title: todo.title ?? "",
  description: todo.description ?? "null",
  completed: todo.completed ? 1 : 0,
  createdAt: todo.createdAt?.toISOString() ?? new Date().toString(),
  updatedAt: todo.updatedAt?.toISOString() ?? new Date().toString(),
  priority: todo.priority ?? "low",
  status: todo.status ?? "pending",
  type: todo.type ?? "task",
  category: todo.category ?? "other",
  dueDate: todo.dueDate?.toISOString() ?? new Date().toString(),
  dueTime: todo.dueTime?.toISOString() ?? new Date().toString(),
  tags: JSON.stringify(todo.tags || []),
  location: todo.location ?? "",
});

interface TodoCtx {
  todos: Todo[];
  addTodo: (
    todo: Omit<Todo, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  clearTodos: () => Promise<void>;
  setTodos: (todos: Todo[]) => void;
  getTodos: () => Todo[];
  updateTodo: (
    id: string,
    updatedTodo: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  getTodoById: (id: string) => Todo | null;
  getTodosByStatus: (status: TodoStatus) => Todo[];
  getTodosByPriority: (priority: TodoPriority) => Todo[];
  getTodosByCategory: (category: TodoCategory) => Todo[];
  getTodosByType: (type: TodoType) => Todo[];
  getTodosByTag: (tag: string) => Todo[];
  getTodosByDate: (date: Date) => Todo[];
  getTodosByLocation: (location: string) => Todo[];
  getTodosByTime: (time: Date) => Todo[];
  getTodosByDateRange: (startDate: Date, endDate: Date) => Todo[];
  getTodosByTimeRange: (startTime: Date, endTime: Date) => Todo[];
  getTodosByDateAndTime: (date: Date, time: Date) => Todo[];
  _dbInitialized: boolean;
  _initDB: () => Promise<void>;
}

const db = SQLite.openDatabaseSync("todos.db");

export const useTodos = create<TodoCtx>((set, get) => ({
  todos: [],
  _dbInitialized: false,

  _initDB: async () => {
    if (get()._dbInitialized) return;
    if (get()._dbInitialized) {
      console.log("Database already initialized.");
      return;
    }
    try {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          completed INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          priority TEXT,
          status TEXT,
          type TEXT,
          category TEXT,
          dueDate TEXT,
          dueTime TEXT,
          tags TEXT,
          location TEXT
        );
      `);
      console.log("Table check/creation successful.");

      const allRows = await db.getAllAsync<any>(
        "SELECT * FROM todos ORDER BY createdAt ASC"
      );
      const loadedTodos = allRows.map(deserializeTodo);
      set({ todos: loadedTodos, _dbInitialized: true });
      console.log(
        `✅ Database Initialized. Loaded ${loadedTodos.length} todos.`
      );
    } catch (error) {
      console.error("❌ Error initializing database:", error);
      set({ _dbInitialized: false });
    }
  },

  addTodo: async (newTodoData) => {
    if (!get()._dbInitialized) {
      await get()._initDB();
      if (!get()._dbInitialized) {
        return;
      }
    } else {
      console.log("DB was already initialized.");
    }

    const now = new Date();

    let newTodo: Todo;
    try {
      newTodo = {
        ...newTodoData,
        id: Math.random().toString(36),
        createdAt: now,
        updatedAt: now,
        completed: newTodoData.completed ?? false,
        description: newTodoData.description ?? "",
        priority: newTodoData.priority ?? "medium",
        status: newTodoData.status ?? "pending",
        type: newTodoData.type ?? "task",
        category: newTodoData.category ?? "other",
        dueDate: newTodoData.dueDate,
        dueTime: newTodoData.dueTime,
        tags: newTodoData.tags ?? [],
        location: newTodoData.location ?? "",
      };
      console.log("Created newTodo object:", newTodo);
    } catch (error) {
      console.error("❌ Error creating newTodo object:", error);
      return;
    }

    let serialized;
    try {
      serialized = serializeTodoForDB(newTodo);
    } catch (error) {
      console.log("🚀 ~ addTodo: ~ error:", error);
      return;
    }

    try {
      const result = await db.runAsync(
        `INSERT INTO todos (id, title, description, completed, createdAt, updatedAt, priority, status, type, category, dueDate, dueTime, tags, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serialized.id,
          serialized.title,
          serialized.description,
          serialized.completed,
          serialized.createdAt,
          serialized.updatedAt,
          serialized.priority,
          serialized.status,
          serialized.type,
          serialized.category,
          serialized.dueDate,
          serialized.dueTime,
          serialized.tags,
          serialized.location,
        ]
      );

      console.log("✅ DB Insert Result:", result);

      set((state) => {
        const updatedTodos = [...state.todos, newTodo];
        return { todos: updatedTodos };
      });

      console.log("✅ Todo added successfully to state and DB:", newTodo.id);
    } catch (error) {
      console.error("❌ Error during DB insertion or state update:", error);
    }
  },

  removeTodo: async (id) => {
    if (!get()._dbInitialized) return;
    try {
      await db.runAsync("DELETE FROM todos WHERE id = ?", [id]);
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }));
      console.log("Todo removed:", id);
    } catch (error) {
      console.error("Error removing todo from DB:", error);
    }
  },

  clearTodos: async () => {
    if (!get()._dbInitialized) return;
    try {
      await db.runAsync("DELETE FROM todos");
      set({ todos: [] });
      console.log("All todos cleared.");
    } catch (error) {
      console.error("Error clearing todos from DB:", error);
    }
  },

  setTodos: (todos: Todo[]) => {
    console.warn(
      "Directly setting todos; DB synchronization not implemented for this action."
    );
    set({ todos });
  },

  getTodos: () => get().todos,

  updateTodo: async (id, updatedFields) => {
    if (!get()._dbInitialized) return;

    const existingTodo = get().todos.find((todo) => todo.id === id);
    if (!existingTodo) {
      console.error("Todo not found for update:", id);
      return;
    }

    const now = new Date();
    const updatedTodoData: Todo = {
      ...existingTodo,
      ...updatedFields,
      id: id, // Explicitly keep the original ID
      updatedAt: now,
    };

    const serialized = serializeTodoForDB(updatedTodoData);

    const fieldsToUpdate = Object.keys(updatedFields).filter(
      (key) => key !== "id" && key !== "createdAt"
    );

    const setClauseParts = fieldsToUpdate.map((key) => `${key} = ?`);
    setClauseParts.push("updatedAt = ?");

    const values = fieldsToUpdate.map(
      (key) => (serialized as any)[key] ?? null
    );
    values.push(serialized.updatedAt);
    values.push(id);

    if (setClauseParts.length === 1 && setClauseParts[0] === "updatedAt = ?") {
      try {
        await db.runAsync(`UPDATE todos SET updatedAt = ? WHERE id = ?`, [
          serialized.updatedAt,
          id,
        ]);
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? updatedTodoData : todo
          ),
        }));
        console.log("Todo updatedAt timestamp updated:", id);
      } catch (error) {
        console.error("Error updating todo timestamp in DB:", error);
      }
      return;
    }

    const setClause = setClauseParts.join(", ");

    try {
      await db.runAsync(`UPDATE todos SET ${setClause} WHERE id = ?`, values);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? updatedTodoData : todo
        ),
      }));
      console.log("Todo updated:", id);
    } catch (error) {
      console.error("Error updating todo in DB:", error);
    }
  },

  getTodoById: (id: string) =>
    get().todos.find((todo) => todo.id === id) || null,
  getTodosByStatus: (status: TodoStatus) =>
    get().todos.filter((todo) => todo.status === status),
  getTodosByPriority: (priority: TodoPriority) =>
    get().todos.filter((todo) => todo.priority === priority),
  getTodosByCategory: (category: TodoCategory) =>
    get().todos.filter((todo) => todo.category === category),
  getTodosByType: (type: TodoType) =>
    get().todos.filter((todo) => todo.type === type),
  getTodosByTag: (tag: string) =>
    get().todos.filter((todo) => todo.tags.includes(tag)),
  getTodosByDate: (date: Date) => {
    const dateString = date.toDateString();
    return get().todos.filter(
      (todo) => todo.dueDate?.toDateString() === dateString
    );
  },
  getTodosByLocation: (location: string) =>
    get().todos.filter((todo) => todo.location === location),
  getTodosByTime: (time: Date) => {
    const timeString = time.toTimeString();
    return get().todos.filter(
      (todo) => todo.dueTime?.toTimeString() === timeString
    );
  },
  getTodosByDateRange: (startDate: Date, endDate: Date) =>
    get().todos.filter(
      (todo) =>
        todo.dueDate && todo.dueDate >= startDate && todo.dueDate <= endDate
    ),
  getTodosByTimeRange: (startTime: Date, endTime: Date) =>
    get().todos.filter(
      (todo) =>
        todo.dueTime && todo.dueTime >= startTime && todo.dueTime <= endTime
    ),
  getTodosByDateAndTime: (date: Date, time: Date) => {
    const dateString = date.toDateString();
    const timeString = time.toTimeString();
    return get().todos.filter(
      (todo) =>
        todo.dueDate?.toDateString() === dateString &&
        todo.dueTime?.toTimeString() === timeString
    );
  },
}));

export const useInitializeTodosDB = () => {
  const initDB = useTodos((state) => state._initDB);
  const dbInitialized = useTodos((state) => state._dbInitialized);

  useEffect(() => {
    if (!dbInitialized) {
      initDB();
    }
  }, [initDB, dbInitialized]);
};
