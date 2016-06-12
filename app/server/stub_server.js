/**
 * Created by qzhang8 on 6/6/16.
 */
Meteor.StubServer = (function() {
    class StubServer {
        constructor(callback) {
            Meteor.log.info("constructor StubServer");

            //as a test, we will need to subscribe all the channels to BBB and provide stub responses
            this.testPub = redis.createClient();
            this.testSub = redis.createClient();

            this.testSub.psubscribe(Meteor.config.redis.channels.toBBBApps.pattern);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.chat);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.meeting);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.presentation);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.users);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.voice);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.whiteboard);
            this.testSub.subscribe(Meteor.config.redis.channels.toBBBApps.polling);


            this.testSub.on("message", function (channel, message) {
                Meteor.log.info("StubServer message" + channel + " : " + message);

                parsedMsg = JSON.parse(message);
                payload = parsedMsg.payload;
                if(payload != null) {
                    meetingId = payload.meeting_id;
                }
                eventName = parsedMsg.header.name;
                if (channel === Meteor.config.redis.channels.toBBBApps.meeting) {
                    if (eventName === "validate_auth_token") {
                        let reply;
                        reply = {
                            "payload":  {
                                "userid": "user001",
                                "meeting_id": "meeting001",
                                "valid": true,
                            } ,
                            "header": {
                                "timestamp": new Date().getTime(),
                                "name": "validate_auth_token_reply"
                            }
                        };
                        publish(Meteor.config.redis.channels.fromBBBApps, reply);

                        reply = {
                            "payload":
                            {"meeting_id":"meeting001",
                                "user": {
                                    "presenter":false,
                                    "role":"VIEWER",
                                    "locked":true,
                                    "phone_user":true,
                                    "webcam_stream":[],
                                    "extern_userid":"n4xjeiulnopu",
                                    "emoji_status":"none",
                                    "voiceUser":{
                                        "talking":false,
                                        "callername":"Leonardo",
                                        "locked":false,
                                        "callernum":"70629",
                                        "muted":false,
                                        "web_userid":"n4xjeiulnopu_2",
                                        "joined":true,
                                        "userid":"4"
                                    },
                                    "name":"Leonardo",
                                    "listenOnly":false,
                                    "has_stream":false,
                                    "userid":"user001"
                                }
                            },
                            "header": {
                                "timestamp": new Date().getTime(),
                                "name": "user_joined_message"
                            }
                        };
                     //   publish(Meteor.config.redis.channels.fromBBBApps, reply);


                    } else if (eventName == "get_all_meetings_request") {
                        let reply;
                        reply = {
                            "payload": {
                                meetings: [ {
                                    meetingId: "meeting001",
                                    meetingName: "Demo Meeting",
                                    intendedForRecording: false,
                                    currentlyBeingRecorded: false,//default value
                                    voiceConf: "12345",
                                    duration: "0"
                                } ]
                            },
                            "header": {
                                "timestamp": new Date().getTime(),
                                "name": "get_all_meetings_reply"
                            }
                        };
                        publish(Meteor.config.redis.channels.fromBBBApps, reply);



                    }

                }
            });

            callback(this);
        }

    }



    return StubServer;
})();

this.publish = function(channel, message) {
    Meteor.log.info(`stubserver outgoing message  ${message.header.name}`, {
        channel: channel,
        message: message
    });
    if(Meteor.stubServer != null) {
        return Meteor.stubServer.testPub.publish(channel, JSON.stringify(message), (err, res) => {
                if(err) {
                    return Meteor.log.info("error", {
                        error: err
                    });
                }
            });
    } else {
        return Meteor.log.info("ERROR!! Meteor.stubserver was undefined");
    }
};
