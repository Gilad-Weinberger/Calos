import React from "react";
import { Text, TextInput, View } from "react-native";

interface WorkoutTitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
}

const WorkoutTitleInput: React.FC<WorkoutTitleInputProps> = ({
  title,
  onTitleChange,
}) => {
  return (
    <View className="mb-6">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        Workout Title
      </Text>
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="Enter workout title..."
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
      />
    </View>
  );
};

export default WorkoutTitleInput;


