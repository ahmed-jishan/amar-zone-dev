package com.selfsync.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "AzanNative")
public class AzanNativePlugin extends Plugin {
    private static final String PREFS = "selfsync_native_azan";
    private static final String SCHEDULE_KEY = "schedule";

    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray items;
        try {
            items = call.getArray("items");
        } catch (Exception error) {
            call.reject("Prayer schedule is missing", error);
            return;
        }

        try {
            Context context = getContext();
            AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarms == null) {
                call.reject("Alarm service is unavailable");
                return;
            }

            org.json.JSONArray persisted = new org.json.JSONArray();
            for (int i = 0; i < items.length(); i++) {
                org.json.JSONObject item = items.getJSONObject(i);
                String id = item.optString("id");
                String label = item.optString("label", item.optString("prayerName", "Prayer"));
                long time = item.optLong("time");

                org.json.JSONObject alarmItem = new org.json.JSONObject();
                alarmItem.put("id", id);
                alarmItem.put("label", label);
                alarmItem.put("time", time);
                persisted.put(alarmItem);

                Intent intent = new Intent(context, AzanReceiver.class);
                intent.putExtra("azan_label", label);
                intent.putExtra("azan_id", id);
                int requestCode = id.hashCode();
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
                PendingIntent pending = PendingIntent.getBroadcast(context, requestCode, intent, flags);

                if (time > System.currentTimeMillis()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pending);
                    } else {
                        alarms.setExact(AlarmManager.RTC_WAKEUP, time, pending);
                    }
                }
            }

            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(SCHEDULE_KEY, persisted.toString()).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not schedule prayer alarms", error);
        }
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        JSArray ids;
        try {
            ids = call.getArray("ids");
        } catch (Exception error) {
            call.reject("Alarm ids are missing", error);
            return;
        }

        try {
            Context context = getContext();
            AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            for (int i = 0; i < ids.length(); i++) {
                String id = ids.optString(i);
                Intent intent = new Intent(context, AzanReceiver.class);
                int flags = PendingIntent.FLAG_NO_CREATE;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
                PendingIntent pending = PendingIntent.getBroadcast(context, id.hashCode(), intent, flags);
                if (pending != null && alarms != null) alarms.cancel(pending);
            }

            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(SCHEDULE_KEY).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not cancel prayer alarms", error);
        }
    }
}
