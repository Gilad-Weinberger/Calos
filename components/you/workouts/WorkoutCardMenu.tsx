import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

interface WorkoutCardMenuProps {
  visible: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WorkoutCardMenu: React.FC<WorkoutCardMenuProps> = ({
  visible,
  isDeleting,
  onClose,
  onEdit,
  onDelete,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-64 overflow-hidden">
            <TouchableOpacity
              onPress={onEdit}
              className="flex-row items-center p-4 border-b border-gray-200"
            >
              <Ionicons name="create-outline" size={24} color="#3B82F6" />
              <Text className="text-base font-medium text-gray-900 ml-3">
                Edit Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              className="flex-row items-center p-4"
              disabled={isDeleting}
              style={{ opacity: isDeleting ? 0.5 : 1 }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text className="text-base font-medium text-red-600 ml-3">
                {isDeleting ? "Deleting..." : "Delete Workout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default WorkoutCardMenu;

