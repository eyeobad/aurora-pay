// src/screens/ScannerScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { CameraView, BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { notifyLocal } from "../lib/notifications";

const COLORS = {
  bg: "#101622",
  primary: "#135bec",
  white: "#ffffff",
  overlay: "rgba(0,0,0,0.55)",
};

export default function ScannerScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanAccount, setScanAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  const parseAccount = (data: string) => {
    if (!data) return null;
    if (data.includes("account=")) {
      const query = data.split("?")[1] ?? "";
      if (typeof URLSearchParams !== "undefined") {
        const params = new URLSearchParams(query);
        const account = params.get("account");
        if (account) return account;
      } else {
        const pairs = query.split("&");
        for (const pair of pairs) {
          const [key, value] = pair.split("=");
          if (key === "account" && value) return decodeURIComponent(value);
        }
      }
    }
    const digits = data.replace(/[^0-9]/g, "");
    if (digits.length >= 10) return digits.slice(0, 10);
    return null;
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    // ?. HAPTIC on successful scan
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const account = parseAccount(result.data);
    if (!account) {
      await notifyLocal("Invalid QR", "No account number found in this code.");
      setTimeout(() => {
        setScanAccount(null);
        setScanned(false);
      }, 800);
      return;
    }

    setScanAccount(account);
    setTimeout(() => {
      navigation.navigate("Transaction", { accountNumber: account });
    }, 800);
  };

  const onRescan = async () => {
    // ✅ Light haptic on button press
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setScanAccount(null);
    setScanned(false);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417", "ean13", "ean8", "code128"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* overlay frame */}
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.frame} />

        <Text style={styles.hintText}>
          {scanAccount ? `Account ${scanAccount} found` : "Align QR code within the frame"}
        </Text>

        {scanned && (
          <TouchableOpacity style={styles.rescanBtn} onPress={onRescan}>
            <MaterialCommunityIcons name="qrcode-scan" size={22} color="#fff" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  permissionBtnText: { color: "#fff", fontWeight: "700" },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },

  topBar: {
    marginTop: 48,
    marginHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: COLORS.white, fontSize: 18, fontWeight: "800" },

  frame: {
    marginTop: 80,
    alignSelf: "center",
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "transparent",
  },

  hintText: {
    marginTop: 18,
    textAlign: "center",
    color: COLORS.white,
    opacity: 0.8,
    fontSize: 14,
  },

  rescanBtn: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rescanText: { color: "#fff", fontWeight: "800" },
});


