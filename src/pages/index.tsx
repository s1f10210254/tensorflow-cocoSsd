import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
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

    //物体検出と描写
    const detectFrame = (
      video: HTMLVideoElement,
      model: cocoSsd.ObjectDetection
    ) => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        model.detect(video).then((predictions) => {
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

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

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
      });
    };

    loadModel();
  }, [model]);

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} />
    </div>
  );
}
