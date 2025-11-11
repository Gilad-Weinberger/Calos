import React, { useEffect, useMemo, useRef } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  View,
} from "react-native";

type PickerOption = {
  label: string;
  value: number;
};

type PickerWheelNumberProps = {
  values: PickerOption[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  visibleItemCount?: number;
};

const ITEM_HEIGHT = 56;

const PickerWheelNumber: React.FC<PickerWheelNumberProps> = ({
  values,
  selectedValue,
  onValueChange,
  visibleItemCount = 5,
}) => {
  const listRef = useRef<FlatList<PickerOption>>(null);

  const selectedIndex = useMemo(() => {
    if (!values.length) return 0;
    const match = values.findIndex((option) => option.value === selectedValue);
    if (match !== -1) return match;
    return Math.max(Math.floor(values.length / 2), 0);
  }, [selectedValue, values]);

  useEffect(() => {
    if (!values.length) return;
    const index = Math.min(Math.max(selectedIndex, 0), values.length - 1);

    const timeout = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(timeout);
  }, [selectedIndex, values]);

  const highlightOffset = ((visibleItemCount - 1) / 2) * ITEM_HEIGHT;

  const handleMomentumEnd = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!values.length) return;

    const offsetY = nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), values.length - 1);
    const option = values[clampedIndex];

    if (option && option.value !== selectedValue) {
      onValueChange(option.value);
    }
  };

  return (
    <View
      className="relative"
      style={{ height: ITEM_HEIGHT * visibleItemCount }}
    >
      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(item) => `${item.value}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          });
        }}
        contentContainerStyle={{
          paddingVertical: highlightOffset,
        }}
        renderItem={({ item }) => {
          const isSelected = item.value === selectedValue;
          return (
            <View className="h-14 items-center justify-center">
              <Text
                className={`text-xl ${
                  isSelected ? "font-semibold text-gray-900" : "text-gray-400"
                }`}
              >
                {item.label}
              </Text>
            </View>
          );
        }}
      />
      <View
        className="pointer-events-none absolute left-0 right-0 border-y border-blue-500/60"
        style={{
          top: (ITEM_HEIGHT * visibleItemCount) / 2 - ITEM_HEIGHT / 2,
          height: ITEM_HEIGHT,
        }}
      />
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 h-16"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}
      />
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 bottom-0 h-16"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}
      />
    </View>
  );
};

export type { PickerOption };
export default PickerWheelNumber;
