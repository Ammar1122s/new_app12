import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import { Camera, CameraType } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, LogBox, Platform, StyleSheet, View } from 'react-native';
import Canvas from 'react-native-canvas';

const TensorCamera = cameraWithTensors(Camera);

LogBox.ignoreAllLogs(true);

const { width, height } = Dimensions.get('window');

export default function App() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  let context = useRef<CanvasRenderingContext2D>();
  const canvas = useRef<Canvas>();

  function handleCameraStream(images: any) {
    console.log("Readyyyyyyyyyyy")
    const loop = async () => {
      const nextImageTensor = images.next().value;
      console.log(nextImageTensor)

      if (!model || !nextImageTensor) throw new Error('no model');

      model
        .detect(nextImageTensor)
        .then((predictions) => {
          drawRectangle(predictions, nextImageTensor);
        })
        .catch((err) => {
          console.log(err);
          console.log("I am in Errrrrroooorr")
        });

      requestAnimationFrame(loop);
    };
    loop();
  }

  function drawRectangle(
    predictions: cocoSsd.DetectedObject[],
    nextImageTensor: any
  ) {
    console.log("I am innnnnnn")
    if (!context.current || !canvas.current) {
      console.log('no context or canvas');
      return;
    }

   console.log(predictions);

    // to match the size of the camera preview
    const scaleWidth = width / nextImageTensor.shape[1];
    const scaleHeight = height / nextImageTensor.shape[0];

    const flipHorizontal = Platform.OS === 'ios' ? false : true;

    // We will clear the previous prediction
    context.current.clearRect(0, 0, width, height);

    // Draw the rectangle for each prediction
    for (const prediction of predictions) {
      const [x, y, width, height] = prediction.bbox;

      // Scale the coordinates based on the ratios calculated
      const boundingBoxX = flipHorizontal
        ? canvas.current.width - x * scaleWidth - width * scaleWidth
        : x * scaleWidth;
      const boundingBoxY = y * scaleHeight;

      // Draw the bounding box.
      context.current.strokeRect(
        boundingBoxX,
        boundingBoxY,
        width * scaleWidth,
        height * scaleHeight
      );
      // Draw the label
      context.current.fillText(
        prediction.class,
        boundingBoxX - 5,
        boundingBoxY - 5
      );
    }
  }

  const handleCanvas = async (can: Canvas) => {
    console.log("Ok")
    if (can) {
      can.width = width;
      can.height = height;
      const ctx:any = can.getContext('2d');
      const ctx1 = ctx as CanvasRenderingContext2D;
        ctx1.strokeStyle = 'red';
        ctx1.fillStyle = 'red';
        ctx1.lineWidth = 3;
    
        context.current = ctx1;
        canvas.current = can;
      
      
    }
  };

  let textureDims;
  Platform.OS === 'ios'
    ? (textureDims = { height: 1920, width: 1080 })
    : (textureDims = { height: 1200, width: 1600 });

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      await tf.ready();
      setModel(await cocoSsd.load());
      console.log("Done From here")
    })();
  }, []);

  return (
    <View style={styles.container}>
      <TensorCamera
        // Standard Camera props
        style={styles.camera}
        type={CameraType.back}
        // Tensor related props
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeHeight={200}
        resizeWidth={152}
        resizeDepth={3}
        onReady={handleCameraStream}
        autorender={true}
        useCustomShadersToResize={false}
      />

      <Canvas style={styles.canvas} ref={handleCanvas} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  canvas: {
    position: 'absolute',
    zIndex: 1000000,
    width: '100%',
    height: '100%',
  },
});
