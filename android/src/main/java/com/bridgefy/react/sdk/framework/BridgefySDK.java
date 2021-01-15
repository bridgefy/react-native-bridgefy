package com.bridgefy.react.sdk.framework;

import com.bridgefy.react.sdk.utils.BridgefyEvent;
import com.bridgefy.react.sdk.utils.Utils;
import com.bridgefy.sdk.BuildConfig;
import com.bridgefy.sdk.client.Bridgefy;
import com.bridgefy.sdk.client.BridgefyClient;
import com.bridgefy.sdk.client.Message;
import com.bridgefy.sdk.client.RegistrationListener;
import com.bridgefy.sdk.client.Config;
import com.bridgefy.sdk.client.BFEngineProfile;
import com.bridgefy.sdk.client.BFEnergyProfile;
// import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.bridgefy.sdk.client.Device;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import android.util.Log;

/**
 * @author kekoyde on 6/9/17.
 */

public class BridgefySDK extends RegistrationListener {

    private ReactContext reactContext;
    private Promise initializePromise;

    private BridgefyDevices brdgDevices;

    private static final String TAG = "BridgefySDK";

    public BridgefySDK(ReactContext reactContext){
        this.reactContext = reactContext;
    }

    public void sendMessage(Message message)
    {
        if (message.getData()!=null &&  message.getData().length>2000000) {
            WritableMap writableMap = Arguments.createMap();
            writableMap.putMap("message", Utils.getMapForMessage(message));
            writableMap.putString("description", "File size cannot exceed 2MB");
            writableMap.putInt("code", 101);
            Utils.sendEvent(reactContext,"onMessageFailed",writableMap);
        }
        else {
            Bridgefy.sendMessage(message);
        }
    }

    public void sendBroadcastMessage(Message message)
    {
        Bridgefy.sendBroadcastMessage(message);
    }

    public void connectDevice(String userId)
    {
        if (brdgDevices != null) {
            Device dvc = brdgDevices.devices.get(userId);
            Bridgefy.getInstance().getBridgefyCore().connectDevice(dvc);
        }
    }

    public void disconnectDevice(String userId)
    {
        if (brdgDevices != null) {
            Device dvc = brdgDevices.devices.get(userId);
            Bridgefy.getInstance().getBridgefyCore().disconnectDevice(dvc);
        }
    }

    public void initialize(String apiKey, Promise promise)
    {
        this.initializePromise = promise;
        // this.errorRegisterCallback = error;
        // this.successRegisterCallback = success;
        Utils.onEventOccurred(reactContext, BridgefyEvent.BFEventStartWaiting.getValue(), "Waiting for online validation to start the transmitter.");
        Bridgefy.initialize(reactContext.getApplicationContext(), apiKey, this);
    }

    public BFEngineProfile jsToNativeEngineProfile(String v)
    {
        switch (v) {
            case "BFConfigProfileDefault":
                return BFEngineProfile.BFConfigProfileDefault;
            case "BFConfigProfileHighDensityNetwork":
                return BFEngineProfile.BFConfigProfileHighDensityNetwork;
            case "BFConfigProfileSparseNetwork":
                return BFEngineProfile.BFConfigProfileSparseNetwork;
            case "BFConfigProfileLongReach":
                return BFEngineProfile.BFConfigProfileLongReach;
            case "BFConfigProfileShortReach":
                return BFEngineProfile.BFConfigProfileShortReach;
            case "BFConfigProfileNoFowarding":
                return BFEngineProfile.BFConfigProfileNoFowarding;
            default:
                Log.e(TAG, "Unexpected value for engineProfile: " + v);
                return BFEngineProfile.BFConfigProfileDefault;
        }
    }

    public BFEnergyProfile jsToNativeEnergyProfile(String v)
    {
        switch (v) {
            case "ENERGY_SAVER":
                return BFEnergyProfile.ENERGY_SAVER;
            case "BALANCED":
                return BFEnergyProfile.BALANCED;
            case "HIGH_PERFORMANCE":
                return BFEnergyProfile.HIGH_PERFORMANCE;
            default:
                Log.e(TAG, "Unexpected value for energyProfile: " + v);
                return BFEnergyProfile.BALANCED;
        }
    }

    public void startSDK(ReadableMap options, Promise promise){
        Config.Builder builder = new Config.Builder();
        
        if (options.hasKey("autoConnect")) {
            builder.setAutoConnect(options.getBoolean("autoConnect"));
        }
        if (options.hasKey("engineProfile")) {
            builder.setEngineProfile(jsToNativeEngineProfile(options.getString("engineProfile")));
        }
        if (options.hasKey("energyProfile")) {
            builder.setEnergyProfile(jsToNativeEnergyProfile(options.getString("energyProfile")));
        }
        if (options.hasKey("encryption")) {
            builder.setEncryption(options.getBoolean("encryption"));
        }
        brdgDevices = new BridgefyDevices(reactContext, promise);
        Bridgefy.start(
            new BridgefyMessages(reactContext),
            brdgDevices,
            builder.build()
        );
    }

    public void stopSDK() {
        Bridgefy.stop();
    }

    @Override
    public void onRegistrationSuccessful(BridgefyClient bridgefyClient) {
        // successRegisterCallback.invoke(Utils.getBridgefyClient(bridgefyClient));
        this.initializePromise.resolve(Utils.getBridgefyClient(bridgefyClient));
    }

    @Override
    public void onRegistrationFailed(int errorCode, String message) {
        // errorRegisterCallback.invoke(errorCode, message);
        this.initializePromise.reject(String.valueOf(errorCode), message);
    }
}
