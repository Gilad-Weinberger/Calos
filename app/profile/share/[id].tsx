import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../components/layout/FullPageTopBar";
import { getUserProfile } from "../../../lib/functions/userFunctions";

const QRCodeSharePage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const { data: userProfile, error: profileError } =
        await getUserProfile(id);

      if (profileError) {
        setError("Failed to load user profile");
        return;
      }

      if (!userProfile) {
        setError("User not found");
        return;
      }

      setProfileUser(userProfile);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["bottom", "left", "right"]}>
        <FullPageTopBar title="Share profile" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0066FF" />
          <Text className="text-gray-600 mt-2">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FullPageTopBar title="Share profile" />
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
            {error}
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Please try again later
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return null;
  }

  // Generate deep link for the profile
  const deepLink = `calos://profile/${id}`;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FullPageTopBar title="Share profile" />

      <View className="flex-1 items-center justify-center px-6">
        {/* User Name and Username */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-gray-800 text-center">
            {profileUser.name || "Unknown User"}
          </Text>
          {profileUser.description && (
            <Text className="text-lg font-semibold text-gray-600 text-center mt-1">
              @{profileUser.description}
            </Text>
          )}
        </View>

        {/* QR Code */}
        <View className="items-center mb-6">
          <View className="bg-white p-4 rounded-2xl shadow-lg">
            <QRCode
              value={deepLink}
              size={250}
              color="#000000"
              backgroundColor="#FFFFFF"
              logoSize={40}
              logoMargin={2}
              logoBorderRadius={20}
              logoBackgroundColor="transparent"
            />
          </View>
        </View>

        {/* Instruction Text */}
        <Text className="text-gray-600 text-center text-base">
          Scan with your camera app
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default QRCodeSharePage;
