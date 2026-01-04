// ScannerScreen.tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

/**
 * Simple placeholder screen for the QR Scanner.
 * Expand this later to integrate a barcode/QR scanning library.
 */
export default function ScannerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Scanner screen coming soon!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101622',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});