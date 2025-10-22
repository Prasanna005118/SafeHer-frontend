package com.anonymous.boltexponativewind;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.util.Log;

public class SmsStatusReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsStatusReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String recipient = intent.getStringExtra("recipient");
        String action = intent.getAction();

        if ("SMS_SENT".equals(action)) {
            switch (getResultCode()) {
                case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
                    Log.e(TAG, "❌ Generic failure sending to " + recipient);
                    break;
                case SmsManager.RESULT_ERROR_NO_SERVICE:
                    Log.e(TAG, "📶 No service for " + recipient);
                    break;
                case SmsManager.RESULT_ERROR_NULL_PDU:
                    Log.e(TAG, "⚠️ Null PDU for " + recipient);
                    break;
                case SmsManager.RESULT_ERROR_RADIO_OFF:
                    Log.e(TAG, "📴 Radio off while sending to " + recipient);
                    break;
                default:
                    Log.d(TAG, "✅ SMS sent successfully to " + recipient);
                    break;
            }
        } else if ("SMS_DELIVERED".equals(action)) {
            Log.d(TAG, "📬 SMS delivered to " + recipient);
        }
    }
}
