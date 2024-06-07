import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import Link from "next/link";

const RealTimeDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<any>(null);
  const [alertShown, setAleertShown] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      //GPUを使用し、WEB GLを設定
      await tf.setBackend("webgl");
      //TensorFlowの初期化
      await tf.ready();

      const model = await cocoSsd.load();
      setModel(model);
      setupCamera();
    };

    const setupCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // メタデータのロードを待つ
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play();

            // ビデオデータのロードを待つ
            videoRef.current!.onloadeddata = () => {
              if (model) {
                // ビデオの寸法を設定
                videoRef.current!.width = videoRef.current!.videoWidth;
                videoRef.current!.height = videoRef.current!.videoHeight;
                detectFrame(videoRef.current!, model);
              }
            };
          };
        }
      }
    };

    //再起的に呼び出される関数。ビデオフレームから物体を検出
    const detectFrame = (
      video: HTMLVideoElement,
      model: cocoSsd.ObjectDetection
    ) => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        //ビデオフレームから物体を検出
        model.detect(video).then((predictions) => {
          //検出結果を描写
          // console.log("検出結果", predictions);
          renderPredictions(predictions);
          requestAnimationFrame(() => detectFrame(video, model));
        });
      } else {
        // ビデオの幅と高さが設定されるのを待つ
        requestAnimationFrame(() => detectFrame(video, model));
      }
    };

    //検出結果の描写
    const renderPredictions = (predictions: cocoSsd.DetectedObject[]) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!context || !canvas || !videoRef.current) return;

      // キャンバスのサイズをビデオに合わせる
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // キャンバスをクリアする
      context.clearRect(0, 0, canvas.width, canvas.height);

      // カメラの映像をキャンバスに描画
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // 検出された物体の枠線とラベルを描画
      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;
        context.strokeStyle = "#00FFFF";
        context.lineWidth = 2;
        context.strokeRect(x, y, width, height);

        context.font = "18px Arial";
        context.fillStyle = "#00FFFF";
        context.fillText(
          `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
          x,
          y > 10 ? y - 5 : 10
        );

        if (
          prediction.class === "cell phone" &&
          prediction.score >= 0.85 &&
          !alertShown
        ) {
          setAleertShown(true);
          alert("cell phone detected!");
        }
      });
    };

    loadModel();
  }, [model, alertShown]);

  return (
    <div>
      <Link href={"/"}>
        <button>Back to Home</button>
      </Link>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default RealTimeDetection;
