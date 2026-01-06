import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useApp } from "../context/AppContext";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#135bec",
  backgroundLight: "#f6f6f8",
  backgroundDark: "#101622",
  surfaceDark: "#1c2433",
  inputBg: "#232f48",
  inputBorder: "#2d3b55",
  textWhite: "#FFFFFF",
  textGray: "#94a3b8",
  textDark: "#0f172a",
};

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, login } = useApp();
  const [email, setEmail] = useState("alex@aurora.com");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const loading = state.loading;

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState("");

  const insets = useSafeAreaInsets();

  const showToast = (message: string) => {
    setToastMessage(message);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3000);
  };

  const validate = () => {
    if (!email.trim()) return "Please enter your email.";
    if (!password.trim()) return "Please enter your password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleLogin = async () => {
    const error = validate();
    if (error) {
      showToast(error);
      return;
    }

    try {
      await login({
        identifier: email.trim(),
        password,
      });

      showToast("Welcome back!");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        })
      );
    } catch (e: any) {
      showToast(e?.message ?? "Login failed. Please try again.");
    }
  };

  const handleFaceID = () => {
    scanAnim.setValue(0);
    Animated.sequence([
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scanAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      showToast("Face ID Verified");
    });
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, -10],
  });

  // ✅ Android: don't add bottom safe-area padding (prevents weird extra gap)
  const bottomPad = Platform.OS === "ios" ? 24 + insets.bottom : 24;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          // ✅ IMPORTANT: paint full screen with same bg (fixes “white strip” on Android)
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with logo */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.primary, "#a855f7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoIcon}
              />
              <Text style={styles.logoText}>Aurora Pay</Text>
            </View>
          </View>

          {/* Hero image */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={{
                uri:
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBSz7L2NQf0QtBPkDMoGL5dwEZBLVi_OnBxhlZoG4uPUIF-HVO8VQ0tlhVhrfN0XQdq7FGjejAaoczWNocHdUqleLxaijEyIXELBfK6nkFEM5oT1kwv0MyvicVbsHqkR_9a-pT8jAa8Dd5mxpKEbiNQn0hrONSvaiuj-pbGBD2wxT70zV6TAX4rqAUqi0k9ya-CS2TzdD1I5mZPI8uSsOTalk_ekPivkAwSJ7NjdHuy9CZtAg7gMIEjyI74Hav64tO6y1WgRBoYT0vy",
              }}
              style={styles.heroImage}
              imageStyle={{ borderRadius: 24 }}
            >
              <LinearGradient
                colors={["transparent", "rgba(16, 22, 34, 0.9)"]}
                style={styles.gradientOverlay}
              />
              <View style={styles.heroOverlay} />
            </ImageBackground>
          </View>

          {/* Content area */}
          <View style={styles.contentContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.headline}>Welcome Back</Text>
              <Text style={styles.subheadline}>Sign in to access your digital wallet</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Email */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="mail-outline" size={20} color={COLORS.textGray} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="lock-outline" size={20} color={COLORS.textGray} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textGray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible((prev) => !prev)}>
                  <MaterialIcons
                    name={isPasswordVisible ? "visibility" : "visibility-off"}
                    size={20}
                    color={COLORS.textGray}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot password link */}
              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={() => Alert.alert("Forgot Password", "Password reset is coming soon.")}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Log in button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Log In</Text>
                    <MaterialIcons name="login" size={20} color="white" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Biometric section */}
            <View style={styles.biometricContainer}>
              <TouchableOpacity style={styles.faceIdButton} onPress={handleFaceID}>
                <View style={styles.faceIdIconContainer}>
                  <MaterialIcons name="face" size={28} color={COLORS.primary} style={{ zIndex: 10 }} />
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]} />
                </View>
                <Text style={styles.biometricText}>Use Face ID</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastOpacity,
            transform: [{ translateY: toastTranslateY }],
          },
        ]}
      >
        <MaterialIcons name="check-circle" size={24} color="#4ade80" />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  // ✅ make scrollview paint full height with bg
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
    gap: 8,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  heroContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  heroImage: {
    width: "100%",
    height: width * 0.45,
    justifyContent: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 91, 236, 0.1)",
    opacity: 0.3,
  },
  contentContainer: {
    width: "100%",
    paddingHorizontal: 32,
    flex: 1,
  },
  titleContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  headline: {
    color: COLORS.textWhite,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subheadline: {
    color: COLORS.textGray,
    fontSize: 16,
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
    gap: 16,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: 20,
    top: 18,
    zIndex: 1,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.textWhite,
    borderRadius: 30,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  eyeIcon: {
    position: "absolute",
    right: 20,
    top: 18,
  },
  forgotContainer: {
    alignItems: "flex-end",
    paddingTop: 4,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  biometricContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  faceIdButton: {
    alignItems: "center",
  },
  faceIdIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(19, 91, 236, 0.2)",
    bottom: 0,
  },
  biometricText: {
    color: COLORS.textGray,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  signupText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: COLORS.surfaceDark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    gap: 12,
    zIndex: 100,
  },
  toastText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
