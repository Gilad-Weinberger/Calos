import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AboutSettings = () => {
  const appVersion = "1.0.0"; // From app.json

  const handleOpenLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open ${title}`);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to open ${title}`);
    }
  };

  const SettingItem = ({
    title,
    onPress,
    showChevron = true,
  }: {
    title: string;
    onPress: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="py-4 px-6 border-b border-gray-100 flex-row justify-between items-center"
    >
      <Text className="text-base text-gray-900">{title}</Text>
      {showChevron && <Text className="text-gray-400">›</Text>}
    </TouchableOpacity>
  );

  const InfoItem = ({ title, value }: { title: string; value: string }) => (
    <View className="py-4 px-6 border-b border-gray-100">
      <Text className="text-sm text-gray-500 mb-1">{title}</Text>
      <Text className="text-base text-gray-900">{value}</Text>
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
            <Text className="text-lg font-semibold text-gray-900">About</Text>
            <View className="w-8" />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1">
        {/* App Info Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-6 mb-2">
            App Information
          </Text>
          <InfoItem title="Version" value={appVersion} />
          <InfoItem title="Build" value="1.0.0 (1)" />
          <InfoItem title="Platform" value="React Native + Expo" />
        </View>

        {/* Legal Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-6 mb-2">
            Legal
          </Text>
          <SettingItem
            title="Terms of Service"
            onPress={() =>
              handleOpenLink("https://calos.app/terms", "Terms of Service")
            }
          />
          <SettingItem
            title="Privacy Policy"
            onPress={() =>
              handleOpenLink("https://calos.app/privacy", "Privacy Policy")
            }
          />
          <SettingItem
            title="Open Source Licenses"
            onPress={() => {
              Alert.alert(
                "Open Source Licenses",
                "This app uses various open source libraries. For a complete list of licenses, please visit our website."
              );
            }}
          />
        </View>

        {/* Support Section */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-gray-900 px-6 mb-2">
            Support
          </Text>
          <SettingItem
            title="Contact Support"
            onPress={() => {
              Alert.alert(
                "Contact Support",
                "For support, please email us at support@calos.app or visit our help center."
              );
            }}
          />
          <SettingItem
            title="Report a Bug"
            onPress={() => {
              Alert.alert(
                "Report a Bug",
                "To report a bug, please email us at bugs@calos.app with details about the issue."
              );
            }}
          />
          <SettingItem
            title="Feature Request"
            onPress={() => {
              Alert.alert(
                "Feature Request",
                "Have an idea for a new feature? Email us at features@calos.app"
              );
            }}
          />
        </View>

        {/* Company Info */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-900 px-6 mb-2">
            Company
          </Text>
          <InfoItem title="Developer" value="Calos Team" />
          <InfoItem title="Website" value="calos.app" />
          <InfoItem
            title="Copyright"
            value="© 2024 Calos. All rights reserved."
          />
        </View>

        {/* App Description */}
        <View className="px-6 py-6">
          <View className="bg-gray-50 rounded-lg p-4">
            <Text className="text-sm text-gray-600 leading-6">
              <Text className="font-medium">Calos</Text> is a comprehensive
              fitness tracking app that helps you plan, record, and analyze your
              workouts. Track your progress, follow workout plans, and achieve
              your fitness goals with our AI-powered insights and social
              features.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutSettings;
