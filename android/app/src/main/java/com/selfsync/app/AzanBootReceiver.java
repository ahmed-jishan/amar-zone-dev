package com.selfsync.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AzanBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        String raw = context.getSharedPreferences("selfsync_native_azan", Context.MODE_PRIVATE)
            .getString("schedule", null);
        if (raw == null) return;

        try {
            AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            org.json.JSONArray items = new org.json.JSONArray(raw);
            for (int i = 0; i < items.length(); i++) {
                org.json.JSONObject item = items.getJSONObject(i);
                String id = item.optString("id");
                String label = item.optString("label", "Prayer");
                long time = item.optLong("time");
                if (time <= System.currentTimeMillis() || alarms == null) continue;

                Intent alarmIntent = new Intent(context, AzanReceiver.class);
                alarmIntent.putExtra("azan_label", label);
                alarmIntent.putExtra("azan_id", id);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
                PendingIntent pending = PendingIntent.getBroadcast(context, id.hashCode(), alarmIntent, flags);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pending);
                } else {
                    alarms.setExact(AlarmManager.RTC_WAKEUP, time, pending);
                }
            }
        } catch (Exception ignored) {
        }
    }
}
