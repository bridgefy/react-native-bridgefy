import {
    EventSubscriptionVendor,
    EmitterSubscription,
    NativeEventEmitter
} from 'react-native';

export interface BridgefyOptions {
    autoConnect?: boolean,
    encryption?: boolean,
    // Android only
    engineProfile?: "BFConfigProfileDefault" | "BFConfigProfileHighDensityNetwork" | 
        "BFConfigProfileSparseNetwork" | "BFConfigProfileLongReach" | 
        "BFConfigProfileShortReach" | "BFConfigProfileNoFowarding",
    // Android only
    energyProfile?: "ENERGY_SAVER" | "BALANCED" | "HIGH_PERFORMANCE",
}

export interface MessageDataProgressEvent {
    progress: number,
    fullSize: number,
    percentageProgress: number,
}

export interface MessageFailedEvent<T> {
    code: number,
    description: string,
    origin: BridgefyMessage<T>
}

export interface MessageReceivedExceptionEvent<T> {
    sender: string,
    message: BridgefyMessage<T>
    description: string,
    code: number
}

export interface StartErrorEvent {
    code: number,
    message: string
}

export interface StoppedEvent {}

export interface DeviceConnectedEvent {
    userId: string,
}

export interface DeviceConnectFailedEvent {
    userId: string,
}

export interface DeviceLostEvent {
    userId: string,
}

export interface DeviceDetectedEvent {
    userId: string,
}

export interface DeviceUnavailableEvent {
    userId: string,
}

export interface EventOccurredEvent {
    code: number,
    description: string
}

export interface BridgefyMessage<T> {
    content: T;
    receiver_id?: string;
    senderId?: string;
    uuid?: string;
    dateSent?: number;
    dataLocalURI?: string;
}

export interface BridgefyClient {
    api_key: string;
    bundle_id: string;
    public_key: string;
    secret_key: string;
    userUuid: string;
    deviceProfile: string;
}

export interface BridgefyModule {
    init(apiKey: string): Promise<BridgefyClient>;
    start(options:BridgefyOptions): Promise<{}>;
    stop(): void;
    sendMessage<T>(msg: BridgefyMessage<T>): void;
    sendBroadcastMessage<T>(msg: BridgefyMessage<T>): void
}

export type BrdgNativeEventEmitter = {
    addListener(event: 'onMessageReceived', callback: (data: BridgefyMessage<any>)=>void):EmitterSubscription;
    addListener(event: 'onBroadcastMessageReceived', callback: (data: BridgefyMessage<any>)=>void):EmitterSubscription;
    addListener(event: 'onMessageFailed', callback: (data: MessageFailedEvent<any>)=>void):EmitterSubscription;
    addListener(event: 'onMessageDataProgress', callback: (data: MessageDataProgressEvent)=>void):EmitterSubscription;
    addListener(event: 'onMessageSent', callback: (data: BridgefyMessage<any>)=>void):EmitterSubscription;
    addListener(event: 'onMessageReceivedException', callback: (data: MessageReceivedExceptionEvent<any>)=>void):EmitterSubscription;
    addListener(event: 'onStarted', callback: (data: BridgefyClient)=>void):EmitterSubscription;
    addListener(event: 'onStartError', callback: (data: StartErrorEvent)=>void):EmitterSubscription;
    addListener(event: 'onStopped', callback: (data: StoppedEvent)=>void):EmitterSubscription;
    addListener(event: 'onDeviceConnected', callback: (data: DeviceConnectedEvent)=>void):EmitterSubscription;
    addListener(event: 'onDeviceConnectFailed', callback: (data: DeviceConnectFailedEvent)=>void):EmitterSubscription;
    addListener(event: 'onDeviceLost', callback: (data: DeviceLostEvent)=>void):EmitterSubscription;
    addListener(event: 'onEventOccurred', callback: (data: EventOccurredEvent)=>void):EmitterSubscription;
    addListener(event: 'onDeviceDetected', callback: (data: DeviceDetectedEvent)=>void):EmitterSubscription;
    addListener(event: 'onDeviceUnavailable', callback: (data: DeviceUnavailableEvent)=>void):EmitterSubscription;
} & NativeEventEmitter;

export declare function init(apiKey: string): Promise<BridgefyClient>;
export declare function start(options?:BridgefyOptions): Promise<{}>;
export declare function stop(): void;
export declare function sendMessage<T>(msg: BridgefyMessage<T>, dataUri?:string): void;
export declare function sendBroadcastMessage<T>(msg: BridgefyMessage<T>): void;
export declare function connectDevice(dvc: {userId:String}): Promise<{}>;
export declare function disconnectDevice(dvc: {userId:String}): Promise<{}>;

declare const _default: {
    init: typeof init;
    start: typeof start;
    stop: typeof stop;
    sendMessage: typeof sendMessage;
    sendBroadcastMessage: typeof sendBroadcastMessage;
    connectDevice: typeof connectDevice;
    disconnectDevice: typeof disconnectDevice;
} & EventSubscriptionVendor;

export default _default;
