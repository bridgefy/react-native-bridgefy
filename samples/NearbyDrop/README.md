# NearbyDrop
NearbyDrop is a project that demonstrates the use of BridgefySDK trough its React Native interface. 

The project consists in a simple app that scans for nearby devices, proposes to connect (on-demand mode) and opnce connected, proposes to send a message along with a file (2MB max).  

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
App name: NearbyDrop
Android app id: com.nearbydrop
iOS app id: com.nearbydrop

* Then copy paste this license key in App.tsx:

```js
const BRDG_LICENSE_KEY:string = "COPY YOU LICENSE KEY HERE";
```

**Note:** Internet access is required during the first run in order to check for a valid license in our servers.
