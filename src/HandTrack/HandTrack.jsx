import "./HandTrack.css";
import { useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Hands } from "@mediapipe/hands";
import * as hands from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { useHistory } from "react-router-dom";

const HandTrack = () => {
  const isComponentMounted = useRef({});
  const webCamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoConstraints = useRef({
    width: 360,
    height: 640,
    facingMode: {
      exact: "environment",
    },
  });
  let currentStream;

  let history = useHistory();

  useEffect(() => {
    if (typeof currentStream !== "undefined") {
      stopMediaTracks(currentStream);
    }
    videoConstraints.current = {
      width: 360,
      height: 640,
      facingMode: {
        exact: "environment",
      },
    };
  }, [currentStream]);

  function stopMediaTracks(stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  const onResults = useCallback((results) => {
    let videoWidth = null;
    let videoHeight = null;
    if (webCamRef != null) {
      videoWidth = webCamRef.current.video.videoWidth;
      videoHeight = webCamRef.current.video.videoHeight;
    }

    //Sets height and width of canvas
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, hands.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawLandmarks(canvasCtx, landmarks, { color: "#00ffd0", lineWidth: 1 }); //#5d0db8 purple
      }
    }
    canvasCtx.restore();
  }, []);

  useEffect(() => {
    if (isComponentMounted.current) {
      let camera = null;
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.7,
      });

      hands.onResults(onResults);

      if (
        typeof webCamRef.current !== "undefined" &&
        webCamRef.current !== null
      ) {
        camera = new cam.Camera(webCamRef.current.video, {
          onFrame: async () => {
            await hands.send({ image: webCamRef.current.video });
          },
          width: 360,
          height: 640,
        });
        camera.start();
      }
    }
    return () => {
      isComponentMounted.current = false;
    };
  }, [onResults]);

  const gotoBack = useCallback(() => {
    webCamRef.current.video.pause();
    webCamRef.current.src = "";
    history.push("/");
  }, [webCamRef, history]);

  return (
    <>
      <div className="camContainer">
        <Webcam
          id="videoCam"
          ref={webCamRef}
          videoConstraints={videoConstraints}
          style={{
            position: "absolute",
            marginRight: "auto",
            marginLeft: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            width: "360px",
            height: "640px",
            opacity: "0",
          }}
        />

        <canvas
          ref={canvasRef}
          className="output_canvas"
          style={{
            position: "relative",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: "360px",
            height: "640px",
          }}
        />
      </div>

      <button type="button" onClick={gotoBack}>
        Back to home
      </button>
    </>
  );
};

export default HandTrack;
