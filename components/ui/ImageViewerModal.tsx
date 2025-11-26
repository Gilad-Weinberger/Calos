import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Modal, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  onClose,
  imageUrl,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black">
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-12 right-4 z-10 bg-black/50 rounded-full p-2"
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Image */}
        <View className="flex-1 justify-center items-center">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ImageViewerModal;

