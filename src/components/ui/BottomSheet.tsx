import React, { useMemo, type ReactNode } from "react";
import BottomSheetModal, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

interface AppBottomSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  children: ReactNode;
  snapPoints?: Array<string | number>;
}

export function BottomSheet({
  sheetRef,
  children,
  snapPoints = ["55%", "82%"],
}: AppBottomSheetProps) {
  const points = useMemo(() => snapPoints, [snapPoints]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={points}
      enablePanDownToClose
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      handleIndicatorStyle={{ backgroundColor: "#C9BFAE", width: 48 }}
      backgroundStyle={{ backgroundColor: "white", borderRadius: 32 }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
