// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from "react-native-svg";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width: W } = Dimensions.get("window");
const AnimatedView = Animated.createAnimatedComponent(View);

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Pulse Animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Loading Progress & Navigation
  useEffect(() => {
    const loader = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: true,
    });

    loader.start(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    });

    return () => loader.stop();
  }, [progress, navigation]);

  // Colors & Assets
  const bg = "#101622";
  const primary = "#135bec";
  const primary2 = "#0a3899";
  const logoSource = require("../assets/logo (1).png"); 

  // Animations
  const scaleX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      
      {/* 🎨 PIXEL PERFECT AURORA BACKGROUND (SVG) */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <RadialGradient id="topGlow" cx="50%" cy="0%" rx="80%" ry="50%">
              <Stop offset="0" stopColor={primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={bg} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="bottomGlow" cx="50%" cy="100%" rx="60%" ry="40%">
              <Stop offset="0" stopColor={primary} stopOpacity="0.1" />
              <Stop offset="1" stopColor={bg} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="60%" fill="url(#topGlow)" />
          <Rect x="0" y="50%" width="100%" height="50%" fill="url(#bottomGlow)" />
        </Svg>
      </View>

      <View style={{ flex: 1 }} />

      {/* Center Content - Moved UP via translateY */}
      <View style={[styles.centerWrap, { transform: [{ translateY: -40 }] }]}> 
        {/* Glow behind logo */}
        <AnimatedView style={{ position: 'absolute', opacity: 0.5, transform: [{ scale: logoScale }] }}>
           <Svg height={200} width={200} viewBox="0 0 200 200">
             <Defs>
                <RadialGradient id="logoGlow" cx="100" cy="100" rx="100" ry="100" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor={primary} stopOpacity="0.4" />
                  <Stop offset="1" stopColor={primary} stopOpacity="0" />
                </RadialGradient>
             </Defs>
             <Circle cx="100" cy="100" r="100" fill="url(#logoGlow)" />
           </Svg>
        </AnimatedView>

        {/* Logo Container */}
        <View style={[styles.logoContainer, { backgroundColor: bg, borderColor: bg }]}>
          <LinearGradient
            colors={[primary, primary2]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
             <Image source={logoSource} resizeMode="contain" style={{ width: 64, height: 64 }} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Aurora Pay</Text>
        <Text style={styles.tagline}>Simple. Fast. Secure.</Text>
      </View>

      {/* Footer */}
      <View style={[styles.bottomWrapper, { paddingBottom: insets.bottom + 48 }]}>
        <View style={styles.progressTrack}>
          <AnimatedView style={[styles.progressBar, { backgroundColor: primary, transform: [{ scaleX }] }]} />
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    // You can adjust this value to move it even higher or lower
    marginBottom: 170, 
  },
  logoContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    shadowColor: "#135bec",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
    padding: 2,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    fontWeight: "500",
    color: "#92a4c9",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  bottomWrapper: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  progressTrack: {
    width: 240,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(50, 68, 103, 0.3)",
    overflow: "hidden",
    alignItems: 'flex-start',
  },
  progressBar: {
    height: "100%",
    width: "100%", 
    borderRadius: 3,
  },
  version: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: "#586a8f",
    opacity: 0.6,
    letterSpacing: 1.5,
  },
});