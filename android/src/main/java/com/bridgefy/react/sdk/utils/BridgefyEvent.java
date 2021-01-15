package com.bridgefy.react.sdk.utils;

/**
 * @author kekoyde on 10/24/18.
 */
public enum BridgefyEvent {
    BFEventStartWaiting(0),
    BFEventStartFinished(1),
    BFEventInternetNeeded(2),
    BFEventAlreadyStarted(3),
    BFEventOnlineWarning(4),
    BFEventOnlineError(5),
    BFEventNearbyPeerDetected(6),
    BFEventBluetoothDisabled(7),
    BFEventWifiDisabled(8);

    private final int value;

    BridgefyEvent(final int newValue) {
        value = newValue;
    }

    public int getValue() { return value; }
}
