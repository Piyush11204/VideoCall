import React, { useEffect, useRef, useState } from "react";
import { Copy, Phone, PhoneOff, Video, User, Camera, CameraOff, Mic, MicOff } from "lucide-react";
import Peer from "simple-peer";
import io from "socket.io-client";
import VideoSetup from "../components/VideoSetup";

const socket = io.connect('https://videocall-metl.onrender.com', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
});

const VideoCall = () => {
    const [me, setMe] = useState("");
    const [stream, setStream] = useState();
    const [deviceOptions, setDeviceOptions] = useState({});
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [idToCall, setIdToCall] = useState("");
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [showSetup, setShowSetup] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        if (!showSetup) {
            navigator.mediaDevices.getUserMedia(deviceOptions).then((stream) => {
                setStream(stream);
                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
            });

            socket.on("me", (id) => {
                setMe(id);
            });

            socket.on("callUser", (data) => {
                setReceivingCall(true);
                setCaller(data.from);
                setCallerSignal(data.signal);
            });
        }
    }, [showSetup, deviceOptions]);

    const startCall = () => {
        setShowSetup(false);
    };

    const toggleCamera = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOn(!isCameraOn);
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const callUser = (id) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        });
        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: me,
                name: name
            });
        });
        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream;
        });
        socket.on("callAccepted", (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });
        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        });
        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller });
        });
        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream;
        });
        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        connectionRef.current.destroy();
    };
    socket.on("me", (id) => {
        setMe(id);
    });
    return showSetup ? (
        <VideoSetup
            setName={setName}
            setDeviceOptions={setDeviceOptions}
            startCall={startCall}
            setIdToCall={setIdToCall}
        />
    ) : (
        <div className="min-h-screen bg-gray-900 text-white relative">
            {/* Main video (other person or placeholder) */}
            <div className="w-full h-screen">
                {callAccepted && !callEnded ? (
                    <video
                        playsInline
                        ref={userVideo}
                        autoPlay
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800">
                        <Video className="w-24 h-24 text-gray-600" />
                    </div>
                )}
            </div>

            {/* Picture-in-picture (your video) */}
            <div className="absolute left-4 bottom-4 w-64 rounded-lg overflow-hidden shadow-lg">
                {stream && (
                    <div className="relative">
                        <video
                            playsInline
                            muted
                            ref={myVideo}
                            autoPlay
                            className="w-full aspect-video object-cover rounded-lg"
                        />
                        <div className="absolute bottom-2 left-2 bg-gray-900/80 px-2 py-1 rounded-full">
                            <div className="flex items-center space-x-2">
                                <User size={14} />
                                <span className="text-sm">{name || 'You'}</span>
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 flex space-x-1">
                            <button
                                onClick={toggleCamera}
                                className={`p-1.5 rounded-full ${isCameraOn ? 'bg-blue-500' : 'bg-red-500'}`}
                            >
                                {isCameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
                            </button>
                            <button
                                onClick={toggleMic}
                                className={`p-1.5 rounded-full ${isMicOn ? 'bg-blue-500' : 'bg-red-500'}`}
                            >
                                {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating controls */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setShowControls(!showControls)}
                    className="bg-gray-800 p-3 rounded-full hover:bg-gray-700"
                >
                    <Phone size={24} />
                </button>
            </div>

            {/* Controls popup */}
            {showControls && (
                <div className="absolute top-20 right-4 w-80 bg-gray-800 rounded-lg p-4 shadow-lg">
                    <div className="space-y-4">
                        {me && (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={me}
                                    readOnly
                                    className="flex-1 px-4 py-2 bg-gray-700 rounded-lg"
                                    placeholder="Your ID"
                                />
                                <button
                                    onClick={() => navigator.clipboard.writeText(me)}
                                    className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={idToCall}
                                onChange={(e) => setIdToCall(e.target.value)}
                                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg"
                                placeholder="Enter ID to call"
                            />
                            <button
                                onClick={() => callUser(idToCall)}
                                className="p-2 bg-green-500 rounded-lg hover:bg-green-600"
                                disabled={!idToCall}
                            >
                                <Phone size={20} />
                            </button>
                        </div>

                        {callAccepted && !callEnded && (
                            <button
                                onClick={leaveCall}
                                className="w-full px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
                            >
                                <PhoneOff size={20} />
                                <span>End Call</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Incoming call popup */}
            {receivingCall && !callAccepted && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center space-y-4">
                        <p className="font-semibold">{name || "Someone"} is calling...</p>
                        <button
                            onClick={answerCall}
                            className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                        >
                            <Phone size={20} />
                            <span>Answer</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCall;