package com.bridgefy.react.sdk.framework;

import com.bridgefy.react.sdk.utils.Utils;

import com.bridgefy.sdk.client.Message;
import com.bridgefy.sdk.client.MessageListener;
import com.bridgefy.sdk.framework.exceptions.MessageException;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import java.util.UUID;

import android.util.Log;

/**
 * @author kekoyde on 6/9/17.
 */

class BridgefyMessages extends MessageListener {
    private ReactContext reactContext;

    private static final String TAG = "BridgefyMessages";

    public BridgefyMessages(ReactContext reactContext) {
        super();
        this.reactContext = reactContext;
    }

    @Override
    public void onMessageReceived(Message message) {
        byte[] data = message.getData();
        WritableMap msg = Utils.getMapForMessage(message);
        if (data != null && data.length>0) {
            String fileName = msg.getMap("content").getString("_fileName");
            String dpath = reactContext.getApplicationContext()
                                .getFilesDir().getAbsolutePath()+File.separator+"Bridgefy";
            File directory = new File(dpath);
            if (!directory.exists()){
                directory.mkdir();
            }
            String path = dpath+File.separator+fileName;

            try (FileOutputStream fos = new FileOutputStream(path)) {
                fos.write(data);
                fos.close();

                msg.putString("dataLocalURI", path);
            }
            catch (IOException e) {
                Log.e(TAG, "Saving received message data failed with ", e);
            }
        }
        Utils.sendEvent(reactContext,"onMessageReceived", msg);
    }

    @Override
    public void onMessageReceivedException(String sender, MessageException e) {
        WritableMap writableMap = Arguments.createMap();
        writableMap.putString("sender", sender);
        writableMap.putMap("message", Arguments.createMap());
        writableMap.putString("description", "Failed to get the original message: [" + e.getMessage()+"]");
        writableMap.putInt("code", 100);
        Utils.sendEvent(reactContext,"onMessageReceivedException", writableMap);
    }

    @Override
    public void onMessageFailed(Message message, MessageException e) {
        WritableMap writableMap = Arguments.createMap();
        writableMap.putMap("message", Utils.getMapForMessage(message));
        writableMap.putString("description", e.getMessage());
        writableMap.putInt("code", 101);
        Utils.sendEvent(reactContext,"onMessageFailed", writableMap);
    }

    @Override
    public void onBroadcastMessageReceived(Message message) {
        Utils.sendEvent(reactContext,"onBroadcastMessageReceived", Utils.getMapForMessage(message));
    }

    @Override
    public void onMessageSent(String messageId) {
        WritableMap writableMap = Arguments.createMap();
        writableMap.putString("uuid", messageId);
        Utils.sendEvent(reactContext, "onMessageSent", writableMap);
    }

    @Override
    public void onMessageDataProgress(UUID message, long progress, long fullSize) {
        int percentageProgress = (int) ((progress * 100) / fullSize);
        WritableMap writableMap = Arguments.createMap();
        writableMap.putDouble("progress", progress);
        writableMap.putDouble("fullSize", fullSize);
        writableMap.putDouble("percentageProgress", percentageProgress);
        Utils.sendEvent(reactContext, "onMessageDataProgress", writableMap);
    }
}
