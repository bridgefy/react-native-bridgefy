//
//  RNBridgefy.m
//  AwesomeProject
//
//  Created by Danno on 6/15/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "RNBridgefy.h"
#import <BFTransmitter/BFTransmitter.h>

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/RCTBridge.h>

#ifndef BRIDGEFY_E
#define BRIDGEFY_E
#define kMessageReceived @"onMessageReceived"
#define kMessageSent @"onMessageSent"
#define kMessageReceivedError @"onMessageReceivedException"
#define kMessageSentError @"onMessageFailed"
#define kBroadcastReceived @"onBroadcastMessageReceived"
#define kStarted @"onStarted"
#define kStartedError @"onStartError"
#define kStopped @"onStopped"
#define kDeviceConnected @"onDeviceConnected"
#define kDeviceDisconnected @"onDeviceLost"
#define kDeviceConnectFailed @"onDeviceConnectFailed"
#define kDeviceDetected @"onDeviceDetected"
#define kDeviceUnavailable @"onDeviceUnavailable"
#define kEventOccurred @"onEventOccurred"
#endif

@interface RNBridgefy()<BFTransmitterDelegate> {
}

@property (nonatomic, retain) BFTransmitter * transmitter;
@property (nonatomic, retain) NSMutableDictionary * transitMessages;

@property (nonatomic,assign) BOOL hasListeners;

@property (nonatomic, retain) NSDictionary * bridgefyOptions;

@end

@implementation RNBridgefy

RCTPromiseResolveBlock startResolve;
RCTPromiseRejectBlock startReject;

- (dispatch_queue_t)methodQueue
{
    // main queue (blocking UI)
    // return dispatch_get_main_queue();

    // try, dedicated queue
    return dispatch_queue_create("com.facebook.React.BridgefyQueue", DISPATCH_QUEUE_SERIAL);
}

- (void)invalidate
{
    RCTLogTrace(@"invalidate");
    self.hasListeners = NO;
    [self.transmitter stop];
}

// Will be called when this module's first listener is added.
-(void)startObserving {
    RCTLogTrace(@"RCT startObserving");
    self.hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    RCTLogTrace(@"RCT stopObserving");
    self.hasListeners = NO;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[
            kMessageReceived,
            kMessageSent,
            kMessageReceivedError,
            kMessageSentError,
            kBroadcastReceived,
            kStarted,
            kStartedError,
            kStopped,
            kDeviceConnected,
            kDeviceConnectFailed,
            kDeviceDisconnected,
            kDeviceDetected,
            kDeviceUnavailable,
            kEventOccurred
        ];
}

RCT_REMAP_METHOD(init, startWithApiKey:(NSString *)apiKey resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {

    [BFTransmitter setLogLevel:BFLogLevelTrace]; // TODO remove

    if (self.transmitter != nil) {
        NSDictionary * dictionary = [self createClientDictionary];
        resolve(dictionary);
        return;
    }

    self.transmitter = [[BFTransmitter alloc] initWithApiKey:apiKey];

    if (self.transmitter != nil) {
        self.transmitter.delegate = self;
        NSDictionary * dictionary = [self createClientDictionary];
        resolve(dictionary);
        _transitMessages = [[NSMutableDictionary alloc] init];
    } else {
//        self.transmitter.delegate = self; // ?
        reject(@"initialization error", @"Bridgefy could not be initialized.",nil);
    }
}

RCT_EXPORT_METHOD(start:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    if ( self.transmitter == nil ) {
        RCTLogError(@"Bridgefy was not initialized, the operation won't continue.");
        return;
    }
    _bridgefyOptions = options;
    startResolve = resolve;
    startReject = reject;
    
//    NSLog( @"_bridgefyOptions = %@ ", _bridgefyOptions );
    
    if ([_bridgefyOptions[@"autoConnect"] intValue]== 0) {
        NSLog(@"Started Bridgefy in on-demand mode");
        // On-demand mode
        [self.transmitter startWithConnectionMode:BFTransmitterConnectionModeOnDemand];
    }
    else {
        NSLog(@"Started Bridgefy in automatic mode");
        // Automatic mode
        [self.transmitter startWithConnectionMode:BFTransmitterConnectionModeAutomatic];
    }
}

RCT_EXPORT_METHOD(stop) {
    [self.transmitter stop];
    if (self.hasListeners) {
        [self sendEventWithName:kStopped body:@{}];
    }
}

RCT_EXPORT_METHOD(sendMessage:(NSDictionary *) message) {
    BFSendingOption options = BFSendingOptionFullTransmission;
    if (_bridgefyOptions != nil && [_bridgefyOptions[@"encryption"] intValue]==1) {
        options = options | BFSendingOptionEncrypted;
    }
    [self sendMessage:message WithOptions:options];
}

RCT_EXPORT_METHOD(sendBroadcastMessage:(NSDictionary *) message) {
    BFSendingOption options = (BFSendingOptionBroadcastReceiver | BFSendingOptionMeshTransmission);
    [self sendMessage:message WithOptions:options];
}

- (void)sendMessage:(NSDictionary *)message WithOptions: (BFSendingOption)options {
    
    if (![self transmitterCanWork]) {
        return;
    }

    if (message[@"content"] == nil) {
        RCTLogError(@"The field 'content' is missing, the message won't be sent: %@", [message description]);
        return;
    }
    
    if (message[@"receiver_id"] == nil && (options & BFSendingOptionBroadcastReceiver) == 0) {
        RCTLogError(@"The field 'receiver_id' is missing, the message won't be sent: %@", [message description]);
        return;
    }
    
    NSError * error = nil;
    NSString * packetID = @"";
    
    if (message[@"dataLocalURI"] != nil && [message[@"dataLocalURI"] length] > 0) {
        NSString *filePath = message[@"dataLocalURI"];
        
        if([filePath hasPrefix:@"file://"]) {
            filePath = [filePath substringFromIndex:7];
        }
        
        NSError* readError = nil;
        NSData* data = [NSData dataWithContentsOfFile:filePath options:0 error:&readError];

        if (readError) {
            RCTLogError(@"Could not read file at %@, %@", filePath, readError);
        }
        
        NSMutableDictionary *mutDic = [message[@"content"] mutableCopy];
        
        mutDic[@"_fileName"] = [filePath lastPathComponent];

        packetID = [self.transmitter sendDictionary:mutDic
                                           withData:data
                                             toUser:message[@"receiver_id"]
                                            options:options
                                              error:&error];
    } else {
        packetID = [self.transmitter sendDictionary:message[@"content"]
                                             toUser:message[@"receiver_id"]
                                            options:options
                                              error:&error];
    }
    
    NSDictionary * createdMessage =
        [self createMessageDictionaryWithPayload:message[@"content"]
                                withDataLocalURI:nil
                                          sender:self.transmitter.currentUser
                                        receiver:message[@"receiver_id"]
                                            uuid:packetID];
    
    if (error == nil) {
        // Message began the sending process
        self.transitMessages[packetID] = createdMessage;
    } else {
        if (self.hasListeners) {
            // Error sending the message
            NSDictionary * errorDict = @{
                                         @"code": @(error.code),
                                         @"description": error.localizedDescription,
                                         @"origin": createdMessage
                                         };
            [self sendEventWithName:kMessageSentError body:errorDict];
        }
    }
    
}

RCT_EXPORT_METHOD(connectDevice:(NSDictionary *)dvc resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    
    if (dvc[@"userId"] != nil) {
        NSError * error = nil;
        
        [self.transmitter connectToUser:dvc[@"userId"] error:&error];
        
        if (error != nil) {
            reject(@"connect error", @"Error when connecting to device.",error);
        } else {
            resolve(@{});
        }
    }
}

RCT_EXPORT_METHOD(disconnectDevice:(NSDictionary *)dvc resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    
    if (dvc[@"userId"] != nil) {
        
        NSError * error = nil;
        
        [self.transmitter disconnectFromUser:dvc[@"userId"] error:&error];
        
        if (error != nil) {
            reject(@"disconnect error", @"Error when disconnecting from device.",error);
        } else {
            resolve(@{});
        }
    }
}

#pragma mark - Utils

-(BOOL)transmitterCanWork {
    if ( self.transmitter == nil ) {
        RCTLogError(@"Bridgefy was not initialized, the operation won't continue.");
        return NO;
    }
    
    if (!self.transmitter.isStarted) {
        RCTLogError(@"Bridgefy was not started, the operation won't continue.");
        return NO;
    }
    
    return YES;
}

- (NSDictionary *)createClientDictionary {
    return @{
             @"api_key": @"",
             @"bundle_id": @"",
//             @"public_key": self.transmitter.localPublicKey, // had to comment that because it  crashed
             @"secret_key": @"",
             @"userUuid": self.transmitter.currentUser,
             @"deviceProfile": @""
             };
}

- (NSDictionary *)createMessageDictionaryWithPayload:(NSDictionary *)payload
                                            withDataLocalURI:(NSString * _Nullable)dataLocalURI
                                              sender:(NSString *)sender
                                            receiver:(NSString *) receiver
                                                uuid:(NSString *)uuid {
    NSString * msgReceiver = receiver != nil? receiver : @"";
    NSString * msgUUID = uuid != nil? uuid : @"";
    
    NSMutableDictionary *ret = [[NSMutableDictionary alloc] init];
    ret[@"receiverId"] = msgReceiver;
    ret[@"senderId"] = sender;
    ret[@"uuid"] = msgUUID;
    ret[@"dateSent"] = [NSDate dateWithTimeIntervalSince1970:0];
    ret[@"content"] = payload;
    if (dataLocalURI != nil) {
        ret[@"dataLocalURI"] = dataLocalURI;
    }
    return ret;
}

#pragma mark - BFTransmitterDelegate

- (void)transmitter:(BFTransmitter *)transmitter meshDidAddPacket:(NSString *)packetID {
    if (self.transitMessages[packetID] != nil) {
        [self.transitMessages removeObjectForKey:packetID];
    }
}

- (void)transmitter:(BFTransmitter *)transmitter didReachDestinationForPacket:( NSString *)packetID {
    NSLog(@"didReachDestinationForPacket !!");
}

- (void)transmitter:(BFTransmitter *)transmitter meshDidStartProcessForPacket:( NSString *)packetID {
    if (self.transitMessages[packetID] != nil) {
        [self.transitMessages removeObjectForKey:packetID];
    }
}

- (void)transmitter:(BFTransmitter *)transmitter didSendDirectPacket:(NSString *)packetID {
    NSDictionary * message = self.transitMessages[packetID];
    if (message == nil) {
        return;
    }
    if (self.hasListeners) {
        [self sendEventWithName:kMessageSent body:message];
    }
    [self.transitMessages removeObjectForKey:packetID];
}

- (void)transmitter:(BFTransmitter *)transmitter didFailForPacket:(NSString *)packetID error:(NSError * _Nullable)error {
    NSDictionary * message = self.transitMessages[packetID];
    if (message == nil) {
        return;
    }
    if (self.hasListeners) {
        NSDictionary * errorDict = @{
                                     @"code": @(error.code),
                                     @"description": error.localizedDescription,
                                     @"origin": message
                                     };
        [self sendEventWithName:kMessageSentError body:errorDict];
    }
    [self.transitMessages removeObjectForKey:packetID];
}

- (void)transmitter:(BFTransmitter *)transmitter meshDidDiscardPackets:(NSArray<NSString *> *)packetIDs {
    //TODO: Implement
    NSLog(@"meshDidDiscardPackets !!");
    
}

- (void)transmitter:(BFTransmitter *)transmitter meshDidRejectPacketBySize:(NSString *)packetID {
    //TODO: Implement
    NSLog(@"meshDidRejectPacketBySize !!");
    
}

- (void)transmitter:(BFTransmitter *)transmitter
didReceiveDictionary:(NSDictionary<NSString *, id> * _Nullable) dictionary
           withData:(NSData * _Nullable)data
           fromUser:(NSString *)user
           packetID:(NSString *)packetID
          broadcast:(BOOL)broadcast
               mesh:(BOOL)mesh {
    NSDictionary * message;
    NSString * _Nullable dataLocalURI = nil;
    if (self.hasListeners) {
        if (broadcast) {
            message = [self createMessageDictionaryWithPayload:dictionary
                                              withDataLocalURI:nil
                                                        sender:user
                                                      receiver:nil
                                                          uuid:packetID];
            [self sendEventWithName:kBroadcastReceived body:message];
        } else {
            
            if (data != nil) {
                NSError *writeError;
//                NSLog(@"dic  = %@ ",dictionary);
                NSString *filename = dictionary[@"_fileName"];

                NSURL *folder = [[NSFileManager defaultManager] URLForDirectory:NSApplicationSupportDirectory inDomain:NSUserDomainMask appropriateForURL:nil create:true error:&writeError];
                if (!folder) {
                    RCTLogError(@"%s: %@", __FUNCTION__, writeError);
                    NSDictionary * errorDict = @{
                         @"sender": user,
                         @"message": dictionary,
                         @"description": writeError.description,
                         @"code": @(writeError.code)
                     };
                    [self sendEventWithName:kMessageReceivedError body:errorDict];
                    return;
                }

                NSURL *fileURL = [folder URLByAppendingPathComponent:filename];
                BOOL success = [data writeToURL:fileURL options:NSDataWritingAtomic error:&writeError];
                if (!success) {
                    RCTLogError(@"%s: %@", __FUNCTION__, writeError);
                    NSDictionary * errorDict = @{
                         @"sender": user,
                         @"message": dictionary,
                         @"description": writeError.description,
                         @"code": @(writeError.code)
                     };
                    [self sendEventWithName:kMessageReceivedError body:errorDict];
                    return;
                }

                dataLocalURI = [fileURL path];
            }
            message = [self createMessageDictionaryWithPayload:dictionary
                                              withDataLocalURI:dataLocalURI
                                                        sender:user
                                                      receiver:transmitter.currentUser
                                                          uuid:packetID];
            
            [self sendEventWithName:kMessageReceived body:message];
        }
    }
}

- (void)transmitter:(BFTransmitter *)transmitter didDetectConnectionWithUser:(NSString *)user {
    if (self.hasListeners) {
        NSDictionary * userDict = @{
                                    @"userId": user
                                    };
        [self sendEventWithName:kDeviceConnected body:userDict];
    }
    
}


- (void)transmitter:(BFTransmitter *)transmitter didDetectSecureConnectionWithUser:(NSString *)user {
    if (self.hasListeners) {
        NSDictionary * userDict = @{
                                    @"userId": user
                                    };
        [self sendEventWithName:kDeviceConnected body:userDict];
    }
}

- (void)transmitter:(BFTransmitter *)transmitter didDetectDisconnectionWithUser:(NSString *)user {
    if (self.hasListeners) {
        NSDictionary * userDict = @{
                                    @"userId": user
                                    };
        [self sendEventWithName:kDeviceDisconnected body:userDict];
    }
}

- (void)transmitter:(BFTransmitter *)transmitter didFailAtStartWithError:(NSError *)error {
    if (self.hasListeners) {
        NSDictionary * errorDict = @{
                                     @"code": @(error.code),
                                     @"message": error.localizedDescription
                                     };
        [self sendEventWithName:kStartedError body:errorDict];
    }

    if (startReject != nil) {
        startReject(kStartedError,error.localizedDescription, error);
    }
}

- (void)transmitter:(BFTransmitter *)transmitter didOccurEvent:(BFEvent)event description:(NSString *)description {
    NSLog(@"didOccurEvent %lu",event);
    if (event == BFEventStartFinished ) {
        if (self.hasListeners) {
            [self sendEventWithName:kStarted body:@{}]; // should we keep it?
        }

        if (startResolve != nil) {
            startResolve(@{});
        }

    } else if (self.hasListeners) {
        NSDictionary * eventDict = @{
                                     @"code": @(event),
                                     @"description": description
                                     };
        [self sendEventWithName:kEventOccurred body:eventDict];
    }
}

- (BOOL)transmitter:(BFTransmitter *)transmitter shouldConnectSecurelyWithUser:(NSString *)user {
    if (_bridgefyOptions != nil && [_bridgefyOptions[@"encryption"] intValue]==1) {
        return YES;
    }
     return NO;
}

- (void)transmitter:(nonnull BFTransmitter *)transmitter didDetectNearbyUser:(nonnull NSString *)user {
    if (self.hasListeners) {
        NSDictionary * userDict = @{
            @"userId": user
        };
        [self sendEventWithName:kDeviceDetected body:userDict];
    }
}


- (void)transmitter:(nonnull BFTransmitter *)transmitter didFailConnectingToUser:(nonnull NSString *)user error:(nonnull NSError *)error {
    if (self.hasListeners) {
        NSDictionary * userDict = @{
            @"userId": user
        };
        [self sendEventWithName:kDeviceConnectFailed body:userDict];
    }
}


- (void)transmitter:(nonnull BFTransmitter *)transmitter userIsNotAvailable:(nonnull NSString *)user {
    if (self.hasListeners) {
        NSDictionary * userDict = @{
            @"userId": user
        };
        [self sendEventWithName:kDeviceUnavailable body:userDict];
    }
}

- (void)transmitterNeedsInterfaceActivation:(BFTransmitter *)transmitter {
    NSLog(@"transmitterNeedsInterfaceActivation");
    //TODO: Implement?
}

- (void)transmitterDidDetectAnotherInterfaceStarted:(BFTransmitter *)transmitter {
    NSLog(@"transmitterDidDetectAnotherInterfaceStarted");
    //TODO: Implement?
}


@end

