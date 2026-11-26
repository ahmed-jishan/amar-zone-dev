package com.selfsync.app;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import android.util.Base64;

@CapacitorPlugin(name = "NativeFileSave")
public class NativeFileSavePlugin extends Plugin {

    @PluginMethod
    public void saveText(PluginCall call) {
        String filename = call.getString("filename", "selfsync-export.txt");
        String mimeType = call.getString("mimeType", "text/plain");
        String text = call.getString("text", "");
        save(call, filename, mimeType, text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @PluginMethod
    public void saveBase64(PluginCall call) {
        String filename = call.getString("filename", "selfsync-export.bin");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String base64 = call.getString("base64", "");
        try {
            save(call, filename, mimeType, Base64.decode(base64, Base64.DEFAULT));
        } catch (Exception error) {
            call.reject("Could not decode file", error);
        }
    }

    private void save(PluginCall call, String filename, String mimeType, byte[] bytes) {
        try {
            Uri uri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Downloads collection is unavailable");
                try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("Could not open Downloads output");
                    out.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, values, null, null);
            } else {
                File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloads.exists()) downloads.mkdirs();
                File file = new File(downloads, filename);
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes); }
                uri = Uri.fromFile(file);
            }

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("filename", filename);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not save file", error);
        }
    }
}
