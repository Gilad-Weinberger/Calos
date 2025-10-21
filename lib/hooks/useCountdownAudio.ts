import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

export const useCountdownAudio = () => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/audio/321beep.mp3")
        );
        soundRef.current = sound;
      } catch (error) {
        console.error("Failed to load countdown audio:", error);
      }
    };

    loadAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playCountdownAudio = async () => {
    if (soundRef.current && !hasPlayedRef.current) {
      try {
        hasPlayedRef.current = true;
        await soundRef.current.setPositionAsync(0); // Reset to start
        await soundRef.current.playAsync();

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
