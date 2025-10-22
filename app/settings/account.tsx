import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";

const AccountSettings = () => {
  const { user, updateUserProfile, uploadProfileImage } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [description, setDescription] = useState(user?.description || "");
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profile_image_url || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (description.length > 300) {
      Alert.alert("Error", "Description must be 300 characters or less");
      return;
    }

    setIsLoading(true);

    try {
      let profileImageUrl = user?.profile_image_url;

      // Upload new profile image if changed
      if (profileImage && profileImage !== user?.profile_image_url) {
        const { url, error: uploadError } =
          await uploadProfileImage(profileImage);
        if (uploadError) {
          Alert.alert("Error", "Failed to upload profile image");
          setIsLoading(false);
          return;
        }
        profileImageUrl = url;
      }

      // Update user profile
      const { error } = await updateUserProfile(
        name.trim(),
        profileImageUrl || undefined,
        description.trim() || undefined
      );

      if (error) {
        Alert.alert("Error", "Failed to update profile");
        return;
      }

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text className="text-lg font-semibold text-gray-900">Account</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className="p-2 -mr-2"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Text className="text-lg font-medium text-green-600">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 py-6">
          {/* Profile Image */}
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={pickImage}
              className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden"
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-4xl text-gray-400">👤</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} className="mt-2">
              <Text className="text-green-600 font-medium">Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              autoCapitalize="words"
            />
          </View>

          {/* Description Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us about yourself..."
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              multiline
              numberOfLines={3}
              maxLength={300}
              autoCapitalize="sentences"
            />
            <Text className="text-gray-500 text-sm mt-1">
              {description.length}/300 characters
            </Text>
          </View>

          {/* Email (Read-only) */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
              <Text className="text-base text-gray-600">{user?.email}</Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1">
              Email cannot be changed
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AccountSettings;
