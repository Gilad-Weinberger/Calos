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
import { useAuth } from "../../lib/context/AuthContext";

const OnboardingScreen = () => {
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserProfile, uploadProfileImage } = useAuth();

  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log(
          "[Onboarding] Image selected from library:",
          result.assets[0].uri
        );
        setProfileImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your camera"
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log(
          "[Onboarding] Image taken with camera:",
          result.assets[0].uri
        );
        setProfileImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Select Profile Image",
      "Choose how you want to add your profile image",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!profileImage) {
      Alert.alert("Error", "Please add a profile image");
      return;
    }

    if (description.length > 300) {
      Alert.alert("Error", "Description must be 300 characters or less");
      return;
    }

    setIsLoading(true);

    try {
      let profileImageUrl: string | undefined;

      // Upload profile image if selected
      if (profileImage) {
        const { url, error } = await uploadProfileImage(profileImage);
        if (error) {
          console.error("[Onboarding] Upload error:", error);
          const errorMessage =
            error.message || error.toString() || "Unknown error";
          Alert.alert(
            "Error",
            `Failed to upload profile image: ${errorMessage}`
          );
          setIsLoading(false);
          return;
        }
        profileImageUrl = url || undefined;
      }

      // Update user profile
      const { error } = await updateUserProfile(
        name.trim(),
        profileImageUrl,
        description.trim() || undefined
      );

      if (error) {
        Alert.alert("Error", "Failed to update profile");
      } else {
        Alert.alert("Success", "Profile completed successfully!", [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      }
    } catch {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-6 bg-white"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-12">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Complete Your Profile
          </Text>
          <Text className="text-base text-gray-500 text-center">
            Add your name, description and profile picture to get started
          </Text>
        </View>

        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={showImagePicker}
            className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 justify-center items-center mb-4"
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-32 h-32 rounded-full"
                style={{ width: 120, height: 120, borderRadius: 60 }}
                onLoad={() =>
                  console.log("[Onboarding] Image loaded successfully")
                }
                onError={(error) =>
                  console.log("[Onboarding] Image load error:", error)
                }
              />
            ) : (
              <View className="items-center">
                <Text className="text-5xl text-gray-400">📷</Text>
                <Text className="text-xs text-gray-400 mt-1">Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={showImagePicker}>
            <Text className="text-blue-500 text-base font-semibold">
              {profileImage ? "Change Photo" : "Add Profile Photo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 text-base bg-gray-50"
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
              autoCapitalize="sentences"
            />
            <Text className="text-gray-500 text-sm mt-1">
              {description.length}/300 characters
            </Text>
          </View>

          <View>
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Full Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 text-base bg-gray-50"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            className={`bg-blue-500 rounded-xl p-4 items-center mt-2 ${
              isLoading ? "opacity-70" : ""
            }`}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Complete Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OnboardingScreen;
