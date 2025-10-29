import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface VisibilitySelectorProps {
  visibility: "public" | "followers" | "private";
  onChange: (visibility: "public" | "followers" | "private") => void;
}

const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  visibility,
  onChange,
}) => {
  const [showModal, setShowModal] = useState(false);

  const visibilityOptions = [
    {
      key: "public" as const,
      label: "Everyone",
      icon: "globe-outline",
      description: "Anyone can see this workout",
    },
    {
      key: "followers" as const,
      label: "Followers",
      icon: "people-outline",
      description: "Only your followers can see this workout",
    },
    {
      key: "private" as const,
      label: "Only Me",
      icon: "lock-closed-outline",
      description: "Only you can see this workout",
    },
  ];

  const handleSelect = (option: (typeof visibilityOptions)[0]) => {
    onChange(option.key);
    setShowModal(false);
  };

  return (
    <>
      {/* Visibility Button */}
      <View>
        <TouchableOpacity
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
          onPress={() => setShowModal(true)}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={
                visibility === "public"
                  ? "globe-outline"
                  : visibility === "followers"
                    ? "people-outline"
                    : "lock-closed-outline"
              }
              size={20}
              color="#6b7280"
            />
            <Text className="ml-3 text-gray-900">
              {visibility === "public"
                ? "Everyone"
                : visibility === "followers"
                  ? "Followers"
                  : "Only Me"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Visibility Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50 pb-10">
          <View className="bg-white rounded-t-3xl">
            <View className="p-4 border-b border-gray-200">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
              <Text className="text-lg font-semibold text-gray-900 text-center">
                Visibility
              </Text>
            </View>
            <View className="p-4">
              {visibilityOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  className={`flex-row items-center py-4 px-2 rounded-lg ${
                    visibility === option.key ? "bg-blue-50" : ""
                  }`}
                  onPress={() => handleSelect(option)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={visibility === option.key ? "#2563eb" : "#6b7280"}
                  />
                  <View className="ml-4 flex-1">
                    <Text
                      className={`text-base font-medium ${
                        visibility === option.key
                          ? "text-blue-600"
                          : "text-gray-900"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </Text>
                  </View>
                  {visibility === option.key && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default VisibilitySelector;
