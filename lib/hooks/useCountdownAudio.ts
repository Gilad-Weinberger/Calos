import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

// Singleton to hold the sound instance across re-renders/unmounts
let globalSound: Audio.Sound | null = null;

export const useCountdownAudio = () => {
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const loadAudio = async () => {
      // Only load if not already loaded
      if (!globalSound) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("../../assets/audio/321beep.mp3")
          );
          globalSound = sound;
        } catch (error) {
          console.error("Failed to load countdown audio:", error);
        }
      }
    };

    loadAudio();

    // Do NOT unload the sound on cleanup to allow it to finish playing
    // globalSound will persist
  }, []);

  const playCountdownAudio = async () => {
    if (globalSound && !hasPlayedRef.current) {
      try {
        hasPlayedRef.current = true;
        await globalSound.setPositionAsync(0); // Reset to start
        await globalSound.playAsync();

        // Reset the flag after audio duration (4 seconds)
        setTimeout(() => {
          hasPlayedRef.current = false;
        }, 4000);
      } catch (error) {
        console.error("Failed to play countdown audio:", error);
        hasPlayedRef.current = false;
      }
    }
  };

  const resetAudioFlag = () => {
    hasPlayedRef.current = false;
  };

  return {
    playCountdownAudio,
    resetAudioFlag,
  };
};
