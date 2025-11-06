import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Exercise,
  getAllExercises,
} from "../../../lib/functions/workoutFunctions";

interface ExerciseSelectorProps {
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExerciseIds: string[];
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onExerciseSelect,
  selectedExerciseIds,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const data = await getAllExercises();
      setExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExercises = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredExercises(exercises);
      return;
    }

    const filtered = exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [searchQuery, exercises]);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [filterExercises]);

  const handleExerciseSelect = (exercise: Exercise) => {
    onExerciseSelect(exercise);
    setIsModalVisible(false);
    setSearchQuery("");
  };

  const isExerciseSelected = (exerciseId: string) => {
    return selectedExerciseIds.includes(exerciseId);
  };

  const getAvailableExercises = () => {
    return filteredExercises.filter(
      (exercise) => !isExerciseSelected(exercise.exercise_id)
    );
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      onPress={() => handleExerciseSelect(item)}
      className="flex-1 m-1 p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50"
      disabled={isExerciseSelected(item.exercise_id)}
      style={{ opacity: isExerciseSelected(item.exercise_id) ? 0.5 : 1 }}
    >
      <View className="items-center">
        <Text className="text-sm font-medium text-gray-900 text-center mb-2">
          {item.name}
        </Text>
        <Text
          className="text-xs text-gray-500 text-center mb-2"
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View
          className={`px-2 py-1 rounded-full ${
            item.type === "static" ? "bg-blue-100" : "bg-green-100"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              item.type === "static" ? "text-blue-800" : "text-green-800"
            }`}
          >
            {item.type === "static" ? "Time" : "Reps"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        className="bg-white border border-gray-300 rounded-lg p-4 flex-row items-center justify-between"
      >
        <Text className="text-gray-500">Select an exercise...</Text>
        <Text className="text-gray-400">▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Select Exercise
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="p-2"
            >
              <Text className="text-blue-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="p-4 border-b border-gray-200">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              className="bg-gray-100 rounded-lg px-4 py-3 text-base"
              autoFocus
            />
          </View>

          {/* Exercise Grid */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">Loading exercises...</Text>
            </View>
          ) : (
            <FlatList
              data={getAvailableExercises()}
              keyExtractor={(item) => item.exercise_id}
              renderItem={renderExerciseItem}
              numColumns={2}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 8 }}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center p-8">
                  <Text className="text-gray-500 text-center">
                    {searchQuery
                      ? "No exercises found matching your search"
                      : "No exercises available"}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default ExerciseSelector;

