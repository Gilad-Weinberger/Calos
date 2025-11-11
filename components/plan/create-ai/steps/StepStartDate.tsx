import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepStartDate: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = formData.startDate || today;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const handleQuickSelect = (days: number) => {
    const newDate = addDays(today, days);
    updateField("startDate", newDate);
    setShowPicker(false);
  };

  const upcomingDates = Array.from({ length: 21 }, (_, index) =>
    addDays(today, index)
  );

  const isSameDay = (dateA: Date, dateB: Date) =>
    dateA.toDateString() === dateB.toDateString();

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        When do you want to start?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Choose your plan start date
      </Text>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <Text className="text-2xl font-bold text-gray-900 text-center">
          {formatDate(selectedDate)}
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Tap to change
        </Text>
      </TouchableOpacity>

      {/* Quick Select Buttons */}
      <View className="flex-row gap-2 mt-4">
        <TouchableOpacity
          onPress={() => handleQuickSelect(0)}
          className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200"
        >
          <Text className="text-center text-sm font-semibold text-blue-600">
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickSelect(1)}
          className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200"
        >
          <Text className="text-center text-sm font-semibold text-blue-600">
            Tomorrow
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickSelect(7)}
          className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200"
        >
          <Text className="text-center text-sm font-semibold text-blue-600">
            Next Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Select Start Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Quick options */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Quick Select
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((days) => {
                    const optionDate = addDays(today, days);
                    const isSelected =
                      selectedDate.toDateString() === optionDate.toDateString();
                    return (
                      <TouchableOpacity
                        key={days}
                        onPress={() => {
                          updateField("startDate", new Date(optionDate));
                          setShowPicker(false);
                        }}
                        className={`px-4 py-2 rounded-lg border ${
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {days === 0
                            ? "Today"
                            : days === 1
                              ? "Tomorrow"
                              : days === 7
                                ? "Next Week"
                                : `${days} days`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Upcoming calendar */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Upcoming Dates
                </Text>
                <View className="border border-gray-200 rounded-xl overflow-hidden">
                  {upcomingDates.map((date, index) => {
                    const selected = isSameDay(date, selectedDate);
                    return (
                      <TouchableOpacity
                        key={date.toISOString()}
                        onPress={() => {
                          updateField("startDate", new Date(date));
                          setShowPicker(false);
                        }}
                        className={`px-4 py-3 border-b border-gray-100 ${
                          selected ? "bg-blue-50" : "bg-white"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selected ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Manual date input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Or enter date (MM/DD/YYYY)
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-900"
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#9CA3AF"
                  value={selectedDate.toLocaleDateString("en-US")}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime()) && date >= today) {
                      updateField("startDate", new Date(date));
                    }
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StepStartDate;
