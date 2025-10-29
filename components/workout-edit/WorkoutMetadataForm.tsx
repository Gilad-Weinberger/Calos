import React from "react";
import { TextInput, View } from "react-native";

interface WorkoutMetadataFormProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

const WorkoutMetadataForm: React.FC<WorkoutMetadataFormProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => {
  return (
    <View className="gap-y-4">
      {/* Title Input */}
      <View>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={title}
          onChangeText={onTitleChange}
          placeholder="Enter workout title"
          maxLength={100}
        />
      </View>

      {/* Description Input */}
      <View>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-20"
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Add notes about your workout..."
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
      </View>
    </View>
  );
};

export default WorkoutMetadataForm;
