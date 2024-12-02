import * as THREE from 'three';

// import Stats from 'three/addons/libs/stats.module.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { track1Elem, track2Elem, track3Elem } from './sound.js';


const mixers = [];

const clock = new THREE.Clock();
const container = document.getElementById( 'container-3D' );

// const stats = new Stats();
// container.appendChild( stats.dom );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
let composer, gtaoPass;

let scene;
const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 100 );

export const renderInstallation = () => {
    container.appendChild( renderer.domElement );

    const pmremGenerator = new THREE.PMREMGenerator( renderer );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x0a050c );

    // Lights
    scene.add( new THREE.AmbientLight( 0x38144a ) );
    const mainLight = createLight(0xeeeeee, 400, 8, 10, 5);
    const secondLight = createLight(0xcacacc, 300, -8, 10, -5);
    secondLight.lookAt(0, 0, .3);
    scene.add( mainLight, secondLight );

    scene.environment = pmremGenerator.fromScene( scene, 0.04 ).texture;

    camera.layers.enable(1);
    camera.layers.enable(2);
    camera.position.set( -5, 2, 0 );
    camera.lookAt( 0, 0, .3 );

    // Floor
    const geometry = new THREE.PlaneGeometry( 10, 10 );
    const material = new THREE.MeshStandardMaterial( {color: 0x49474a, side: THREE.FrontSide} );
    const plane = new THREE.Mesh( geometry, material );
    plane.name = "tavolo";
    plane.rotation.set(-Math.PI/2, 0, 0);
    scene.add( plane );

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'three/addons/libs/draco/gltf/' );

    const loader = new GLTFLoader();
    loader.setDRACOLoader( dracoLoader );
    loader.load( 'model/installation.glb',
        function ( gltf ) {
            /** @type {THREE.Scene} */
            const model1 = gltf.scene;
            model1.scale.set( 5, 5, 5 );
            model1.name = "garin";
            createAndAttachMirror(model1);

            const model2 = model1.clone();
            model2.position.set( 0, 0, 2.3 );
            model2.rotation.set(0, -Math.PI/6, 0);
            model2.name = "flock";
            const model3 = model1.clone();
            model3.position.set( 0, 0, -2.3 );
            model3.rotation.set(0, Math.PI/6, 0);
            model3.name = "feedb";
            // createAndAttachMirror(model2);
            // the mirror/reflector is cloned with model1 (not the reflector's camera I guess)
            // createAndAttachMirror(model3);

            scene.add(model1, model2, model3);

            setupMixerAndActionsForModel(track1Elem, model1, gltf.animations);
            setupMixerAndActionsForModel(track2Elem, model2, gltf.animations);
            setupMixerAndActionsForModel(track3Elem, model3, gltf.animations);
        }, undefined, e => console.error(e)
    ); // END gltf load

    // Postprocessing
    composer = new EffectComposer( renderer );
    composer.addPass( new RenderPass( scene, camera ) );

    gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    composer.addPass( gtaoPass );
    gtaoPass.blendIntensity = 0.63;
    const aoParameters = {
        radius: 0.25,
        distanceExponent: 1.,
        thickness: 1.,
        scale: 1.,
        samples: 16,
        distanceFallOff: 1.,
        screenSpaceRadius: false,
    };
    const pdParameters = {
        lumaPhi: 10.,
        depthPhi: 2.,
        normalPhi: 3.,
        radius: 4.,
        radiusExponent: 1.,
        rings: 2.,
        samples: 16,
    };
    gtaoPass.updateGtaoMaterial( aoParameters );
    gtaoPass.updatePdMaterial( pdParameters );

    const outputPass = new OutputPass();
    composer.addPass( outputPass );

    // initGui(aoParameters, pdParameters);

    renderer.setAnimationLoop( animate );
}

//

function animate() {

    const delta = clock.getDelta();

    mixers.forEach(mixer => {
        mixer.update(delta);
    });

    // stats.update();
    
    composer.render( scene, camera );
}

window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    composer?.setSize(window.innerWidth, window.innerHeight);
    gtaoPass?.setSize(window.innerWidth, window.innerHeight);
};

//

/**
 * 
 * @param {THREE.Mesh} model 
 */
const createAndAttachMirror = (model) => {
    const mirror_non_reflective = model.getObjectByName('mirror');
    if (!mirror_non_reflective) {
        console.error('Could not find mirror (non-reflective part aswell)');
        return;
    }
    const mirror_reflective_orig = model.getObjectByName('mirror_reflective');
    if (!mirror_reflective_orig) {
        console.error('Could not find original reflective mirror');
        return;
    }

    mirror_non_reflective.layers.set(2);
    mirror_reflective_orig.removeFromParent();
    const disc_geo = mirror_reflective_orig.geometry.clone();
    // const disc_geo = new THREE.CircleGeometry(0.57, 64);
    const aMirror = new Reflector( disc_geo, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xc1cbcb,
    } );
    // aMirror.rotation.set(80, 90, 0);
    // aMirror.scale.set(0.14, 0.14, 0.14);
    // aMirror.position.set(-.03, 0, 0);
    aMirror.layers.set(2);
    aMirror.camera.layers.enable(1);
    // scene.add(aMirror);
    mirror_non_reflective.add(aMirror);
}

/**
 * 
 * @param {HTMLDivElement} track_n_elem_listener 
 * @param {THREE.Object3D} model 
 * @param {THREE.AnimationClip[]} animations 
 */
const setupMixerAndActionsForModel = (track_n_elem_listener, model, animations) => {
    const open_animation = animations[0];
    const close_animation = animations[1];
    const mixer = new THREE.AnimationMixer(model);
    const open_action = mixer.clipAction(open_animation);
    open_action.setLoop(THREE.LoopOnce);
    open_action.clampWhenFinished = true;
    const close_action = mixer.clipAction(close_animation);
    close_action.setLoop(THREE.LoopOnce);
    mixers.push(mixer);

    const openMirror = async () => {
        close_action.stop();
        open_action.reset();
        open_action.play();
    };
    const closeMirror = async () => {
        open_action.stop();
        close_action.reset();
        close_action.play();
    };
    track_n_elem_listener.addEventListener("openMirror", openMirror);
    track_n_elem_listener.addEventListener("closeMirror", closeMirror);
}

/**
 * 
 * @param {THREE.ColorRepresentation} color 
 * @param {number} intensity 
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns 
 */
const createLight = (color, intensity, x, y, z) => {
    const light = new THREE.SpotLight( color, intensity );
    light.castShadow = true;
    light.angle = Math.PI / 5;
    light.shadow.camera.near = 8;
    light.shadow.camera.far = 200;
    light.penumbra = 0.3;
    light.position.set(x,y,z);
    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.bias = - 0.002;
	light.shadow.radius = 4;
    return light;
}

/**
 * Gui per la gestione dei parametri dell'ambient occlusion. Usata solo in fase di sviluppo, non in produzione.
 * 
 * @param {*} aoParameters 
 * @param {*} pdParameters 
 */
const initGui = (aoParameters, pdParameters) => {
    // Init gui
    const gui = new GUI();

    gui.add( gtaoPass, 'output', {
        'Default': GTAOPass.OUTPUT.Default,
        'Diffuse': GTAOPass.OUTPUT.Diffuse,
        'AO Only': GTAOPass.OUTPUT.AO,
        'AO Only + Denoise': GTAOPass.OUTPUT.Denoise,
        'Depth': GTAOPass.OUTPUT.Depth,
        'Normal': GTAOPass.OUTPUT.Normal
    } ).onChange( function ( value ) {

        gtaoPass.output = value;

    } );

    gui.add( gtaoPass, 'blendIntensity' ).min( 0 ).max( 1 ).step( 0.01 );
    gui.add( aoParameters, 'radius' ).min( 0.01 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'distanceExponent' ).min( 1 ).max( 4 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'thickness' ).min( 0.01 ).max( 10 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'distanceFallOff' ).min( 0 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'scale' ).min( 0.01 ).max( 2.0 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( aoParameters, 'screenSpaceRadius' ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
    gui.add( pdParameters, 'lumaPhi' ).min( 0 ).max( 20 ).step( 0.01 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
    gui.add( pdParameters, 'depthPhi' ).min( 0.01 ).max( 20 ).step( 0.01 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
    gui.add( pdParameters, 'normalPhi' ).min( 0.01 ).max( 20 ).step( 0.01 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
    gui.add( pdParameters, 'radius' ).min( 0 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
    gui.add( pdParameters, 'radiusExponent' ).min( 0.1 ).max( 4. ).step( 0.1 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
    gui.add( pdParameters, 'rings' ).min( 1 ).max( 16 ).step( 0.125 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
    gui.add( pdParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
}