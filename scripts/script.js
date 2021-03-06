"use strict";


// SETTINGS of this demo:
const SETTINGS = {
  pivotOffsetYZ: [-0.2, -0.5], // XYZ of the distance between the center of the cube and the pivot
};


// some globalz :
var THREECAMERA;

// callback : launched if a face is detected or lost
function detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback() : DETECTED');
  } else {
    console.log('INFO in detect_callback() : LOST');
  }
}


// build the 3D. called once when Jeeliz Face Filter is OK
function init_threeScene(spec) {
  const threeStuffs = THREE.JeelizHelper.init(spec, detect_callback);

  let HATOBJ3D = new THREE.Object3D();
  // Create the JSONLoader for our hat
  const loader = new THREE.BufferGeometryLoader();
  // Load our cool hat
  loader.load(
    '../models/new_long_hat/6.json',
    function (geometry) {
      // we create our Hat mesh
      const mat = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load("../models/new_long_hat/black.jpg")
      });

      const HATMESH = new THREE.Mesh(geometry, mat);

      HATMESH.scale.multiplyScalar(1.3);
      //4
      // HATMESH.rotation.set(.1, -.2, 0); //(TD, )
      // HATMESH.position.set(.1, 1.3, -.25);  //(LR, TD, FB) 

      //5
      // HATMESH.rotation.set(.3, 6.2  , 0); //(TD, rotate, circle)
      // HATMESH.position.set(.1, .95, -.5);  //(LR, TD, FB) 

      //6
      HATMESH.rotation.set(.3, 6.2  , 0); //(TD, rotate, circle)
      HATMESH.position.set(.1, .6, -.8);  //(LR, TD, FB) 

      HATMESH.frustumCulled = false;
      HATMESH.side = THREE.DoubleSide;


      // CREATE THE MASK
      const maskLoader = new THREE.BufferGeometryLoader();
      /*
      faceLowPolyEyesEarsFill.json has been exported from dev/faceLowPolyEyesEarsFill.blend using THREE.JS blender exporter with Blender v2.76
      */
      maskLoader.load('../models/mask/faceLowPolyEyesEarsFill2.json', function (maskBufferGeometry) {
        const vertexShaderSource = 'varying vec2 vUVvideo;\n\
        varying float vY, vNormalDotZ;\n\
        const float THETAHEAD=0.25;\n\
        void main() {\n\
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);\n\
          vec4 projectedPosition=projectionMatrix * mvPosition;\n\
          gl_Position=projectedPosition;\n\
          \n\
          //compute UV coordinates on the video texture :\n\
          vec4 mvPosition0 = modelViewMatrix * vec4( position, 1.0 );\n\
          vec4 projectedPosition0=projectionMatrix * mvPosition0;\n\
          vUVvideo=vec2(0.5,0.5)+0.5*projectedPosition0.xy/projectedPosition0.w;\n\
          vY=position.y*cos(THETAHEAD)-position.z*sin(THETAHEAD);\n\
          vec3 normalView=vec3(modelViewMatrix * vec4(normal,0.));\n\
          vNormalDotZ=pow(abs(normalView.z), 1.5);\n\
        }';

         const fragmentShaderSource = "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUVvideo;\n\
        varying float vY, vNormalDotZ;\n\
        void main() {\n\
          vec3 videoColor=texture2D(samplerVideo, vUVvideo).rgb;\n\
          float darkenCoeff=smoothstep(-0.15, 0.15, vY);\n\
          float borderCoeff=smoothstep(0.0, 0.85, vNormalDotZ);\n\
          gl_FragColor=vec4(videoColor*(1.-darkenCoeff), borderCoeff );\n\
          // gl_FragColor=vec4(borderCoeff, 0., 0., 1.);\n\
          // gl_FragColor=vec4(darkenCoeff, 0., 0., 1.);\n\
        }";

        const mat = new THREE.ShaderMaterial({
          vertexShader: vertexShaderSource,
          fragmentShader: fragmentShaderSource,
          transparent: true,
          flatShading: false,
          uniforms: {
            samplerVideo:{ value: THREE.JeelizHelper.get_threeVideoTexture() }
          },
          transparent: true
        });
        maskBufferGeometry.computeVertexNormals();
        const FACEMESH = new THREE.Mesh(maskBufferGeometry, mat);
        FACEMESH.frustumCulled = false;
        FACEMESH.scale.multiplyScalar(1.12);
        FACEMESH.position.set(0, 0.5, -0.75);
        

        HATOBJ3D.add(HATMESH);
        HATOBJ3D.add(FACEMESH);
        addDragEventListener(HATOBJ3D);

        threeStuffs.faceObject.add(HATOBJ3D);
      });
    }
  );

  // CREATE A LIGHT
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  threeStuffs.scene.add(ambient);

  // CREATE THE CAMERA
  THREECAMERA = THREE.JeelizHelper.create_camera();
} // end init_threeScene()

// Entry point, launched by body.onload():
function main(){
  JeelizResizer.size_canvas({
    canvasId: 'jeeFaceFilterCanvas',
    callback: function(isError, bestVideoSettings){
      init_faceFilter(bestVideoSettings);
    }
  });
}

function init_faceFilter(videoSettings){
  // Here we set a different pivotOffset value so that the mask fits better
  THREE.JeelizHelper.set_pivotOffsetYZ(SETTINGS.pivotOffsetYZ);

  JEEFACEFILTERAPI.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCpath: '../req/dist/', // path of NNC.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      if (errCode) {
        console.log('AN ERROR HAPPENED. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
      init_threeScene(spec);
    }, // end callbackReady()

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      THREE.JeelizHelper.render(detectState, THREECAMERA);
    } // end callbackTrack()
  }); // end JEEFACEFILTERAPI.init call
} // end main()

