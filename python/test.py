import time
import json
from Led import *
led=Led()
def test_Led():
    try:
        led.ledIndex(0x01,255,0,0)      #Red
        led.ledIndex(0x02,255,125,0)    #orange
        led.ledIndex(0x04,255,255,0)    #yellow
        led.ledIndex(0x08,0,255,0)      #green
        led.ledIndex(0x10,0,255,255)    #cyan-blue
        led.ledIndex(0x20,0,0,255)      #blue
        led.ledIndex(0x40,128,0,128)    #purple
        led.ledIndex(0x80,255,255,255)  #white'''
        print ("The LED has been lit, the color is red orange yellow green cyan-blue blue white")

        FrontLeftDoorFlag = bool(led.strip.getPixelColor(4));
        FrontRightDoorFlag = bool(led.strip.getPixelColor(7));
        RearLeftDoorFlag = bool(led.strip.getPixelColor(3));
        RearRightDoorFlag = bool(led.strip.getPixelColor(0));
        ACSettings = bool(led.strip.getPixelColor(1));

        # Create message payload
        payload = {"state":
                    {"reported":
                        {   "FrontLeftDoorFlag":FrontLeftDoorFlag,
                            "FrontRightDoorFlag":FrontRightDoorFlag,
                            "RearLeftDoorFlag":RearLeftDoorFlag,
                            "RearRightDoorFlag":RearRightDoorFlag,
                            "ACSettings":str(ACSettings)
                        }
                    }
                }
        print('This is the payload: ', payload)

        with open("/etc/aws-iot-fleetwise/config-0.json", "r") as f:
            configs = json.load(f)
            clientId = 'shadow-' + configs["staticConfig"]["mqttConnection"]["clientId"]
            enpoint = configs["staticConfig"]["mqttConnection"]["endpointUrl"]
            certificatePath = configs["staticConfig"]["mqttConnection"]["certificateFilename"]
            privateKeyPath = configs["staticConfig"]["mqttConnection"]["privateKeyFilename"]
            rootCAPath = "/etc/aws-iot-fleetwise/AmazonRootCA1.pem"
        
        print('This is Client Id: ', clientId);
        print('This is endpoint: ', enpoint);
        
        # Init AWSIoTMQTTShadowClient
        #myAWSIoTMQTTShadowClient = None
        #myAWSIoTMQTTShadowClient = AWSIoTMQTTShadowClient(clientId)
        #myAWSIoTMQTTShadowClient.configureEndpoint(enpoint, 443)
        #myAWSIoTMQTTShadowClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

        # AWSIoTMQTTShadowClient connection configuration
        #myAWSIoTMQTTShadowClient.configureAutoReconnectBackoffTime(1, 32, 20)
        #myAWSIoTMQTTShadowClient.configureConnectDisconnectTimeout(10) # 10 sec
        #myAWSIoTMQTTShadowClient.configureMQTTOperationTimeout(5) # 5 sec
        time.sleep(3)               #wait 3s
        led.colorWipe(led.strip, Color(0,0,0))  #turn off the light
        print ("\nEnd of program")
    except KeyboardInterrupt:
        led.colorWipe(led.strip, Color(0,0,0))  #turn off the light
        print ("\nEnd of program")

        
           
# Main program logic follows:
if __name__ == '__main__':

    print ('Program is starting ... ')
    import sys
    if len(sys.argv)<2:
        print ("Parameter error: Please assign the device")
        exit() 
    if sys.argv[1] == 'Led':
        test_Led()