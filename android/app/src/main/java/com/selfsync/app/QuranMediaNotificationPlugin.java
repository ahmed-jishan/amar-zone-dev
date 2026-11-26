package com.selfsync.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "QuranMediaNotification")
public class QuranMediaNotificationPlugin extends Plugin {
    private static final int NOTIFICATION_ID = 4242;
    private static final String CHANNEL_ID = "selfsync_quran_media";

    @PluginMethod
    public void update(PluginCall call) {
        try {
            Context context = getContext();
            NotificationManager notifications = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notifications == null) { call.reject("Notifications unavailable"); return; }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Quran playback", NotificationManager.IMPORTANCE_LOW);
                channel.setDescription("Controls for Quran audio playback");
                notifications.createNotificationChannel(channel);
            }

            String title = call.getString("title", "Quran");
            String subtitle = call.getString("subtitle", "");
            String ayahLine = call.getString("ayahLine", "");
            boolean playing = call.getBoolean("playing", false);

            Intent openApp = new Intent(context, MainActivity.class);
            openApp.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent openPending = PendingIntent.getActivity(context, 4243, openApp, flags);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle(title)
                .setContentText(subtitle)
                .setSubText(ayahLine)
                .setOngoing(playing)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setContentIntent(openPending);

            notifications.notify(NOTIFICATION_ID, builder.build());
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not update Quran notification", error);
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        NotificationManager notifications = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (notifications != null) notifications.cancel(NOTIFICATION_ID);
        call.resolve();
    }
}
