import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MediaItem {
  id: string;
  uri: string;
  type: "image" | "video";
  name?: string;
}

interface WorkoutMediaUploadInputProps {
  onMediaChange: (mediaItems: MediaItem[]) => void;
  initialMedia?: MediaItem[];
  maxItems?: number;
}

const WorkoutMediaUploadInput: React.FC<WorkoutMediaUploadInputProps> = ({
  onMediaChange,
  initialMedia = [],
  maxItems = 10,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMedia);
  const [isLoading, setIsLoading] = useState(false);

  const pickMedia = async () => {
    try {
      setIsLoading(true);

      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload media."
        );
        return;
      }

      // Launch media picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets) {
        const newMediaItems: MediaItem[] = result.assets.map(
          (asset, index) => ({
            id: `${Date.now()}-${index}`,
            uri: asset.uri,
            type: asset.type === "video" ? "video" : "image",
            name: asset.fileName || `${asset.type}-${index}`,
          })
        );

        const updatedItems = [...mediaItems, ...newMediaItems].slice(
          0,
          maxItems
        );
        setMediaItems(updatedItems);
        onMediaChange(updatedItems);
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Failed to pick media files");
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newMediaItem: MediaItem = {
          id: `${Date.now()}`,
          uri: result.assets[0].uri,
          type: "image",
          name: `photo-${Date.now()}`,
        };

        const updatedItems = [...mediaItems, newMediaItem].slice(0, maxItems);
        setMediaItems(updatedItems);
        onMediaChange(updatedItems);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    } finally {
      setIsLoading(false);
    }
  };

  const removeMedia = (id: string) => {
    const updatedItems = mediaItems.filter((item) => item.id !== id);
    setMediaItems(updatedItems);
    onMediaChange(updatedItems);
  };

  const showMediaPicker = () => {
    Alert.alert(
      "Add Media",
      "Choose how you want to add media to your workout",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickMedia },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const renderMediaItem = (item: MediaItem) => (
    <>
      <View style={styles.mediaPreview}>
        {item.type === "image" ? (
          <Image source={{ uri: item.uri }} style={styles.mediaImage} />
        ) : (
          <View style={styles.videoPreview}>
            <Ionicons name="play-circle" size={40} color="white" />
            <Text style={styles.videoLabel}>Video</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeMedia(item.id)}
        >
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.mediaTypeLabel}>
        {item.type === "image" ? "📷" : "🎥"} {item.type.toUpperCase()}
      </Text>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Media</Text>
        <Text style={styles.subtitle}>
          {mediaItems.length}/{maxItems} items
        </Text>
      </View>

      <View style={styles.mediaGrid}>
        {mediaItems.map((item) => (
          <View key={item.id} style={styles.mediaItem}>
            {renderMediaItem(item)}
          </View>
        ))}
      </View>

      {mediaItems.length < maxItems && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={showMediaPicker}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <Ionicons name="add" size={24} color="#2563eb" />
              <Text style={styles.addButtonText}>Add Media</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {mediaItems.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No media added yet</Text>
          <Text style={styles.emptySubtext}>
            Add photos or videos to showcase your workout
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 8,
  },
  mediaItem: {
    width: "48%",
    margin: "1%",
  },
  mediaPreview: {
    position: "relative",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  videoLabel: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "white",
    borderRadius: 12,
  },
  mediaTypeLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#2563eb",
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
});

export default WorkoutMediaUploadInput;


