
package com.bridgefy.react.sdk;

import com.bridgefy.react.sdk.framework.BridgefySDK;
import com.bridgefy.react.sdk.utils.Utils;
// import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import com.facebook.react.bridge.Promise;

import android.util.Log;

import org.json.JSONException;

public class BridgefyModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;
  private BridgefySDK bridgefySDK;

  private static final String TAG = "BridgefyModule";

  public BridgefyModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    bridgefySDK = new BridgefySDK(reactContext);
  }

  @Override
  public String getName() {
    return "RNBridgefy";
  }

  @ReactMethod
  public void init(String apiKey, Promise promise)
  {
    bridgefySDK.initialize(apiKey, promise);
  }

  @ReactMethod
  public void start(ReadableMap options, Promise promise)
  {
    bridgefySDK.startSDK(options, promise);
  }

  @ReactMethod
  public void stop()
  {
    bridgefySDK.stopSDK();
  }

  @ReactMethod
  public void sendMessage(ReadableMap message)
  {
    bridgefySDK.sendMessage(Utils.getMessageFromMap(this.reactContext,message));
  }

  @ReactMethod
  public void sendBroadcastMessage(ReadableMap message)
  {
    try {
      bridgefySDK.sendBroadcastMessage(Utils.getBroadcastMessageFromMap(this.reactContext,message));
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  @ReactMethod
  public void connectDevice(ReadableMap dvc)
  {
    if (dvc.hasKey("userId")) {
      bridgefySDK.connectDevice(dvc.getString("userId"));
    }
    else {
      Log.e(TAG, "Expected value userId in param");
    }
  }

  @ReactMethod
  public void disconnectDevice(ReadableMap dvc)
  {
    if (dvc.hasKey("userId")) {
      bridgefySDK.disconnectDevice(dvc.getString("userId"));
    }
    else {
      Log.e(TAG, "Expected value userId in param");
    }
  }
}