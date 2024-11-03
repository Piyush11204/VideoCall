import React, { useState, useEffect } from "react";

const VideoSetup = ({ setName, setDeviceOptions, startCall }) => {
    const [userName, setUserName] = useState("");
    const [devices, setDevices] = useState({ cameras: [], microphones: [] });
    const [selectedCamera, setSelectedCamera] = useState("");
    const [selectedMicrophone, setSelectedMicrophone] = useState("");
    const [enableVideo, setEnableVideo] = useState(true);
    const [enableAudio, setEnableAudio] = useState(true);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
            const cameras = deviceInfos.filter(device => device.kind === "videoinput");
            const microphones = deviceInfos.filter(device => device.kind === "audioinput");
            setDevices({ cameras, microphones });
            if (cameras.length) setSelectedCamera(cameras[0].deviceId);
            if (microphones.length) setSelectedMicrophone(microphones[0].deviceId);
        });
    }, []);

    const handleStart = () => {
        setName(userName);
        setDeviceOptions({
            video: enableVideo ? { deviceId: selectedCamera } : false,
            audio: enableAudio ? { deviceId: selectedMicrophone } : false
        });
        startCall();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center">
            <div className="max-w-md w-full space-y-6 bg-gray-800 p-6 rounded-lg">
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <label>Enable Video:</label>
                        <input
                            type="checkbox"
                            checked={enableVideo}
                            onChange={() => setEnableVideo(!enableVideo)}
                        />
                    </div>
                    {enableVideo && (
                        <select
                            value={selectedCamera}
                            onChange={(e) => setSelectedCamera(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                        >
                            {devices.cameras.map((camera) => (
                                <option key={camera.deviceId} value={camera.deviceId}>
                                    {camera.label || "Camera"}
                                </option>
                            ))}
                        </select>
                    )}

                    <div className="flex items-center space-x-2">
                        <label>Enable Audio:</label>
                        <input
                            type="checkbox"
                            checked={enableAudio}
                            onChange={() => setEnableAudio(!enableAudio)}
                        />
                    </div>
                    {enableAudio && (
                        <select
                            value={selectedMicrophone}
                            onChange={(e) => setSelectedMicrophone(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                        >
                            {devices.microphones.map((mic) => (
                                <option key={mic.deviceId} value={mic.deviceId}>
                                    {mic.label || "Microphone"}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <button
                    onClick={handleStart}
                    disabled={!userName}
                    className="w-full py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Start Video Call
                </button>
            </div>
        </div>
    );
};

export default VideoSetup;
