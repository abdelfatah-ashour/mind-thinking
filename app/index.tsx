import React from "react";
import {
  Pressable,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SwipeListView } from "react-native-swipe-list-view";
import { useTodos, Todo } from "@/hooks/use-todos";
import { DateFormatter } from "@/utils/formatting-date";

export default function Home() {
  const { todos, removeTodo } = useTodos();

  function handlePress() {
    router.push("/todo-modal");
  }

  const renderHiddenItem = (data: { item: Todo }) => (
    <View className="flex-row justify-between items-center h-full">
      <TouchableOpacity
        className="bg-gray-950 dark:bg-neutral-800 items-center justify-center w-28 h-full rounded-l-2xl"
        onPress={() => {
          router.push({
            pathname: "/todo-modal",
            params: { todoId: data.item.id },
          });
        }}
      >
        <Text className="text-neutral-900 dark:text-white">Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-red-500 items-center justify-center w-28 h-full rounded-r-2xl"
        onPress={() => {
          removeTodo(data.item.id);
        }}
      >
        <Text className="text-neutral-900 dark:text-white">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = (data: { item: Todo }) => (
    <View
      key={data.item.id}
      className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700"
    >
      <View className="flex-row justify-between items-start p-4 gap-2">
        <View className="flex-1 gap-2">
          <Text className="text-black dark:text-white">{data.item.title}</Text>
          <Text className="text-gray-500 dark:text-gray-400">
            {data.item.description}
          </Text>
        </View>
        <View className="flex-col items-end gap-2">
          <Text className="text-gray-500 dark:text-gray-400">
            {DateFormatter.formatDate(data.item.dueDate)}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">
            {DateFormatter.formatTime(data.item.dueTime)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <SwipeListView
        data={todos}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        keyExtractor={(item) => item.id.toString()}
        leftOpenValue={100}
        rightOpenValue={-100}
        disableLeftSwipe={false}
        disableRightSwipe={false}
        stopLeftSwipe={110}
        stopRightSwipe={-110}
        showsVerticalScrollIndicator={false}
        useNativeDriver={false}
      />

      <View className="absolute bottom-10 right-5">
        <Pressable
          className="bg-black dark:bg-white rounded-full w-16 h-16 items-center justify-center shadow-lg"
          onPress={handlePress}
        >
          <Text className="text-white dark:text-black text-2xl font-extrabold">
            +
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
