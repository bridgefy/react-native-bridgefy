package com.bridgefy.react.sdk.framework;

import com.bridgefy.react.sdk.utils.BridgefyEvent;
import com.bridgefy.react.sdk.utils.Utils;
import com.bridgefy.sdk.client.Device;
import com.bridgefy.sdk.client.Session;
import com.bridgefy.sdk.client.StateListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Promise;

import android.util.Log;

import java.util.Map;
import java.util.HashMap;

/**
 * @author kekoyde on 6/9/17.
 */

class BridgefyDevices extends StateListener {
    private ReactContext reactContext;
    private Promise startPromise;

    private static final String TAG = "BridgefyDevices";

    public Map<String, Device> devices;

    public BridgefyDevices(ReactContext reactContext, Promise promise) {
        Log.v(TAG, "new BridgefyDevices");
        this.reactContext = reactContext;
        this.startPromise = promise;
        this.devices = new HashMap();
    }

    @Override
    public void onStarted() {
        Log.v(TAG, "onStarted");
        Utils.onEventOccurred(reactContext, BridgefyEvent.BFEventStartFinished.getValue(), "The Bridgefy was started.");
        Utils.sendEvent(reactContext,"onStarted", Arguments.createMap()); // should we keep it?
        if (this.startPromise != null) {
            this.startPromise.resolve(null);
        }
    }

    @Override
    public void onStartError(String message, int errorCode) {
        Log.v(TAG, "onStartError");
        // should we keept that?
        WritableMap writableMap = Arguments.createMap();
        writableMap.putMap("message", Arguments.createMap());
        writableMap.putString("description", message);
        writableMap.putInt("code", errorCode);
        Utils.sendEvent(reactContext, "onStartError", writableMap);
        // ??

        if (this.startPromise != null) {
            this.startPromise.reject(String.valueOf(errorCode),message);
        }
    }

    @Override
    public void onStopped() {
        Log.v(TAG, "onStopped");
        Utils.sendEvent(reactContext,"onStopped", Arguments.createMap());
    }

    @Override
    public void onDeviceConnected(Device device, Session session) {
        Log.v(TAG, "onDeviceConnected");
        WritableMap writableMap = Utils.getMapForDevice(device);
        writableMap.putString("publicKey", session.getPublicKey());
        Utils.sendEvent(reactContext,"onDeviceConnected", writableMap);
        Utils.onEventOccurred(reactContext, BridgefyEvent.BFEventNearbyPeerDetected.getValue(), "The Bridgefy was started.");
    }

    @Override
    public void onDeviceLost(Device device) {
        Log.v(TAG, "onDeviceLost");
        Utils.sendEvent(reactContext,"onDeviceLost", Utils.getMapForDevice(device));
    }

    @Override
    public void onDeviceDetected(Device device) {
        Log.v(TAG, "onDeviceDetected");
        Utils.sendEvent(reactContext,"onDeviceDetected", Utils.getMapForDevice(device));
        devices.put(device.getUserId(),device);
    }

    @Override
    public void onDeviceUnavailable(Device device) {
        Log.v(TAG, "onDeviceUnavailable");
        Utils.sendEvent(reactContext,"onDeviceUnavailable", Utils.getMapForDevice(device));
        devices.remove(device.getUserId());
    }
}
