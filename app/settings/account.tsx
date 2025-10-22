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
import { checkUsernameAvailable } from "../../lib/functions/userFunctions";

const AccountSettings = () => {
  const { user, updateUserProfile, uploadProfileImage } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profile_image_url || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

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

  const checkUsername = async (newUsername: string) => {
    if (!newUsername || newUsername === user?.username) {
      setUsernameError("");
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError("");

    try {
      const { available, error } = await checkUsernameAvailable(
        newUsername,
        user?.user_id
      );

      if (error) {
        setUsernameError("Error checking username");
        return;
      }

      if (!available) {
        setUsernameError("Username is already taken");
        return;
      }

      // Username is available
      setUsernameError("");
    } catch (error) {
      setUsernameError("Error checking username");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    if (usernameError) {
      Alert.alert("Error", "Please fix the username error");
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
        username.trim()
      );

      if (error) {
        Alert.alert("Error", "Failed to update profile");
        return;
      }

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
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

          {/* Username Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Username
            </Text>
            <View className="relative">
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  // Debounce username check
                  setTimeout(() => checkUsername(text), 500);
                }}
                placeholder="Enter username"
                className={`border rounded-lg px-4 py-3 text-base pr-10 ${
                  usernameError ? "border-red-500" : "border-gray-300"
                }`}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isCheckingUsername && (
                <View className="absolute right-3 top-3">
                  <ActivityIndicator size="small" color="#6B7280" />
                </View>
              )}
            </View>
            {usernameError ? (
              <Text className="text-red-500 text-sm mt-1">{usernameError}</Text>
            ) : (
              <Text className="text-gray-500 text-sm mt-1">
                3-20 characters, letters, numbers, and underscores only
              </Text>
            )}
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
