# aws-amplify-iot-demo

Here, we setup a dev environment in the cloud that will help us deploy required cloud resources and configure Fleetwise

    -Launch development machine and attached resources using CloudFormation Template
    -Download, install and compile the Fleetwise Agent on the Dev environment Machine
    -Provision the AWS IOT Resources required for Fleetwise agent and Cloud Service
---------------------------------------------------------------------------------------------------------------------------
    
  *********** Launch CloudFormation Template to create dev environment

    https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-iot-fleetwise.s3.us-west-2.amazonaws.com%2Flatest%2Fcfn-templates%2Ffwdev.yml&stackName=fwdev&param_Ec2VolumeSize=20

  ************ From Dev Machine *********

    git clone https://github.com/aws/aws-iot-fleetwise-edge.git ~/aws-iot-fleetwise-edge \
    && cd ~/aws-iot-fleetwise-edge

    sudo -H ./tools/install-deps-native.sh

    ./tools/build-fwe-native.sh

    mkdir -p ~/aws-iot-fleetwise-deploy && cd ~/aws-iot-fleetwise-deploy \
    && cp -r ~/aws-iot-fleetwise-edge/tools . \
    && mkdir -p build/src/executionmanagement \
    && cp ~/aws-iot-fleetwise-edge/build/src/executionmanagement/aws-iot-fleetwise-edge \
        build/src/executionmanagement/ \
    && mkdir -p config && cd config \
    && ../tools/provision.sh \
        --vehicle-name fwdemo-esp32wrover \
        --certificate-pem-outfile certificate.pem \
        --private-key-outfile private-key.key \
        --endpoint-url-outfile endpoint.txt \
        --vehicle-name-outfile vehicle-name.txt \
        --region eu-central-1 \
    && ../tools/configure-fwe.sh \
        --input-config-file ~/aws-iot-fleetwise-edge/configuration/static-config.json \
        --output-config-file config-0.json \
        --log-color Yes \
        --vehicle-name `cat vehicle-name.txt` \
        --endpoint-url `cat endpoint.txt` \
        --can-bus0 vcan0 \
    && cd .. && zip -r aws-iot-fleetwise-deploy.zip .

---------------------------------------------------------------------------------------------------------------------------
The output package generated on the dev machine is used to deploy Fleetwise agent to vehicle
    Transfer the FW Agent output package (aws-iot-fleetwise-deploy.zip) from Dev environment to Vehicle
    Install AWS IoT FleetWise Edge Agent as a service on the vehicle
    Install the can-isotp module and set it up to enable vehicle Can interfaces on startup
    Restart  Setup-socketcan and FW agent services
    Verify that they both working normally

  Install Can Simulator and required dependencies (python3.7, python3-setuptools, curl, PIP, etc) and PIP libraries (wrapt, plotly, pandas, cantools) on the    Raspberry and Verify can data generation

---------------------------------------------------------------------------------------------------------------------------
  ******* From Local Machine *******
  
    scp -i raspberry-key-pair.pem ubuntu@3.66.198.45:aws-iot-fleetwise-deploy/aws-iot-fleetwise-deploy.zip .
    scp aws-iot-fleetwise-deploy.zip ubuntu@192.168.1.92:

  ******* From vehicle ******
  
    mkdir -p ~/aws-iot-fleetwise-deploy && cd ~/aws-iot-fleetwise-deploy \
        && unzip -o ~/aws-iot-fleetwise-deploy.zip \
        && sudo mkdir -p /etc/aws-iot-fleetwise \
        && sudo cp config/* /etc/aws-iot-fleetwise \
        && sudo ./tools/install-fwe.sh
    
    sudo -H ~/aws-iot-fleetwise-deploy/tools/install-socketcan.sh
    
  (Optional ---  If you have actual CAN Data connected to your Can Interface Card)
    sudo nano /usr/local/bin/setup-socketcan.sh
    
    (Note: Insert the following content below existing content)
        ip link set up can0 txqueuelen 1000 type can bitrate 500000 restart-ms 100
        ip link set up can1 txqueuelen 1000 type can bitrate 500000 restart-ms 100
    
    sudo systemctl restart setup-socketcan
    sudo systemctl restart fwe@0

    sudo journalctl -fu fwe@0 --output=cat

  (Optional Install Can Simulator on the Raspberry)

    sudo add-apt-repository ppa:deadsnakes/ppa
    sudo apt-get install python3.7-distutils
    sudo -H ./tools/install-cansim.sh

---------------------------------------------------------------------------------------------------------------------------
From the cloud dev Machine, create data collection campaign and start it
---------------------------------------------------------------------------------------------------------------------------
    
    cd ~/aws-iot-fleetwise-edge/tools/cloud \
        && sudo -H ./install-deps.sh

  Before proceeding, ensure that: 
      - the can interfaces specified in './tools/cloud/network-interfaces.json' correspond to the Vehicle Can interface (Mine is vcan0)
      - you remember the vehicle name you created earlier (You can always refer to './config/vehicle-name.txt'). We need it for next command
    
    ./demo.sh --vehicle-name fwdemo-esp32wrover --campaign-file campaign-obd-heartbeat.json --region eu-central-1

  Verify that data are actually collected by the IOT FleetWise service in the cloud
  
    /home/ubuntu/aws-iot-fleetwise-edge/tools/cloud/fwdemo-esp32wrover-1674618458.html

---------------------------------------------------------------------------------------------------------------------------
Web App Creation and Deployment
---------------------------------------------------------------------------------------------------------------------------

  Install NodeJs & Npm (via Windows Installer on Official Website) and Git
  
    npm i -g npx (Add nodix module - for windows users)
    npm install -g @aws-amplify/cli     //Install Amplify cli
    amplify configure  //configure the resources (security, storage, etc) that amplify will use to connect to other services in the Cloud
    npx create-react-app myamplifyvehicleapp // Create the Web App locally
    cd myamplifyvehicleapp
    amplify init
    npm start //watch the blank app
    amplify add auth //Add authentication
    amplify auth update // Provide authentication details
    amplify push //Push the updates to the cloud backend

    npm install aws-amplify @aws-amplify/ui-react //Install AWS Amplify in our App and ready-made UI Components

Minimalistic App content
------------------------------------
        import { Amplify } from 'aws-amplify';
        import { withAuthenticator } from '@aws-amplify/ui-react';
        import '@aws-amplify/ui-react/styles.css';
        import awsExports from './aws-exports';

        Amplify.configure(awsExports);

        function App({ signOut, user }) {
        return (
            <div className='App'>
                <h1>Hello {user.username}</h1>
                <button onClick={signOut}>Sign out</button>
            </div>
        );
        }

        export default withAuthenticator(App);

The minimal app interface is now available. You can create your profile and verify your subscription. The page is still blank.

---------------------------------------------------------------------------------------------------------------------------
Web App Connection to AWS IoT
---------------------------------------------------------------------------------------------------------------------------

Before AWS Amplify can communicate with AWS Amplify (and vice versa), required authorizations need to be set.

  Attach an IOT policy to the Amazon Cognito Identity (the App user) to determine his authorizations.
        
        aws iot attach-policy --policy-name 'amplifyiotpolicy' --target 'eu-central-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    
  As a whole service, Amplify needs to have its own authorizations to be able to communicate with AWS IoT Core
  When Amplify receives demands from a logged in user, he assumes a specific role to speak to the other services.
  That role should be granted permission to configure and get data from IoT Core: IoTConfigAccess & IoTDataAccess 

---------------------------------------------------------------------------------------------------------
Web App Customization
---------------------------------------------------------------------------------------------------------

Note: Figma is a very popular Web design tool used by Front-End developers. It is fully integrated with AWS Amplify

Here is the link to the very basic Web App design I did for demo
    
    https://www.figma.com/file/kgvrHa8Zl2PwgjWUMeJ9nB/AmplifyIoT?node-id=3646%3A2689&t=tZ0EUPrUY75r49sZ-1

Import the design into your App back-end in Amplify Studio console (you'll input the figma link above)
    
    https://aws.amazon.com/amplify

Pull the back-end content from your local machine

    amplify pull

Modify the App.js basic file in \src folder to include the Web design and Web App functions
    
    Use App.js file in attachment folder as a reference
    
---------------------------------------------------------------------------------------------------------
Vehicle Main Program - IoT SDK
---------------------------------------------------------------------------------------------------------
  
  This main program will run as an infinite loop on the Smart Cart Kit and exchange with AWS IoT Core for Command & Control features.
  
  The Web App deployed above communicates with the Smart Car Kit through AWS IoT Core
  
  1- Download the \Python folder from this project to your Smart Car Kit (with Raspberry Pi mounted on)
    
    
  2- Run the python program test.py
  
    sudo run test.py Led
 
---------------------------------------------------------------------------------------------------------
Testing Command & Control Features
---------------------------------------------------------------------------------------------------------
  
  With main program running as an infinite loop on the Smart Cart Kit, you can test the Web App functionalities on your local machine (https:localhost:3000).
  
    1- When the car starts, all the lights are lit, and the lights status are synced automatically on the Web portal
    
    2- Any switch command initiated from the Web portal is reflected on the Smart Car Lights
    
    3- When the python program is stopped on the device (CTRL + C), The program shuts down the lights automatically and the status is updated on the Web portal
