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
import { checkUsernameAvailable } from "../../lib/functions/userFunctions";

const OnboardingScreen = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
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

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    if (value.length > 20) {
      setUsernameError("Username must be less than 20 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError(
        "Username can only contain letters, numbers, and underscores"
      );
      return false;
    }
    setUsernameError("");
    return true;
  };

  const checkUsername = async (value: string) => {
    if (!validateUsername(value)) {
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { available, error } = await checkUsernameAvailable(value);
      if (error) {
        setUsernameError("Error checking username availability");
      } else if (!available) {
        setUsernameError("Username is already taken");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      setUsernameError("Error checking username availability");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.length > 0) {
      validateUsername(value);
    } else {
      setUsernameError("");
    }
  };

  const handleUsernameBlur = () => {
    if (username.trim()) {
      checkUsername(username.trim());
    }
  };

  const handleComplete = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!profileImage) {
      Alert.alert("Error", "Please add a profile image");
      return;
    }

    if (usernameError) {
      Alert.alert("Error", "Please fix the username error");
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
        username.trim()
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
            Add your username, name and profile picture to get started
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
              Username
            </Text>
            <View className="relative">
              <TextInput
                className={`border rounded-xl p-4 text-base bg-gray-50 ${
                  usernameError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={handleUsernameChange}
                onBlur={handleUsernameBlur}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isCheckingUsername && (
                <View className="absolute right-3 top-4">
                  <ActivityIndicator size="small" color="#3B82F6" />
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
