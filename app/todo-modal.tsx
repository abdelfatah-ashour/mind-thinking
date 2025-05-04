import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Todo } from "@/hooks/use-todos";
import { useTodos } from "@/hooks/use-todos";

export default function TodoModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ todoId?: string }>();
  const { addTodo, getTodoById, updateTodo } = useTodos();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const isEditing = !!params.todoId;
  const todoToEdit = isEditing ? getTodoById(params.todoId!) : null;

  useEffect(() => {
    if (isEditing && todoToEdit) {
      setTitle(todoToEdit.title);
      setDescription(todoToEdit.description || "");
      setDueDate(todoToEdit.dueDate || new Date());
      setDueTime(todoToEdit.dueTime || new Date());
    }
  }, [isEditing, todoToEdit]);

  const handleSave = async () => {
    const todoData: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">> = {
      title,
      description,
      dueDate,
      dueTime,
      completed: todoToEdit?.completed ?? false,
      priority: todoToEdit?.priority ?? "medium",
      status: todoToEdit?.status ?? "pending",
      type: todoToEdit?.type ?? "task",
      category: todoToEdit?.category ?? "other",
      tags: todoToEdit?.tags ?? [],
      location: todoToEdit?.location ?? "",
    };

    try {
      if (isEditing && params.todoId) {
        await updateTodo(params.todoId, todoData);
      } else {
        await addTodo(todoData as Omit<Todo, "id" | "createdAt" | "updatedAt">);
      }
      router.back();
    } catch (error) {
      console.error("Failed to save todo:", error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === "ios");
    setDueDate(currentDate);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || dueTime;
    setShowTimePicker(Platform.OS === "ios");
    setDueTime(currentTime);
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white dark:bg-neutral-800">
      <Text className="text-xl font-bold mb-4 dark:text-white">
        {isEditing ? "Edit Todo" : "Add New Todo"}
      </Text>

      <Text className="mb-1 dark:text-gray-300">Title</Text>
      <TextInput
        className="border border-gray-300 p-2 rounded mb-4 dark:border-gray-600 dark:text-white"
        value={title}
        onChangeText={setTitle}
        placeholder="Enter todo title"
        placeholderTextColor="#9CA3AF"
      />

      <Text className="mb-1 dark:text-gray-300">Description</Text>
      <TextInput
        className="border border-gray-300 p-2 rounded mb-4 h-24 dark:border-gray-600 dark:text-white"
        value={description}
        onChangeText={setDescription}
        placeholder="Enter todo description (optional)"
        placeholderTextColor="#9CA3AF"
        multiline
      />

      <Text className="mb-1 dark:text-gray-300">Due Date</Text>
      <Button onPress={() => setShowDatePicker(true)} title="Select Date" />
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={dueDate}
          mode={"date"}
          display="default"
          onChange={onDateChange}
        />
      )}
      <Text className="mt-1 mb-4 dark:text-white">
        Selected: {dueDate.toLocaleDateString()}
      </Text>

      <Text className="mb-1 dark:text-gray-300">Due Time</Text>
      <Button onPress={() => setShowTimePicker(true)} title="Select Time" />
      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
          value={dueTime}
          mode={"time"}
          display="default"
          onChange={onTimeChange}
        />
      )}
      <Text className="mt-1 mb-4 dark:text-white">
        Selected: {dueTime.toLocaleTimeString()}
      </Text>

      <Button
        title={isEditing ? "Update Todo" : "Add Todo"}
        onPress={handleSave}
      />

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}
