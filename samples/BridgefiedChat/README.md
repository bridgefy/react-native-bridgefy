# ChatSample
ChatSample is a project that demonstrates the use of BridgefySDK trough its React Native interface. 

The project consists in a chat app that send messages to all nearby devices that are running the application too.  

This project uses [Gifted chat](https://github.com/FaridSafi/react-native-gifted-chat) for the chat UI components.

## Get started

To run this sample, follow those steps:

* Intall the dependencies:
```sh
yarn install
```
or 
```
npm install
```

* Go to your [Bridgefy account license page](https://admin.bridgefy.me/license) and create a license for:
App name: BridgefiedChat
Android app id: com.bridgefiedchat
iOS app id: org.reactjs.native.example.BridgefiedChat

* Then copy paste this license key in App.tsx:

```js
const BRDG_LICENSE_KEY:string = "COPY YOU LICENSE KEY HERE";
```

**Note:** Internet access is required during the first run in order to check for a valid license in our servers.
