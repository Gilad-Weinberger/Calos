import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import {
  calculateAgeFromDate,
  shiftYearsFromToday,
} from "../../../../lib/utils/date-helpers";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";
import PickerWheelNumber, { type PickerOption } from "../PickerWheelNumber";

const CM_HEIGHT_MIN = 140;
const CM_HEIGHT_MAX = 210;
const KG_WEIGHT_MIN = 40;
const KG_WEIGHT_MAX = 160;
const LBS_WEIGHT_MIN = 90;
const LBS_WEIGHT_MAX = 350;

const createHeightOptions = (unit: "cm" | "ft"): PickerOption[] => {
  if (unit === "cm") {
    return Array.from(
      { length: CM_HEIGHT_MAX - CM_HEIGHT_MIN + 1 },
      (_, index) => {
        const value = CM_HEIGHT_MIN + index;
        return {
          label: `${value} cm`,
          value,
        };
      }
    );
  }

  const minInches = Math.round(CM_HEIGHT_MIN / 2.54);
  const maxInches = Math.round(CM_HEIGHT_MAX / 2.54);
  const options: PickerOption[] = [];

  for (let totalInches = minInches; totalInches <= maxInches; totalInches++) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    const label = `${feet}' ${inches}"`;
    const value = parseFloat((totalInches / 12).toFixed(2));
    options.push({ label, value });
  }

  return options;
};

const createWeightOptions = (unit: "kg" | "lbs"): PickerOption[] => {
  if (unit === "kg") {
    const min = KG_WEIGHT_MIN * 10;
    const max = KG_WEIGHT_MAX * 10;
    return Array.from({ length: max - min + 1 }, (_, index) => {
      const value = parseFloat(((min + index) / 10).toFixed(1));
      return {
        label: `${value.toFixed(1)} kg`,
        value,
      };
    });
  }

  const min = LBS_WEIGHT_MIN * 10;
  const max = LBS_WEIGHT_MAX * 10;
  return Array.from({ length: max - min + 1 }, (_, index) => {
    const value = parseFloat(((min + index) / 10).toFixed(1));
    return {
      label: `${value.toFixed(1)} lbs`,
      value,
    };
  });
};

const snapValueToOptions = (value: number, options: PickerOption[]): number => {
  if (!options.length || Number.isNaN(value)) {
    return value;
  }

  return options.reduce((closest, option) => {
    const closestDiff = Math.abs(closest.value - value);
    const optionDiff = Math.abs(option.value - value);
    return optionDiff < closestDiff ? option : closest;
  }).value;
};

const initializeDraftValue = (
  currentValue: number | null,
  options: PickerOption[]
): number => {
  if (!options.length) return 0;

  if (currentValue !== null && !Number.isNaN(currentValue)) {
    return snapValueToOptions(currentValue, options);
  }

  const middleIndex = Math.floor(options.length / 2);
  return options[middleIndex]?.value ?? options[0].value;
};

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

const formatImperialHeight = (decimalFeet: number): string => {
  const totalInches = Math.round(decimalFeet * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}"`;
};

const StepUserData: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();
  const [isBirthDatePickerVisible, setIsBirthDatePickerVisible] =
    useState(false);
  const [iosBirthDateDraft, setIosBirthDateDraft] = useState<Date>(
    formData.birthDate ?? shiftYearsFromToday(-18)
  );
  const [isHeightPickerVisible, setIsHeightPickerVisible] = useState(false);
  const [heightDraft, setHeightDraft] = useState<number>(() =>
    initializeDraftValue(
      formData.height,
      createHeightOptions(formData.heightUnit)
    )
  );
  const [isWeightPickerVisible, setIsWeightPickerVisible] = useState(false);
  const [weightDraft, setWeightDraft] = useState<number>(() =>
    initializeDraftValue(
      formData.weight,
      createWeightOptions(formData.weightUnit)
    )
  );

  const maximumBirthDate = useMemo(() => shiftYearsFromToday(-18), []);
  const minimumBirthDate = useMemo(() => shiftYearsFromToday(-100), []);
  const heightOptions = useMemo(
    () => createHeightOptions(formData.heightUnit),
    [formData.heightUnit]
  );
  const weightOptions = useMemo(
    () => createWeightOptions(formData.weightUnit),
    [formData.weightUnit]
  );

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

  // Auto-set default height if not already set
  useEffect(() => {
    if (formData.height === null && heightOptions.length > 0) {
      const defaultHeight = initializeDraftValue(null, heightOptions);
      updateField("height", defaultHeight);
    }
  }, [formData.height, heightOptions, updateField]);

  // Auto-set default weight if not already set
  useEffect(() => {
    if (formData.weight === null && weightOptions.length > 0) {
      const defaultWeight = initializeDraftValue(null, weightOptions);
      updateField("weight", defaultWeight);
    }
  }, [formData.weight, weightOptions, updateField]);

  useEffect(() => {
    setHeightDraft(initializeDraftValue(formData.height, heightOptions));
  }, [formData.height, heightOptions]);

  useEffect(() => {
    setWeightDraft(initializeDraftValue(formData.weight, weightOptions));
  }, [formData.weight, weightOptions]);

  const heightLabel = useMemo(() => {
    if (formData.height === null) {
      return `Select your height (${formData.heightUnit})`;
    }

    const option = heightOptions.find((item) => item.value === formData.height);

    if (option) return option.label;

    return formData.heightUnit === "cm"
      ? `${Math.round(formData.height)} cm`
      : formatImperialHeight(formData.height);
  }, [formData.height, formData.heightUnit, heightOptions]);

  const weightLabel = useMemo(() => {
    if (formData.weight === null) {
      return `Select your weight (${formData.weightUnit})`;
    }

    const option = weightOptions.find((item) => item.value === formData.weight);
    if (option) return option.label;

    return formData.weightUnit === "kg"
      ? `${formData.weight.toFixed(1)} kg`
      : `${formData.weight.toFixed(1)} lbs`;
  }, [formData.weight, formData.weightUnit, weightOptions]);

  const handleHeightUnitChange = (unit: "cm" | "ft") => {
    if (unit === formData.heightUnit) return;

    const options = createHeightOptions(unit);
    let convertedHeight: number | null = null;

    if (formData.height !== null) {
      const baseConverted = convertHeightValue(
        formData.height,
        formData.heightUnit,
        unit
      );
      convertedHeight = snapValueToOptions(baseConverted, options);
    }

    const nextValue = convertedHeight ?? initializeDraftValue(null, options);

    updateField("heightUnit", unit);
    updateField("height", nextValue);
    setHeightDraft(nextValue);
  };

  const handleWeightUnitChange = (unit: "kg" | "lbs") => {
    if (unit === formData.weightUnit) return;

    const options = createWeightOptions(unit);
    let convertedWeight: number | null = null;

    if (formData.weight !== null) {
      const baseConverted = convertWeightValue(
        formData.weight,
        formData.weightUnit,
        unit
      );
      convertedWeight = snapValueToOptions(baseConverted, options);
    }

    const nextValue = convertedWeight ?? initializeDraftValue(null, options);

    updateField("weightUnit", unit);
    updateField("weight", nextValue);
    setWeightDraft(nextValue);
  };

  const openHeightPicker = () => {
    setHeightDraft(initializeDraftValue(formData.height, heightOptions));
    setIsHeightPickerVisible(true);
  };

  const cancelHeightPicker = () => {
    setHeightDraft(initializeDraftValue(formData.height, heightOptions));
    setIsHeightPickerVisible(false);
  };

  const confirmHeightPicker = () => {
    updateField("height", heightDraft);
    setIsHeightPickerVisible(false);
  };

  const openWeightPicker = () => {
    setWeightDraft(initializeDraftValue(formData.weight, weightOptions));
    setIsWeightPickerVisible(true);
  };

  const cancelWeightPicker = () => {
    setWeightDraft(initializeDraftValue(formData.weight, weightOptions));
    setIsWeightPickerVisible(false);
  };

  const confirmWeightPicker = () => {
    updateField("weight", weightDraft);
    setIsWeightPickerVisible(false);
  };

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
        <TouchableOpacity
          onPress={openHeightPicker}
          activeOpacity={0.85}
          className="bg-white rounded-lg px-4 py-4 border border-gray-200"
        >
          <Text
            className={`text-lg ${
              formData.height ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {heightLabel}
          </Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-500 mt-2">
          Scroll to set your height accurately.
        </Text>
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
        <TouchableOpacity
          onPress={openWeightPicker}
          activeOpacity={0.85}
          className="bg-white rounded-lg px-4 py-4 border border-gray-200"
        >
          <Text
            className={`text-lg ${
              formData.weight ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {weightLabel}
          </Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-500 mt-2">
          We use this to balance volume and recovery.
        </Text>
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

      {/* Height Picker Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={isHeightPickerVisible}
        onRequestClose={cancelHeightPicker}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={cancelHeightPicker}>
                <Text className="text-blue-600 font-semibold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Select height ({formData.heightUnit})
              </Text>
              <TouchableOpacity onPress={confirmHeightPicker}>
                <Text className="text-blue-600 font-semibold text-lg">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <PickerWheelNumber
              values={heightOptions}
              selectedValue={heightDraft}
              onValueChange={setHeightDraft}
            />
          </View>
        </View>
      </Modal>

      {/* Weight Picker Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={isWeightPickerVisible}
        onRequestClose={cancelWeightPicker}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={cancelWeightPicker}>
                <Text className="text-blue-600 font-semibold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Select weight ({formData.weightUnit})
              </Text>
              <TouchableOpacity onPress={confirmWeightPicker}>
                <Text className="text-blue-600 font-semibold text-lg">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <PickerWheelNumber
              values={weightOptions}
              selectedValue={weightDraft}
              onValueChange={setWeightDraft}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StepUserData;
