// services/permissionsService.ts
// SAFE DEVELOPMENT VERSION — no native PermissionsAndroid logic

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SMS from "expo-sms";
import { Platform } from "react-native";

class PermissionsService {
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "web") return true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Notification permission error:", error);
      return false;
    }
  }

  async checkNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "web") return true;
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Location permission error:", error);
      return false;
    }
  }

  async checkLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  }

  async requestSMSPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "web") return true;
      if (Platform.OS === "ios") return await SMS.isAvailableAsync();
      // Android managed workflow - assume granted; real prompt handled by Expo
      return true;
    } catch (error) {
      console.error("SMS permission error:", error);
      return false;
    }
  }

  async checkSMSPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "web") return true;
      if (Platform.OS === "ios") return await SMS.isAvailableAsync();
      return true;
    } catch {
      return false;
    }
  }
}

export const permissionsService = new PermissionsService();
