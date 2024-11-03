import React, { useEffect, useRef, useState } from "react";
import { Copy, Phone, PhoneOff, Video, User, Camera, CameraOff, Mic, MicOff } from "lucide-react";
import Peer from "simple-peer";
import io from "socket.io-client";
import VideoSetup from "../components/VideoSetup";

const socket = io.connect('https://videocall-metl.onrender.com');

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
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">Video Chat</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
                            {stream && (
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute bottom-4 left-4 bg-gray-900/80 px-3 py-1 rounded-full">
                                <div className="flex items-center space-x-2">
                                    <User size={16} />
                                    <span className="text-sm">{name || 'You'}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-4 flex space-x-2">
                                <button
                                    onClick={toggleCamera}
                                    className={`p-2 rounded-full ${isCameraOn ? 'bg-blue-500' : 'bg-red-500'}`}
                                >
                                    {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                                </button>
                                <button
                                    onClick={toggleMic}
                                    className={`p-2 rounded-full ${isMicOn ? 'bg-blue-500' : 'bg-red-500'}`}
                                >
                                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
                            {callAccepted && !callEnded ? (
                                <video
                                    playsInline
                                    ref={userVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Video className="w-16 h-16 text-gray-600" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 p-6 bg-gray-800 rounded-lg">
                        <div className="space-y-4">
                            {me ? ( // Only render if me has a value
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
                                        className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Copy size={20} />
                                    </button>
                                </div>
                            ) : (
                                <p>Loading ID...</p> // Loading state if ID is not yet received
                            )}
                            <p className="text-sm text-gray-400">Share this ID with the person you want to call.</p>
                        

                        <div className="flex items-center space-x-2 mt-4">
                            <input
                                type="text"
                                value={idToCall}
                                onChange={(e) => setIdToCall(e.target.value)}
                                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg"
                                placeholder="Enter ID to call"
                            />
                            <button
                                onClick={() => callUser(idToCall)}
                                className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                                disabled={!idToCall}
                            >
                                <Phone size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center mt-4">
                        {callAccepted && !callEnded ? (
                            <button
                                onClick={leaveCall}
                                className="px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                            >
                                <PhoneOff size={20} />
                                <span>End Call</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => callUser(idToCall)}
                                className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                                disabled={!idToCall}
                            >
                                <Phone size={20} />
                                <span>Start Call</span>
                            </button>
                        )}
                    </div>

                    {receivingCall && !callAccepted && (
                        <div className="mt-4 p-4 bg-blue-500 rounded-lg">
                            <div className="text-center space-y-4">
                                <p className="font-semibold">{name || "Someone"} is calling...</p>
                                <button
                                    onClick={answerCall}
                                    className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                                >
                                    <Phone size={20} />
                                    <span>Answer</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div >
    );
};

export default VideoCall;
