package io.ionic.starter;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri uri = intent.getData();
        if (!Intent.ACTION_VIEW.equals(action) || uri == null) return;

        try {
            InputStream stream = getContentResolver().openInputStream(uri);
            if (stream == null) return;

            BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
            stream.close();

            // Guardar en archivo interno que Angular puede leer con Filesystem
            File out = new File(getFilesDir(), "pending_import.json");
            FileOutputStream fos = new FileOutputStream(out);
            fos.write(sb.toString().getBytes("UTF-8"));
            fos.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
