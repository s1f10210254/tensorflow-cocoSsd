import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Object detection App</h1>
      <Link href={"/realtime-detection"}>
        <button>物体検知を開始</button>
      </Link>
    </div>
  );
}
