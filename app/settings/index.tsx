import { Ionicons } from "@expo/vector-icons";
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
import { useAuth } from "../../lib/context/AuthContext";
import { updatePrivacySettings } from "../../lib/functions/userFunctions";

const Settings = () => {
  const { user, signOut } = useAuth();
  const [isPublic, setIsPublic] = useState(user?.is_public ?? true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const handlePrivacyToggle = async (value: boolean) => {
    if (!user) return;

    setIsUpdatingPrivacy(true);
    try {
      const { error } = await updatePrivacySettings(user.user_id, value);
      if (error) {
        Alert.alert("Error", "Failed to update privacy settings");
        return;
      }
      setIsPublic(value);
    } catch (error) {
      console.error("Privacy update error:", error);
      Alert.alert("Error", "Failed to update privacy settings");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Implement delete account functionality
            Alert.alert(
              "Coming Soon",
              "Account deletion will be available soon."
            );
          },
        },
      ]
    );
  };

  const SettingItem = ({
    title,
    onPress,
    isDestructive = false,
  }: {
    title: string;
    onPress: () => void;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="py-4 px-6 border-b border-gray-100"
    >
      <Text
        className={`text-base ${
          isDestructive ? "text-red-500" : "text-gray-900"
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ToggleItem = ({
    title,
    value,
    onValueChange,
    disabled = false,
  }: {
    title: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View className="py-4 px-6 border-b border-gray-100 flex-row justify-between items-center">
      <Text className="text-base text-gray-900">{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: "#10B981" }}
        thumbColor={value ? "#FFFFFF" : "#F3F4F6"}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 flex-1">
            Settings
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Privacy Toggle */}
        <ToggleItem
          title="Public Profile"
          value={isPublic}
          onValueChange={handlePrivacyToggle}
          disabled={isUpdatingPrivacy}
        />

        {/* Navigation Items */}
        <SettingItem
          title="Account"
          onPress={() => router.push("/settings/account")}
        />
        {/* <SettingItem
          title="Push Notifications"
          onPress={() => router.push("/settings/notifications")}
        />
        <SettingItem
          title="Email Notifications"
          onPress={() => router.push("/settings/notifications")}
        />
        <SettingItem
          title="Support"
          onPress={() => {
            Alert.alert(
              "Support",
              "For support, please contact us at support@calos.app"
            );
          }}
        />
        <SettingItem
          title="Community Hub"
          onPress={() => {
            Alert.alert("Coming Soon", "Community Hub will be available soon.");
          }}
        /> */}
        <SettingItem
          title="Legal"
          onPress={() => {
            Alert.alert(
              "Legal",
              "Terms of Service and Privacy Policy are available in the About section."
            );
          }}
        />
        <SettingItem
          title="About"
          onPress={() => router.push("/settings/about")}
        />

        {/* Destructive Actions */}
        <View className="mt-8">
          <SettingItem
            title="Delete Your Account"
            onPress={handleDeleteAccount}
            isDestructive
          />
          <SettingItem title="Log out" onPress={handleLogout} isDestructive />
        </View>
      </ScrollView>
    </View>
  );
};

export default Settings;
