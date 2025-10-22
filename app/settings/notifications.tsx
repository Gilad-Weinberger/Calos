import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";

const NotificationSettings = () => {
  const { user } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePushNotificationToggle = async (value: boolean) => {
    setIsUpdating(true);
    try {
      // TODO: Implement push notification preference update
      // For now, just update local state
      setPushNotifications(value);
      Alert.alert("Success", "Push notification preference updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update push notification preference");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailNotificationToggle = async (value: boolean) => {
    setIsUpdating(true);
    try {
      // TODO: Implement email notification preference update
      // For now, just update local state
      setEmailNotifications(value);
      Alert.alert("Success", "Email notification preference updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update email notification preference");
    } finally {
      setIsUpdating(false);
    }
  };

  const ToggleItem = ({
    title,
    description,
    value,
    onValueChange,
    disabled = false,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View className="py-4 px-6 border-b border-gray-100">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <Text className="text-base font-medium text-gray-900 mb-1">
            {title}
          </Text>
          <Text className="text-sm text-gray-500">{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#E5E7EB", true: "#10B981" }}
          thumbColor={value ? "#FFFFFF" : "#F3F4F6"}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <SafeAreaView edges={["top"]}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Text className="text-lg text-gray-600">←</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Notifications
            </Text>
            <View className="w-8" />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1">
        {/* Push Notifications Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-6 mb-2">
            Push Notifications
          </Text>
          <ToggleItem
            title="Push Notifications"
            description="Receive notifications on your device"
            value={pushNotifications}
            onValueChange={handlePushNotificationToggle}
            disabled={isUpdating}
          />
        </View>

        {/* Email Notifications Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-6 mb-2">
            Email Notifications
          </Text>
          <ToggleItem
            title="Email Notifications"
            description="Receive notifications via email"
            value={emailNotifications}
            onValueChange={handleEmailNotificationToggle}
            disabled={isUpdating}
          />
        </View>

        {/* Info Section */}
        <View className="px-6 py-6">
          <View className="bg-blue-50 rounded-lg p-4">
            <Text className="text-sm text-blue-800">
              <Text className="font-medium">Note:</Text> Notification
              preferences are currently stored locally. In a future update,
              these will be synced with your account.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationSettings;
