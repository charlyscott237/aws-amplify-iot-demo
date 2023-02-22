import { Amplify, PubSub, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import {AWSIoTProvider} from '@aws-amplify/pubsub';
import '@aws-amplify/ui-react/styles.css';
import logo from './logo.svg'
import awsExports from './aws-exports';
import { 
  MacBookAir1 
} from './ui-components';
import { useState, useEffect } from 'react';

Amplify.configure(awsExports);

Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: 'eu-central-1',
    aws_pubsub_endpoint:
      'wss://a1r5rrohp279q3-ats.iot.eu-central-1.amazonaws.com/mqtt',
    clientId: 'AmplifyWebPortal'
  })
);

Amplify.Logger.LOG_LEVEL='DEBUG';

function App({ signOut, user }) {
  
  const shadowprefix = '';
  const rootTopic = '$aws/things/';
  const thingname = 'fwdemo-esp32wrover';

  const [carDoorsStatus, setCarDoorsStatus] = useState(false);
  const [carLightsStatus, setCarLightsStatus] = useState(false);
  const [alarmSystemStatus, setAlarmSystemStatus] = useState(false);
  const [showtimeStatus, setShowTimeStatus] = useState(false);
  const [ACSettings, setACSettings] = useState(100);
  
  var SHADOW_GET_SHADOW_TOPIC = rootTopic + thingname + '/shadow/get';
  var SHADOW_GET_SHADOW_ACCEPT_TOPIC = rootTopic + thingname + '/shadow/get/accepted';
  var SHADOW_GET_SHADOW_REJECT_TOPIC = rootTopic + thingname + '/shadow/get/rejected';
  var SHADOW_SEND_UPDATE_TOPIC = rootTopic + thingname + '/shadow/update';
  var SHADOW_SEND_UPDATE_ACCEPT_TOPIC = rootTopic + thingname + '/shadow/update/accepted';
  var SHADOW_SEND_UPDATE_REJECT_TOPIC = rootTopic + thingname + '/shadow/update/rejected';
  var SHADOW_SEND_UPDATE_DELTA_TOPIC = rootTopic + thingname + '/shadow/update/delta';
  
  const getCognitoIdentityId = () => {
    try {
      Auth.currentCredentials().then((info) => {
        const cognitoIdentityId = info.identityId;
        console.log(cognitoIdentityId);
      })
    } catch (error) {
      console.log(error);
    }
  }

  

  const sendMessage = async (topic_to_publish_to, mqttjsonmessage) => {
    
    try {    
      console.log('Message to Publish:', mqttjsonmessage);
      await PubSub.publish(topic_to_publish_to, mqttjsonmessage);
      
    }
    catch (error) {
      console.log(error);
    }
  }

  const setVehicleState = (statevariable, value) => {
    
    try {    
      if (statevariable === 'FrontLeftDoorFlag')
        {
          if (!(carDoorsStatus === value))
            {
              setCarDoorsStatus(value)
            }
        }
      else if (statevariable === 'FrontRightDoorFlag')
        {
          if (!(carLightsStatus === value))
            {
              setCarLightsStatus(value)
            }
        }
      else if (statevariable === 'RearLeftDoorFlag')
        {
          if (!(alarmSystemStatus === value))
            {
              setAlarmSystemStatus(value)
            }
        }
      else if (statevariable === 'RearRightDoorFlag')
        {
          if (!(showtimeStatus === value))
            {
              setShowTimeStatus(value)
            }
        }
      else if (statevariable === 'ACSettings')
        {
          if (!(ACSettings === value))
            {
              setACSettings(value)
            }
        }
      else
        { 
          console.log('The variable is not included in the list');
        }
      
    }
    catch (error) {
      console.log(error);
    }
  }

  const processResponse = async (response_payload) => {
    
    try {
          console.log('Received message: ', response_payload.value)
      
          if (response_payload.value.state.reported)
            {
              var reportedstate = response_payload.value.state.reported;
              console.log('Message received: ', response_payload);
              //response_object = JSON.parse(response_payload);
              for (let x in response_payload.value.state.reported) 
                {
                  console.log(x + ": "+ reportedstate[x]);
                  setVehicleState(x, reportedstate[x]);
                  }     
            }
        
        } catch (error) 
          {
            console.log(error);
          }
      }
    
  ;

  useEffect(() => {

                  const subscribePubSub = (topic_to_subscribe_to) => {
                    PubSub.subscribe(topic_to_subscribe_to).subscribe({
                      next: data => processResponse(data),
                      error: error => console.error(error),
                      complete: () => console.log('Done')
                    });
                  };
                  //subscribePubSub(SHADOW_GET_SHADOW_TOPIC);
                              
                  subscribePubSub(SHADOW_GET_SHADOW_ACCEPT_TOPIC);
                  subscribePubSub(SHADOW_GET_SHADOW_REJECT_TOPIC);
                  
                  setTimeout(() => {
                    alert("Requesting vehicle last reported state...");
                    PubSub.publish(SHADOW_GET_SHADOW_TOPIC,{});
  
                      }
                
                      ,3000);
                  
                  },[SHADOW_GET_SHADOW_ACCEPT_TOPIC, SHADOW_GET_SHADOW_REJECT_TOPIC, SHADOW_GET_SHADOW_TOPIC]);
  
  
  
  return (
  
    <div className="ReactApp">

      <MacBookAir1 overrides={{
                                CarDoorSwitch:                                  
                                  { isChecked: carDoorsStatus,
                                    onChange:(e) => {
                                    setCarDoorsStatus(e.target.checked)
                                    PubSub.publish(SHADOW_SEND_UPDATE_TOPIC,
                                                    {
                                                    "state": {
                                                      "desired": {
                                                        "FrontLeftDoorFlag": e.target.checked
                                                        }
                                                      }
                                                    }
                                                  )
                                                    }     
                                  },
                                CarLightsSwitch:   
                                  { isChecked: carLightsStatus,
                                    //carLightsStatus: {isChecked},
                                    onChange:(e) => {
                                    setCarLightsStatus(e.target.checked)
                                    
                                    PubSub.publish(SHADOW_SEND_UPDATE_TOPIC,
                                                    {
                                                    "state": {
                                                      "desired": {
                                                        "FrontRightDoorFlag": e.target.checked
                                                        }
                                                      }
                                                    }
                                                  )
                                                    }  
                                  },
                                SwitchField36463067:                                  
                                  { isChecked: alarmSystemStatus,
                                    onChange:(e) => {
                                    setAlarmSystemStatus(e.target.checked)
                                    
                                      PubSub.publish(SHADOW_SEND_UPDATE_TOPIC,
                                                      {
                                                      "state": {
                                                        "desired": {
                                                          "RearLeftDoorFlag": e.target.checked
                                                          }
                                                        }
                                                      }
                                                    )
                                                      } 
                                    
                                  }
                                ,
                                SwitchField36463075:   
                                  { isChecked: showtimeStatus,
                                    onChange:(e) => {
                                    setShowTimeStatus(e.target.checked)
                                    
                                    PubSub.publish(SHADOW_SEND_UPDATE_TOPIC,
                                                    {
                                                    "state": {
                                                      "desired": {
                                                        "RearRightDoorFlag": e.target.checked
                                                        }
                                                      }
                                                    }
                                                  )
                                                    }  
                                  }
                                  ,
                                  SliderField:   
                                    { //defaultValue: 100,
                                      max: 100,
                                      min: 60,
                                      value: ACSettings,
                                      onChange: (value) => {
                                      setACSettings(value)
                                      
                                      PubSub.publish(SHADOW_SEND_UPDATE_TOPIC,
                                                      {
                                                      "state": {
                                                        "desired": {
                                                          "ACSettings": value
                                                          }
                                                        }
                                                      }
                                                    )
                                                      }  
                                    }
                              }}
                          />
      
    </div>

  );

}

export default withAuthenticator(App);