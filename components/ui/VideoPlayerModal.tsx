import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef } from "react";
import { Modal, TouchableOpacity, View } from "react-native";

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  videoUrl: string;
  exerciseName: string;
  exerciseType: "static" | "dynamic";
  sets: number;
  reps: number[];
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  onClose,
  videoUrl,
}) => {
  const videoRef = useRef<Video>(null);

  // Auto-play video when modal opens
  useEffect(() => {
    if (visible && videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current?.playAsync();
        } catch (error) {
          console.error("Error auto-playing video:", error);
        }
      };
      // Small delay to ensure video is loaded
      const timer = setTimeout(playVideo, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleModalClose = async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleModalClose}
    >
      <View className="flex-1 bg-black">
        {/* Video Player - Fullscreen */}
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
        />

        {/* Close Button Overlay */}
        <View className="absolute top-12 right-4">
          <TouchableOpacity
            onPress={handleModalClose}
            className="w-12 h-12 bg-black/50 rounded-full items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default VideoPlayerModal;
