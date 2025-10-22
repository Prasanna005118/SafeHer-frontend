package com.anonymous.boltexponativewind;

import android.Manifest;
import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.telephony.SmsManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.ServiceInfo;
import android.content.Intent;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Arrays;

public class EmergencyLocationUpdateService extends Service {
    private static final String TAG = "EmergencyLocationUpdateService";
    private static final String CHANNEL_ID = "safeher_location_updates";
    private static final String PREFS_NAME = "SafeHerPrefs";
    private static final String CONTACTS_KEY = "emergency_contacts";

    private double lastLat = 0.0;
    private double lastLon = 0.0;
    private int stationaryCount = 0;
    private Handler handler;
    private Runnable locationCheckRunnable;

    private static final long CHECK_INTERVAL_MS = 10 * 60 * 10; // 10 min
    private static final float MOVEMENT_THRESHOLD_METERS = 500f;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Notification notification = buildNotification("Monitoring your location for safety updates...");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(2002, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(2002, notification);
        }
        handler = new Handler(Looper.getMainLooper());
        locationCheckRunnable = this::checkLocationAndMaybeSendUpdate;
        handler.post(locationCheckRunnable);
        Log.d(TAG, "✅ Location update monitoring started.");
    }

    private void checkLocationAndMaybeSendUpdate() {
        new Thread(() -> {
            try {
                Location current = getCurrentLocation();
                if (current == null) {
                    Log.w(TAG, "⚠️ Could not get current location, retrying later...");
                } else {
                    double lat = current.getLatitude();
                    double lon = current.getLongitude();
                    if (lastLat == 0.0 && lastLon == 0.0) {
                        lastLat = lat;
                        lastLon = lon;
                        Log.d(TAG, "📍 Initial location recorded.");
                    } else {
                        float distance = calculateDistance(lastLat, lastLon, lat, lon);
                        Log.d(TAG, "📏 Moved " + distance + " meters since last check.");
                        if (distance > MOVEMENT_THRESHOLD_METERS) {
                            stationaryCount = 0;
                            lastLat = lat;
                            lastLon = lon;
                            sendMovementSMS(lat, lon);
                        } else {
                            stationaryCount++;
                            Log.d(TAG, "📌 Stationary count: " + stationaryCount);
                            if (stationaryCount >= 3) {
                                Log.d(TAG, "✅ No movement detected after 3 checks, stopping updates.");
                                stopSelf();
                                return;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error checking location", e);
            } finally {
                handler.postDelayed(locationCheckRunnable, CHECK_INTERVAL_MS);
            }
        }).start();
    }

    private Location getCurrentLocation() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "❌ No location permission!");
            return null;
        }
        LocationManager lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        Location loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        if (loc == null)
            loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
        return loc;
    }

    private void sendMovementSMS(double lat, double lon) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String contactsString = prefs.getString(CONTACTS_KEY, "");
        if (contactsString.isEmpty()) return;

        List<String> contacts = Arrays.asList(contactsString.split(","));
        String message = "🚶 Location update: https://maps.google.com/?q=" + lat + "," + lon +
                "\nTime: " + new SimpleDateFormat("hh:mm:ss a", Locale.getDefault()).format(new Date());

        SmsManager smsManager = SmsManager.getDefault();

        for (String number : contacts) {
            String trimmed = number.trim();
            if (!trimmed.startsWith("+")) trimmed = "+91" + trimmed;
            smsManager.sendMultipartTextMessage(trimmed, null,
                    smsManager.divideMessage(message), null, null);
            Log.d(TAG, "📤 Sent movement SMS to " + trimmed);
        }
    }

    private float calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        float[] results = new float[1];
        Location.distanceBetween(lat1, lon1, lat2, lon2, results);
        return results[0];
    }

    private Notification buildNotification(String text) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_map)
                .setContentTitle("SafeHer Location Tracker")
                .setContentText(text)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "SafeHer Location Updates", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Monitors and sends movement-based location SMS");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && locationCheckRunnable != null) {
            handler.removeCallbacks(locationCheckRunnable);
        }
        Log.d(TAG, "🛑 Location monitoring stopped.");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
