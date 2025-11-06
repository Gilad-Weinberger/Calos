import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface WorkoutManualDurationInputModalProps {
  visible: boolean;
  onSubmit: () => void;
  currentExercise: {
    exercise_name: string;
    duration?: number;
  };
  currentSetIndex: number;
  totalSets: number;
  manualDurationInput: string;
  onInputChange: (value: string) => void;
}

const WorkoutManualDurationInputModal: React.FC<
  WorkoutManualDurationInputModalProps
> = ({
  visible,
  onSubmit,
  currentExercise,
  currentSetIndex,
  totalSets,
  manualDurationInput,
  onInputChange,
}) => {
  const handleSubmit = () => {
    const duration = parseInt(manualDurationInput);

    if (isNaN(duration) || duration <= 0) {
      Alert.alert(
        "Invalid Duration",
        "Please enter a valid duration greater than 0 seconds"
      );
      return;
    }

    onSubmit();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/50">
        <View className="flex-1 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <View className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 text-center">
                Manual Duration Entry
              </Text>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* Exercise Info */}
              <View className="mb-6">
                <Text className="text-base font-medium text-gray-800 mb-1">
                  {currentExercise.exercise_name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Set {currentSetIndex + 1} of {totalSets}
                </Text>
                {currentExercise.duration && (
                  <Text className="text-sm text-gray-500 mt-1">
                    Target: {currentExercise.duration} seconds
                  </Text>
                )}
              </View>

              {/* Duration Input */}
              <View className="mb-6">
                <Text className="text-base text-gray-700 mb-3">
                  How long did you hold for?
                </Text>
                <View className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <TextInput
                    value={manualDurationInput}
                    onChangeText={onInputChange}
                    keyboardType="numeric"
                    placeholder="0"
                    className="text-4xl font-bold text-center text-gray-900"
                    maxLength={3}
                    autoFocus
                  />
                  <Text className="text-center text-gray-600 mt-2">
                    seconds
                  </Text>
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-green-600 rounded-lg py-3"
              >
                <Text className="text-center font-medium text-white text-lg">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default WorkoutManualDurationInputModal;
