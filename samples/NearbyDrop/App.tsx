/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    NativeEventEmitter,
    Platform,
    PermissionsAndroid,
    Alert,
    ActivityIndicator
} from 'react-native';

import FileViewer from 'react-native-file-viewer';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';

import Icon from 'react-native-vector-icons/Ionicons';

import prompt from 'react-native-prompt-android';

import RNBridgefy, { BrdgNativeEventEmitter } from 'react-native-bridgefy-sdk';
import { BridgefyMessage, BridgefyClient, MessageFailedEvent, MessageReceivedExceptionEvent, 
    StartErrorEvent, StoppedEvent, DeviceConnectedEvent, DeviceLostEvent, DeviceDetectedEvent,
    DeviceUnavailableEvent } from 'react-native-bridgefy-sdk';
import { MessageDataProgressEvent } from '../react-native-bridgefy-sdk/typings';

interface AppMsg {
    msg: string
}

const BRDG_LICENSE_KEY:string = "COPY YOU LICENSE KEY HERE";

const bridgefyEmitter:BrdgNativeEventEmitter = new NativeEventEmitter(RNBridgefy);


var receivedMessages: Array<BridgefyMessage<AppMsg>>;
var setReceivedMessages: React.Dispatch<React.SetStateAction<Array<BridgefyMessage<AppMsg>>>>;

var peers: Array<{userId:string}>;
var setPeers: React.Dispatch<React.SetStateAction<Array<{userId:string}>>>;

var connectingPeer: {userId:string};
var setConnectingPeer: React.Dispatch<React.SetStateAction<{userId:string}>>;

var connectedPeer: {userId:string};
var setConnectedPeer: React.Dispatch<React.SetStateAction<{userId:string}>>;

var isLoading: boolean;
var setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

var isSending: boolean;
var setIsSending: React.Dispatch<React.SetStateAction<boolean>>;

var connected: boolean;
var setConnected: React.Dispatch<React.SetStateAction<boolean>>;

var msgText: string;
var setMsgText: React.Dispatch<React.SetStateAction<string>>;

var msgFile: DocumentPickerResponse;
var setMsgFile: React.Dispatch<React.SetStateAction<DocumentPickerResponse>>;

var sendProgress: number;
var setSendProgress: React.Dispatch<React.SetStateAction<number>>;

const App = ()=>{

    const connectedState = useState(false);
    connected = connectedState[0]; // means Bridgefy started
    setConnected = connectedState[1];

    const receivedMessagesState = useState<Array<BridgefyMessage<AppMsg>>>([]);
    receivedMessages = receivedMessagesState[0];
    setReceivedMessages = receivedMessagesState[1];
    
    const peersState = useState<Array<{userId:string}>>([]);
    peers = peersState[0];
    setPeers = peersState[1];
    
    const connectingPeerState = useState<{userId:string}>(null);
    connectingPeer = connectingPeerState[0];
    setConnectingPeer = connectingPeerState[1];
    
    const connectedPeerState = useState<{userId:string}>(null);
    connectedPeer = connectedPeerState[0];
    setConnectedPeer = connectedPeerState[1];
    
    const isLoadingState = useState<boolean>(false);
    isLoading = isLoadingState[0];
    setIsLoading = isLoadingState[1];
    
    const isSendingState = useState<boolean>(false);
    isSending = isSendingState[0];
    setIsSending = isSendingState[1];
    
    const msgTextState = useState(null);
    msgText = msgTextState[0];
    setMsgText = msgTextState[1];
    
    const msgFileState = useState(null);
    msgFile = msgFileState[0];
    setMsgFile = msgFileState[1];
    
    const sendProgressState = useState(0);
    sendProgress = sendProgressState[0];
    setSendProgress = sendProgressState[1];

    let clearListeners = () => {
        bridgefyEmitter.removeAllListeners('onMessageReceived');
        bridgefyEmitter.removeAllListeners('onMessageFailed');
        bridgefyEmitter.removeAllListeners('onMessageSent');
        if (Platform.OS=="android") {
            bridgefyEmitter.removeAllListeners('onMessageDataProgress');
        }
        bridgefyEmitter.removeAllListeners('onMessageReceivedException');
        bridgefyEmitter.removeAllListeners('onStarted');
        bridgefyEmitter.removeAllListeners('onStartError');
        bridgefyEmitter.removeAllListeners('onStopped');
        bridgefyEmitter.removeAllListeners('onDeviceConnected');
        bridgefyEmitter.removeAllListeners('onDeviceLost');
        bridgefyEmitter.removeAllListeners('onDeviceDetected');
        bridgefyEmitter.removeAllListeners('onDeviceUnavailable');
        bridgefyEmitter.removeAllListeners('onEventOccurred');
    }
    let initListeners = () => {
        console.log('INITIATING THE BRDG RN LISTENERS');
        bridgefyEmitter.addListener('onMessageReceived', (message: BridgefyMessage<AppMsg>)=> {
          console.log('onMessageReceived: '+ JSON.stringify(message));
          setReceivedMessages(receivedMessages.concat([message]));
        });
        bridgefyEmitter.addListener('onMessageFailed', (evt: MessageFailedEvent<AppMsg>)=> {
            console.error('onMessageFailed: '+ evt);
            setIsSending(false);
        });
        bridgefyEmitter.addListener('onMessageSent', (message: BridgefyMessage<AppMsg>)=> {
            console.log('onMessageSent: '+ JSON.stringify(message));
            setIsSending(false);
        });
        if (Platform.OS=="android") {
            bridgefyEmitter.addListener('onMessageDataProgress', (evt: MessageDataProgressEvent)=> {
                console.log('onMessageDataProgress: '+ evt.percentageProgress);
                setSendProgress(evt.percentageProgress);
            });
        }
        bridgefyEmitter.addListener('onMessageReceivedException', (evt: MessageReceivedExceptionEvent<AppMsg>)=> {
            console.log('onMessageReceivedException: '+ evt);
        });
        bridgefyEmitter.addListener('onStarted', (device: BridgefyClient)=> {
            console.log('onStarted');
            setConnected(true);
        });
        bridgefyEmitter.addListener('onStartError', (evt: StartErrorEvent)=> {
            console.error('onStartError: ', evt);
        });
        bridgefyEmitter.addListener('onStopped', (evt: StoppedEvent)=> {
            console.log('onStopped');
            setConnected(false);
        });
        
        bridgefyEmitter.addListener('onDeviceConnected', (evt: DeviceConnectedEvent)=> {
            console.log('onDeviceConnected: ' + JSON.stringify(evt));
            setConnectedPeer({ userId: evt.userId });
            setConnectingPeer(null);
        });
        bridgefyEmitter.addListener('onDeviceLost', (evt: DeviceLostEvent)=> {
            console.log('onDeviceLost: ' + evt);
            if (connectedPeer!=null&&connectedPeer.userId==evt.userId) {
                setConnectedPeer(null);
            }
            if (connectingPeer!=null&&connectingPeer.userId==evt.userId) {
                setConnectingPeer(null);
            }
        });
        bridgefyEmitter.addListener('onDeviceDetected', (evt: DeviceDetectedEvent)=> {
            console.log('onDeviceDetected: ' + JSON.stringify(evt));
            setPeers(peers.filter((p)=>p.userId!=evt.userId).concat([evt]));
        });
        bridgefyEmitter.addListener('onDeviceUnavailable', (evt: DeviceUnavailableEvent)=> {
            console.log('onDeviceUnavailable: ' + evt);
            setPeers(peers.filter((p)=>p.userId!=evt.userId));
        });
    }
    
    let initBrdg = () => {
        function doInitBrdg() {
          RNBridgefy.init(BRDG_LICENSE_KEY)
            .then((brdgClient: BridgefyClient)=>{
                console.log("Brdg client = ",brdgClient);
                RNBridgefy.start({
                    autoConnect: false,
                    engineProfile: "BFConfigProfileDefault",
                    energyProfile: "HIGH_PERFORMANCE",
                    encryption: true
                });
            })
            .catch((e:Error)=>{
                console.error(e);
            });
        }
        if (Platform.OS=="android") {
            PermissionsAndroid.requestMultiple(
                [ PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                  PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION ])
                .then((result) => {
                    if (result['android.permission.ACCESS_COARSE_LOCATION']||
                        result['android.permission.ACCESS_FINE_LOCATION'] ) {
                        doInitBrdg();
                    }
                    else { 
                        console.error('Could not get required permissions to start Bridgefy');
                    }
                })
                .catch((e:Error)=>{
                    console.error(`Could not get required permissions to start Bridgefy: ${e.message}`);
                });
        }
        else {
          doInitBrdg();
        }
    }

    let connectTo = (user) => {
        if (connectingPeer != null) {
            return;
        }
        setConnectingPeer(user);
        RNBridgefy.connectDevice(user);
    }
    
    let promptMsg = () => {
        prompt(
            'Compose a message',
            'Add a message to you file to send',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    // style: 'cancel'
                },
                {
                    text: 'OK',
                    onPress: (msg) => {
                        setMsgText(msg);
                    }
                },
            ],
            {
                // type: 'secure-text',
                cancelable: false,
                // defaultValue: 'test',
                placeholder: 'Message...'
            }
        );
    }
    let pickFile = () => {
        DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] })
            .then((doc)=>{
                console.log('picked file: ',doc);
                setMsgFile(doc);
            });
    }

    let sendMsg = (receiver_id, msg, dataUri) => {
        setSendProgress(0);
        setIsSending(true);
        RNBridgefy.sendMessage({
            content: { msg: msg },
            receiver_id: receiver_id,
            dataLocalURI: dataUri
        });
    }

    let nextMessage = () => {
        setReceivedMessages(receivedMessages.slice(1));
    }

    useEffect(() => {

        initListeners();
        initBrdg();
          
        return function cleanup() {
    
          if (connected) {
            RNBridgefy.stop();
          }
          clearListeners();
        };
    }, []);

    let state = {receivedMessages,peers,connectingPeer,connectedPeer,
        isLoading,connected,msgText,msgFile,isSending,sendProgress};

    return (
    <>
        <SafeAreaView style={{flex:1}}>
            <ScrollView>
                { !state.connected && (
                    <NotConnectedScreen {...state} />
                )}
                { state.receivedMessages.length>0 && (
                    <BrowseMessageScreen {...state} nextMessage={nextMessage} />
                )}
                { state.connectedPeer!=null && (
                    <ShareScreen {...state} promptMsg={promptMsg} pickFile={pickFile} sendMsg={sendMsg} />
                )}
                { state.connected && state.connectedPeer==null && (
                    <ScanScreen {...state} connectTo={connectTo} />
                )}
            </ScrollView>
        </SafeAreaView>
    </>
    );
};

const NotConnectedScreen = (props) => {
    return (
    <>
        <Text style={styles.notConnectedTitle}>Wait for Brigefy to initialize...</Text>
        <ActivityIndicator size="large" color="#333" />
    </>
    );
}

const BrowseMessageScreen = (props) => {
    let openFile = (url)=>{
        FileViewer.open('file://'+url, { showOpenWithDialog: true })
            .then(() => {
                // success
            })
            .catch(error => {
                Alert.alert("File Error",`Cannot open that kind of file: ${url}`);
            });
    }
    return (
    <View style={styles.msgView}>
        <View style={styles.msgTexts}>
            <Text style={styles.msgTitle}>Incoming message </Text>
            <Text style={styles.msgText}>{props.receivedMessages[0].content.msg}</Text>
        </View>
        { props.receivedMessages[0].dataLocalURI != null && 
          props.receivedMessages[0].dataLocalURI.length>0 && (
            <TouchableOpacity
                onPress={()=>openFile(props.receivedMessages[0].dataLocalURI)}
                style={styles.msgBtn}
            >
                <Icon
                    name="document-attach-outline"
                    size={30}
                    color="#333"
                    style={styles.msgBtnIc}
                />
            </TouchableOpacity>
        )}
        <TouchableOpacity
            onPress={()=>props.nextMessage()}
            style={styles.msgBtn}
        >
            <Icon
                name="trash-outline"
                size={30}
                color="#333"
                style={styles.msgBtnIc}
            />
        </TouchableOpacity>
    </View>
    );
}

const ShareScreen = (props) => {
    let send = ()=>{
        if (props.isSending) {
            Alert.alert(
                'Send message error',
                'Please wait until previous message is sent.'
            );
        }
        else if (props.msgFile==null||props.msgText==null) {
            Alert.alert(
                'Send message error',
                'You need to write a message and pick a file to send first'
            );
        }
        else {
            props.sendMsg(props.connectedPeer.userId, props.msgText, props.msgFile.uri)
        }
    }
    return (
    <>
    <Text style={styles.shareTitle}>Compose a message to send:</Text>
    <View style={styles.shareView}>
        <Text
            style={styles.shareText}
            numberOfLines={1}
            ellipsizeMode="tail"
        >
            {props.msgText!=null?props.msgText:"Write a message..."}
        </Text>
        <TouchableOpacity
            style={styles.shareBtn}
            onPress={()=>props.promptMsg()}
        >
            <Icon
                name="pencil-outline"
                size={26}
                color="#333"
                style={styles.msgBtnIc}
            />
        </TouchableOpacity>
        <Text
            style={styles.shareText}
            numberOfLines={1}
            ellipsizeMode="tail"
        >
            {props.msgFile!=null?props.msgFile.name:"No file attached..."}
        </Text>
        <TouchableOpacity
            style={styles.shareBtn}
            onPress={()=>props.pickFile()}
        >
            <Icon
                name="document-attach-outline"
                size={26}
                color="#333"
                style={styles.msgBtnIc}
            />
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.shareBtn}
            onPress={()=>send()}
        >
            <Icon
                name="send-outline"
                size={26}
                color={ props.msgFile==null||props.msgText==null ? "red" : "green" }
                style={styles.msgBtnIc}
            />
        </TouchableOpacity>
    </View>
    { props.isSending && (
    <>
        <Text style={styles.shareTitle}>Sending message...</Text>
        { Platform.OS=="android" && (<Text style={styles.sharePercent}>{ props.sendProgress }%</Text>) }
        <ActivityIndicator size="large" color="#333" />
    </>
    )}
    </>
    );
}

const ScanScreen = (props) => {
    console.log('ScanScreen props.peers=',props.peers)
    return (
    <>
        <Text style={styles.scanTitle}>Looking for peers...</Text>
        <ActivityIndicator size="large" color="#333" />
        {
            props.peers.length>0 && (
                <Text style={styles.scanSubtitle}>List of detected peers:</Text>
            )
        }
        {
            props.peers.map((p)=>(
                <TouchableOpacity
                    key={p.userId}
                    disabled={props.connectingPeer!=null}
                    onPress={()=>props.connectTo(p)}
                    style={[styles.peerView,(props.connectingPeer!=null?styles.peerDisabledView:null)]}
                >
                    <Text numberOfLines={1} ellipsizeMode="middle" style={styles.peerText}>User #{p.userId}</Text>
                    <View
                        style={styles.peerConnectBtn}
                    >
                        { props.connectingPeer==null && (
                        <>
                            <Text style={styles.peerConnectBtnText}>CONNECT</Text>
                            <Icon
                                name="wifi-outline"
                                size={30}
                                color="#333"
                                style={styles.peerConnectBtnIc}
                            />
                        </>
                        )}
                        { props.connectingPeer!=null  && props.connectingPeer.userId==p.userId && (
                        <>
                            <Text style={styles.peerConnectBtnText}>CONNECTING...</Text>
                            <ActivityIndicator size="small" color="#333" />
                        </>
                        )}
                    </View>
                </TouchableOpacity>
            ))
        }
    </>
    );
}

const styles = StyleSheet.create({
    msgView: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    msgTexts: {
        flex: 1,
        padding: 6,
        justifyContent: 'space-evenly'
    },
    msgTitle: {
        fontSize: 15,
    },
    msgText: {
        fontSize: 13,
        fontStyle: 'italic'
    },
    msgBtn: {
        width: 70,
        marginLeft: 10
    },
    msgBtnText: {
        fontSize: 14,
        textAlign: 'center'
    },
    msgBtnIc: {
        marginHorizontal: 10
    },

    scanTitle: {
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 12,
    },
    scanSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginVertical: 12,
    },
    peerView: {
        borderWidth: 1,
        borderColor: '#ddd',
        width: '80%',
        marginVertical: 10,
        alignSelf: 'center',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    peerDisabledView: {
        opacity: .6
    },
    peerText: {
        flex: 1,
        flexShrink: 1
    },
    peerConnectBtn: {
        width: 80,
        alignItems: 'center',
        marginLeft: 10,
        textAlign: 'center'
    },
    peerConnectBtnText: {
        fontSize: 13,
    },
    peerConnectBtnIc: {
        marginHorizontal: 10
    },

    notConnectedTitle: {
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 12,
    },

    shareTitle: {
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 12,
    },
    sharePercent: {
        fontSize: 17,
        textAlign: 'center',
        marginVertical: 12,
    },
    shareView: {
        borderWidth: 1,
        borderColor: '#ddd',
        width: '95%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        alignSelf: 'center',
        padding: 10,
        marginVertical: 10,
    },
    shareText: {
        width: '20%',
        fontSize: 13,
        flexShrink: 1
    },
    shareBtn: {
        marginHorizontal: 6
    },
});

export default App;
