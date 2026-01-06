// App.tsx
import "./tailwind.css";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-get-random-values";
import * as Notifications from "expo-notifications";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";

import { AppProvider } from "./src/context/AppContext";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import TransactionScreen from "./src/screens/TransactionScreen";
import TransactionHistoryScreen from "./src/screens/TransactionHistoryScreen";
import TopUpScreen from "./src/screens/TopUpScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import TransactionrequestScreen from "./src/screens/TransactionrequestScreen";
import MyCardsScreen from "./src/screens/MyCardsScreen";
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      (async () => {
        // Put nav bar over your UI so your background shows behind it
        await NavigationBar.setPositionAsync("absolute");
        await NavigationBar.setBackgroundColorAsync("transparent");
        await NavigationBar.setButtonStyleAsync("light");
      })();
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
            <Stack.Screen name="request" component={TransactionrequestScreen} />
            <Stack.Screen name="MyCards" component={MyCardsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
}
