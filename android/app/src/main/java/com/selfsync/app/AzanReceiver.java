package com.selfsync.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class AzanReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "selfsync_azan";

    @Override
    public void onReceive(Context context, Intent intent) {
        String label = intent != null ? intent.getStringExtra("azan_label") : null;
        if (label == null || label.isEmpty()) label = "Prayer time";

        NotificationManager notifications = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notifications != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Prayer alarms", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Scheduled prayer-time alerts");
            channel.enableVibration(true);
            notifications.createNotificationChannel(channel);
        }

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent openPending = PendingIntent.getActivity(context, 1001, openApp, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle(label)
            .setContentText("It is time for prayer")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(openPending);

        if (notifications != null) notifications.notify((int) (System.currentTimeMillis() % 100000), builder.build());

        try {
            final MediaPlayer player = MediaPlayer.create(context, R.raw.azan1);
            if (player != null) {
                player.setOnCompletionListener(MediaPlayer::release);
                player.setOnErrorListener((mp, what, extra) -> { mp.release(); return true; });
                player.start();
            }
        } catch (Exception ignored) {
        }
    }
}
