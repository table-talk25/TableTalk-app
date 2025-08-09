package com.TableTalkApp.tabletalk;

import android.app.Application;
import com.google.firebase.FirebaseApp;

public class TableTalkApplication extends Application {
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Inizializza Firebase all'avvio dell'applicazione
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this);
                android.util.Log.d("TableTalk", "Firebase initialized successfully");
            } else {
                android.util.Log.d("TableTalk", "Firebase already initialized");
            }
        } catch (Exception e) {
            android.util.Log.e("TableTalk", "Failed to initialize Firebase: " + e.getMessage());
        }
    }
}