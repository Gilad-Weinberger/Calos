import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepStartDate: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();
  const [isIOSPickerVisible, setIsIOSPickerVisible] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState<Date | null>(null);

  const today = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

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
  };

  const openDatePicker = () => {
    const baseDate = formData.startDate || today;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        minimumDate: today,
        onChange: (_event: DateTimePickerEvent, date?: Date) => {
          if (date) {
            const normalized = new Date(date);
            normalized.setHours(0, 0, 0, 0);
            updateField("startDate", normalized);
          }
        },
      });
      return;
    }

    setIosDraftDate(baseDate);
    setIsIOSPickerVisible(true);
  };

  const handleIOSDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      setIosDraftDate(normalized);
    }
  };

  const confirmIOSDate = () => {
    if (iosDraftDate) {
      updateField("startDate", iosDraftDate);
    }
    setIsIOSPickerVisible(false);
  };

  const cancelIOSPicker = () => {
    setIsIOSPickerVisible(false);
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        When do you want to start?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Choose your plan start date
      </Text>

      <TouchableOpacity
        onPress={openDatePicker}
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

      {Platform.OS === "ios" && (
        <Modal
          visible={isIOSPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={cancelIOSPicker}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={cancelIOSPicker}>
                  <Text className="text-blue-600 font-semibold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-gray-900">
                  Select start date
                </Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text className="text-blue-600 font-semibold text-lg">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={iosDraftDate || selectedDate}
                minimumDate={today}
                onChange={handleIOSDateChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default StepStartDate;
