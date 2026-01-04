// App.tsx
import "./tailwind.css";
import React, { useEffect } from "react";
import "react-native-get-random-values";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/context/AppContext";

import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import TransactionScreen from "./src/screens/TransactionScreen";
import TransactionHistoryScreen from "./src/screens/TransactionHistoryScreen";
import TopUpScreen from "./src/screens/TopUpScreen";
import ScannerScreen from "./src/screens/ScannerScreen";  
const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Set the Android navigation bar color to dark to avoid a white bar
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#101622");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  return (
    <AppProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#101622" },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Transaction" component={TransactionScreen} />
            <Stack.Screen name="History" component={TransactionHistoryScreen} />
            <Stack.Screen name="TopUp" component={TopUpScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
}
