package com.selfsync.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AzanNativePlugin.class);
        registerPlugin(NativeFileSavePlugin.class);
        registerPlugin(QuranMediaNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
