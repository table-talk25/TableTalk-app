package com.TableTalkApp.tabletalk;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Inizializza Firebase
        FirebaseApp.initializeApp(this);
    }
    
    // Esempio: Override per gestire permessi personalizzati
    /*
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        // Gestisci qui permessi specifici per TableTalk
        // Puoi utilizzare costanti personalizzate invece di PluginRequestCodes
    }
    */
}
