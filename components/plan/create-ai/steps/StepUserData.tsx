import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  calculateAgeFromDate,
  shiftYearsFromToday,
} from "../../../../lib/utils/date-helpers";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const CM_HEIGHT_MIN = 120;
const CM_HEIGHT_MAX = 230;
const KG_WEIGHT_MIN = 35;
const KG_WEIGHT_MAX = 180;
const LBS_WEIGHT_MIN = 77;
const LBS_WEIGHT_MAX = 396;

const convertHeightValue = (
  value: number,
  from: "cm" | "ft",
  to: "cm" | "ft"
): number => {
  if (from === to) return value;
  if (from === "cm" && to === "ft") {
    return parseFloat((value / 30.48).toFixed(2));
  }
  if (from === "ft" && to === "cm") {
    return Math.round(value * 30.48);
  }
  return value;
};

const convertWeightValue = (
  value: number,
  from: "kg" | "lbs",
  to: "kg" | "lbs"
): number => {
  if (from === to) return value;
  if (from === "kg" && to === "lbs") {
    return parseFloat((value * 2.20462).toFixed(1));
  }
  if (from === "lbs" && to === "kg") {
    return parseFloat((value / 2.20462).toFixed(1));
  }
  return value;
};

const StepUserData: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();
  const [isBirthDatePickerVisible, setIsBirthDatePickerVisible] =
    useState(false);
  const [iosBirthDateDraft, setIosBirthDateDraft] = useState<Date>(
    formData.birthDate ?? shiftYearsFromToday(-18)
  );
  const [heightInputValue, setHeightInputValue] = useState<string>("");
  const [weightInputValue, setWeightInputValue] = useState<string>("");

  const maximumBirthDate = useMemo(() => shiftYearsFromToday(-18), []);
  const minimumBirthDate = useMemo(() => shiftYearsFromToday(-100), []);

  // Bug Fix 1: Synchronize input values with formData
  useEffect(() => {
    if (formData.height !== null) {
      const displayValue =
        formData.heightUnit === "cm"
          ? Math.round(formData.height).toString()
          : formData.height.toFixed(2);
      setHeightInputValue(displayValue);
    } else {
      setHeightInputValue("");
    }
  }, [formData.height, formData.heightUnit]);

  useEffect(() => {
    if (formData.weight !== null) {
      setWeightInputValue(formData.weight.toFixed(1));
    } else {
      setWeightInputValue("");
    }
  }, [formData.weight]);

  const birthDateLabel = useMemo(() => {
    if (!formData.birthDate) {
      return "Select your birth date";
    }

    const formattedDate = format(formData.birthDate, "MMMM d, yyyy");
    const age = calculateAgeFromDate(formData.birthDate);

    return `${formattedDate} • ${age} yrs`;
  }, [formData.birthDate]);

  const openBirthDatePicker = () => {
    const initialDate = formData.birthDate ?? maximumBirthDate;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        maximumDate: maximumBirthDate,
        minimumDate: minimumBirthDate,
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) {
            updateField("birthDate", selectedDate);
          }
        },
      });
      return;
    }

    setIosBirthDateDraft(initialDate);
    setIsBirthDatePickerVisible(true);
  };

  const handleIOSBirthDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (selectedDate) {
      setIosBirthDateDraft(selectedDate);
    }
  };

  const confirmIOSBirthDate = () => {
    updateField("birthDate", iosBirthDateDraft);
    setIsBirthDatePickerVisible(false);
  };

  const cancelIOSBirthDate = () => {
    setIsBirthDatePickerVisible(false);
  };

  const handleHeightUnitChange = (unit: "cm" | "ft") => {
    if (unit === formData.heightUnit) return;

    let convertedHeight: number | null = null;

    if (formData.height !== null) {
      convertedHeight = convertHeightValue(
        formData.height,
        formData.heightUnit,
        unit
      );
    }

    updateField("heightUnit", unit);
    if (convertedHeight !== null) {
      updateField("height", convertedHeight);
      setHeightInputValue(convertedHeight.toString());
    } else {
      setHeightInputValue("");
    }
  };

  const handleWeightUnitChange = (unit: "kg" | "lbs") => {
    if (unit === formData.weightUnit) return;

    let convertedWeight: number | null = null;

    if (formData.weight !== null) {
      convertedWeight = convertWeightValue(
        formData.weight,
        formData.weightUnit,
        unit
      );
    }

    updateField("weightUnit", unit);
    if (convertedWeight !== null) {
      updateField("weight", convertedWeight);
      setWeightInputValue(convertedWeight.toFixed(1));
    } else {
      setWeightInputValue("");
    }
  };

  const handleHeightInputChange = (text: string) => {
    // Bug Fix 2: Clean input before updating state
    // Allow only numbers and one decimal point
    let cleanedText = text.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const decimalCount = (cleanedText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDecimalIndex = cleanedText.indexOf(".");
      cleanedText =
        cleanedText.substring(0, firstDecimalIndex + 1) +
        cleanedText.substring(firstDecimalIndex + 1).replace(/\./g, "");
    }

    setHeightInputValue(cleanedText);

    if (cleanedText === "" || cleanedText === ".") {
      updateField("height", null);
      return;
    }

    const value = parseFloat(cleanedText);
    if (!isNaN(value)) {
      if (formData.heightUnit === "cm") {
        const rounded = Math.round(value);
        updateField("height", rounded);
      } else {
        updateField("height", parseFloat(value.toFixed(2)));
      }
    }
  };

  const handleWeightInputChange = (text: string) => {
    // Bug Fix 2: Clean input before updating state
    // Allow only numbers and one decimal point
    let cleanedText = text.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const decimalCount = (cleanedText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDecimalIndex = cleanedText.indexOf(".");
      cleanedText =
        cleanedText.substring(0, firstDecimalIndex + 1) +
        cleanedText.substring(firstDecimalIndex + 1).replace(/\./g, "");
    }

    setWeightInputValue(cleanedText);

    if (cleanedText === "" || cleanedText === ".") {
      updateField("weight", null);
      return;
    }

    const value = parseFloat(cleanedText);
    if (!isNaN(value)) {
      updateField("weight", parseFloat(value.toFixed(1)));
    }
  };

  const isHeightValid = useMemo(() => {
    if (formData.height === null) return true;

    if (formData.heightUnit === "cm") {
      return (
        formData.height >= CM_HEIGHT_MIN && formData.height <= CM_HEIGHT_MAX
      );
    } else {
      const heightInCm = formData.height * 30.48;
      return heightInCm >= CM_HEIGHT_MIN && heightInCm <= CM_HEIGHT_MAX;
    }
  }, [formData.height, formData.heightUnit]);

  const isWeightValid = useMemo(() => {
    if (formData.weight === null) return true;

    if (formData.weightUnit === "kg") {
      return (
        formData.weight >= KG_WEIGHT_MIN && formData.weight <= KG_WEIGHT_MAX
      );
    } else {
      return (
        formData.weight >= LBS_WEIGHT_MIN && formData.weight <= LBS_WEIGHT_MAX
      );
    }
  }, [formData.weight, formData.weightUnit]);

  const heightPlaceholder = useMemo(() => {
    if (formData.heightUnit === "cm") {
      return `${CM_HEIGHT_MIN}-${CM_HEIGHT_MAX} cm`;
    } else {
      const minFt = (CM_HEIGHT_MIN / 30.48).toFixed(1);
      const maxFt = (CM_HEIGHT_MAX / 30.48).toFixed(1);
      return `${minFt}-${maxFt} ft`;
    }
  }, [formData.heightUnit]);

  const weightPlaceholder = useMemo(() => {
    if (formData.weightUnit === "kg") {
      return `${KG_WEIGHT_MIN}-${KG_WEIGHT_MAX} kg`;
    } else {
      return `${LBS_WEIGHT_MIN}-${LBS_WEIGHT_MAX} lbs`;
    }
  }, [formData.weightUnit]);

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Tell us about yourself
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        This helps us create a personalized plan for you
      </Text>

      {/* Birth Date Input */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Birth date
        </Text>
        <TouchableOpacity
          className="bg-white rounded-lg p-4 border border-gray-200"
          onPress={openBirthDatePicker}
          activeOpacity={0.8}
        >
          <Text
            className={`text-lg ${
              formData.birthDate ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {birthDateLabel}
          </Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-500 mt-2">
          We use your age to tailor rest times, progressions, and recommended
          volume.
        </Text>
      </View>

      {/* Height Input with Unit Toggle */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Height</Text>
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            onPress={() => handleHeightUnitChange("cm")}
            className={`flex-1 py-3 rounded-lg ${
              formData.heightUnit === "cm" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.heightUnit === "cm" ? "text-white" : "text-gray-700"
              }`}
            >
              cm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleHeightUnitChange("ft")}
            className={`flex-1 py-3 rounded-lg ${
              formData.heightUnit === "ft" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.heightUnit === "ft" ? "text-white" : "text-gray-700"
              }`}
            >
              ft
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className={`bg-white rounded-lg px-4 py-4 border text-lg ${
            !isHeightValid
              ? "border-red-500 text-red-900"
              : "border-gray-200 text-gray-900"
          }`}
          placeholder={heightPlaceholder}
          placeholderTextColor="#9ca3af"
          value={heightInputValue}
          onChangeText={handleHeightInputChange}
          keyboardType="decimal-pad"
        />
        {!isHeightValid && (
          <Text className="text-xs text-red-600 mt-1">
            Please enter a height between {heightPlaceholder}
          </Text>
        )}
        {isHeightValid && (
          <Text className="text-xs text-gray-500 mt-2">
            Enter your height to personalize your plan.
          </Text>
        )}
      </View>

      {/* Weight Input with Unit Toggle */}
      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Weight</Text>
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            onPress={() => handleWeightUnitChange("kg")}
            className={`flex-1 py-3 rounded-lg ${
              formData.weightUnit === "kg" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.weightUnit === "kg" ? "text-white" : "text-gray-700"
              }`}
            >
              kg
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleWeightUnitChange("lbs")}
            className={`flex-1 py-3 rounded-lg ${
              formData.weightUnit === "lbs" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.weightUnit === "lbs" ? "text-white" : "text-gray-700"
              }`}
            >
              lbs
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className={`bg-white rounded-lg px-4 py-4 border text-lg ${
            !isWeightValid
              ? "border-red-500 text-red-900"
              : "border-gray-200 text-gray-900"
          }`}
          placeholder={weightPlaceholder}
          placeholderTextColor="#9ca3af"
          value={weightInputValue}
          onChangeText={handleWeightInputChange}
          keyboardType="decimal-pad"
        />
        {!isWeightValid && (
          <Text className="text-xs text-red-600 mt-1">
            Please enter a weight between {weightPlaceholder}
          </Text>
        )}
        {isWeightValid && (
          <Text className="text-xs text-gray-500 mt-2">
            We use this to balance volume and recovery.
          </Text>
        )}
      </View>

      {/* iOS Birth Date Picker Modal */}
      {Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="slide"
          visible={isBirthDatePickerVisible}
          onRequestClose={cancelIOSBirthDate}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={cancelIOSBirthDate}>
                  <Text className="text-blue-600 font-semibold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-gray-900">
                  Select birth date
                </Text>
                <TouchableOpacity onPress={confirmIOSBirthDate}>
                  <Text className="text-blue-600 font-semibold text-lg">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={iosBirthDateDraft}
                maximumDate={maximumBirthDate}
                minimumDate={minimumBirthDate}
                onChange={handleIOSBirthDateChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default StepUserData;
