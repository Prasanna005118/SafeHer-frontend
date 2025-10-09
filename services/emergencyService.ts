// services/emergencyService.ts
// SAFE DEVELOPMENT VERSION — uses expo-sms, no native dependencies

import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { Platform } from "react-native";
import { contactsService } from "./contactsService";

interface EmergencyResult {
  success: boolean;
  error?: string;
  sentTo?: number;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Location permission not granted");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error("Failed to get location:", error);
    return null;
  }
};

export const sendEmergencyAlert = async (): Promise<EmergencyResult> => {
  try {
    console.log("🚨 Starting emergency alert (SAFE DEV VERSION) ...");

    // 1. Get emergency contacts
    const contacts = await contactsService.getContacts();
    if (contacts.length === 0) {
      return { success: false, error: "No emergency contacts found." };
    }

    // 2. Get current location
    const location = await getCurrentLocation();
    if (!location) {
      return { success: false, error: "Could not get your location." };
    }

    const { latitude, longitude } = location.coords;
    const mapsLink = `http://maps.google.com/maps?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help! My location:\n${mapsLink}\n\nPlease check on me immediately.`;

    // 3. Collect phone numbers
    const phoneNumbers = contacts.map(contact => contact.phone);
    console.log("📱 Phone numbers:", phoneNumbers);

    // 4. Platform behavior
    if (Platform.OS === "web") {
      console.log("Web fallback — logging message", { phoneNumbers, message });
      return { success: true, sentTo: phoneNumbers.length };
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: "SMS not available on this device" };
    }

    // Use expo composer (opens SMS app) — safe in managed workflow
    const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
    if (result === "sent" || result === "composed") {
      return { success: true, sentTo: phoneNumbers.length };
    } else {
      return { success: false, error: "SMS cancelled or failed." };
    }
  } catch (error: any) {
    console.error("Emergency alert error:", error);
    return { success: false, error: error.message || "Failed to send emergency alert" };
  }
};

export const emergencyService = { sendEmergencyAlert };
