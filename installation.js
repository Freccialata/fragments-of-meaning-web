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

/** @type {MixerAction[]} */
const mixer_action_s = [];

class MixerAction {
    /**
     * 
     * @param {string} id 
     * @param {THREE.AnimationMixer} mixer 
     * @param {THREE.AnimationAction} action 
     */
    constructor(id, mixer, action) {
        this.id = id;
        this.mixer = mixer;
        this.action = action;
        this.halfwayreached = false;
        this.endreached = false;
    }
}

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
    scene.add( new THREE.AmbientLight( 0x38144a ) ); // 0x38144a
    // const mainLight = new THREE.DirectionalLight( 0xffffff, 1 );
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
        model1.position.set( 0, 0, 0 );
        model1.scale.set( 5, 5, 5 );

        const arm_3dprinted = model1.children[0].children[3].children[0].children[0].children[0];
        const mirror_refl_orig = arm_3dprinted.children[1];
        mirror_refl_orig.removeFromParent();
        const mirror_back_non_reflective = arm_3dprinted.children[0];
        mirror_back_non_reflective.layers.set(2);

        const model2 = model1.clone();
        const model3 = model1.clone();
        // NB. Clone models before adding reflectors!
        mirror_back_non_reflective.add(createMirrorAsReflector());

        model2.position.set( 0, 0, 2.3 );
        model2.rotation.set(0, -Math.PI/6, 0);
        const mirror_back_non_reflective1 = model2.children[0].children[3].children[0].children[0].children[0].children[0];
        mirror_back_non_reflective1.add(createMirrorAsReflector());
        
        model3.position.set( 0, 0, -2.3 );
        model3.rotation.set(0, Math.PI/6, 0);
        const mirror_back_non_reflective2 = model3.children[0].children[3].children[0].children[0].children[0].children[0];
        mirror_back_non_reflective2.add(createMirrorAsReflector());

        scene.add( model1, model2, model3 );

        /** @type {THREE.AnimationClip} */
        const common_animation = gltf.animations[0];
        assignFuncsOpenClose(track1Elem, model1, common_animation);
        assignFuncsOpenClose(track2Elem, model2, common_animation);
        assignFuncsOpenClose(track3Elem, model3, common_animation);

        let meshCount = 0;
        scene.traverse(obj3d => {
            if (obj3d.isMesh) {
                obj3d.castShadow = true;
                obj3d.receiveShadow = true;
                if(obj3d.material.map) obj3d.material.map.anisotropy = 16;
                obj3d.geometry.normalizeNormals();
                obj3d.geometry.computeVertexNormals();
                obj3d.geometry.normalizeNormals();
                meshCount++;
            }
        })
        console.log("Set shadows and normals to", meshCount, "meshes");

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

    }, undefined, function ( e ) {

        console.error( e );

    } );

}

function animate() {

    const delta = clock.getDelta();

    mixer_action_s.forEach(mixer_action => {
        const mixer = mixer_action.mixer;
        mixer.update(delta)

        // Gestione dell'apertura e chiusura, permette di riconoscere quando lo specchio è chiuso
        const action = mixer_action.action;
        const time = action.time;
        const duration = action.getClip().duration;
        if (time >= duration * .55 && time <= duration * .58 && !mixer_action.halfwayreached) {
            // Specchio chiuso, mette in pausa l'animazione
            action.paused = true;
            mixer_action.halfwayreached = true;
            mixer_action.endreached = false;
        }
        if (time >= duration * .98 && !mixer_action.endreached) {
            // Specchio aperto, reset 'halfwayreached', l'animazione è terminata, ripartirà da un evento di ChucK
            mixer_action.endreached = true;
            mixer_action.halfwayreached = false;
        }
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

/**
 * 
 * @returns {Reflector}
 */
const createMirrorAsReflector = () => {
    const disc_geo = new THREE.CircleGeometry( .7, 64 );
    const aMirror = new Reflector( disc_geo, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xb5b5b5,
    } );
    aMirror.rotation.set(89.5, 91.1, 0);
    aMirror.scale.set(.14, .14, .14);
    aMirror.position.set(0, .02, 0);
    aMirror.camera.layers.enable(1);
    return aMirror;
}

/**
 * 
 * @param {THREE.AnimationMixer} mixer 
 * @param {THREE.AnimationClip} animation 
 * @param {number} startTime 
 * @returns {THREE.AnimationAction}
 */
const createAction = (mixer, animation) => {
    const action = mixer.clipAction(animation);
    action.timeScale = 1;            // Velocità normale
    action.startAt(0);               // Parte da 0 secondi
    action.time = 0;
    action.setLoop(THREE.LoopOnce);  // Esegue solo una volta
    action.clampWhenFinished = true; // Ferma l'animazione quando finisce
    action.paused = true;            // azione in pausa, viene avviata manualmente
    return action;
}

/**
 * 
 * @param {HTMLDivElement} trackNElem 
 * @param {THREE.Object3D} model 
 * @param {THREE.AnimationClip} animation 
 */
const assignFuncsOpenClose = (trackNElem, model, animation) => {
    const mixer = new THREE.AnimationMixer( model );
    const action_open_close = createAction(mixer, animation);

    mixer_action_s.push(new MixerAction(trackNElem.textContent, mixer, action_open_close));

    const closeMirror = async () => {
        action_open_close.reset();
        action_open_close.play();
        // L'animazione si mette in pausa a metà nell'animation loop 'animate()'
    }
    const openMirror = async () => {
        // La riapertura si verifica rimettendo in play l'animazione
        action_open_close.paused = false;
    }
    trackNElem.addEventListener("openMirror", openMirror);
    trackNElem.addEventListener("closeMirror", closeMirror);
}

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