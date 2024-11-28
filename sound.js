import { Chuck } from './modules/webchuck/wc-bundle.js';

export const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
export const track1Elem = document.createElement("div");
track1Elem.textContent = "1";
export const track2Elem = document.createElement("div");
track2Elem.textContent = "2";
export const track3Elem = document.createElement("div");
track3Elem.textContent = "3";
export const g_durs = {
    min: .2,
    max: .3
}

export const dispatcherElement = document.querySelector("#open-close-listen");
const openMiEvent = new CustomEvent("openMirror");
const closeMiEvent = new CustomEvent("closeMirror");

const openForTrack = [
    () => track1Elem.dispatchEvent(openMiEvent),
    () => track2Elem.dispatchEvent(openMiEvent),
    () => track3Elem.dispatchEvent(openMiEvent),
]
const closeForTrack = [
    () => track1Elem.dispatchEvent(closeMiEvent),
    () => track2Elem.dispatchEvent(closeMiEvent),
    () => track3Elem.dispatchEvent(closeMiEvent),
]

export const startChuck = async () => {
    console.log("starting ChucK...");

    // Initialize default ChucK object, if not already initialized
    Chuck.loadChugin("./modules/webchuck/chugins/FoldbackSaturator.chug.wasm");
    window.theChuck = await Chuck.init([
        { serverFilename: "./chuck/udio/Echoes_of_Obsession.wav", virtualFilename: "Echoes_of_Obsession.wav" },
        { serverFilename: "./chuck/udio/Echoes_of_Obsession2.wav", virtualFilename: "Echoes_of_Obsession2.wav" },
        { serverFilename: "./chuck/udio/Echoes_of_Turmoil.wav", virtualFilename: "Echoes_of_Turmoil.wav" },
    ],
      undefined, undefined, './modules/webchuck/'
    );

    await sleep(1000);

    // Load ChucK files
    await theChuck.loadFile("./chuck/sample_garin.ck");
    await theChuck.loadFile("./chuck/flock_sim.ck");
    await theChuck.loadFile("./chuck/feedbackloop.ck");

    // Run ChucK code
    // trackScore();
    scoreFromChuck();
};

/** Run the Main *infinite* score from a chuck file */
const scoreFromChuck = async () => {
    await theChuck.loadFile("./chuck/main.ck");

    const g_min_dur = Math.min(g_durs.min, g_durs.max);
    const g_max_dur = Math.max(g_durs.min, g_durs.max);
    theChuck.setFloat("g_min_dur", g_min_dur);
    theChuck.setFloat("g_max_dur", g_max_dur);

    await theChuck.runFile("main.ck");

    let mirrorStatus1 = false; // true == open ; false == closed
    const openClose1 = () => {
        if (mirrorStatus1) {
            track1Elem.dispatchEvent(closeMiEvent);
        } else {
            track1Elem.dispatchEvent(openMiEvent);
        }
        mirrorStatus1 = !mirrorStatus1;
    }
    let mirrorStatus2 = false; // true == open ; false == closed
    const openClose2 = () => {
        if (mirrorStatus2) {
            track2Elem.dispatchEvent(closeMiEvent);
        } else {
            track2Elem.dispatchEvent(openMiEvent);
        }
        mirrorStatus2 = !mirrorStatus2;
    }
    let mirrorStatus3 = false; // true == open ; false == closed
    const openClose3 = () => {
        if (mirrorStatus3) {
            track3Elem.dispatchEvent(closeMiEvent);
        } else {
            track3Elem.dispatchEvent(openMiEvent);
        }
        mirrorStatus3 = !mirrorStatus3;
    }

    theChuck.startListeningForEvent("e_garin", openClose1);
    theChuck.startListeningForEvent("e_flock", openClose2);
    theChuck.startListeningForEvent("e_feedb", openClose3);
}

/** The Main *infinite* score inside JavaScript */
const trackScore = async () => {
    await theChuck.loadFile("./chuck/select.ck");

    const t0 = new Track(0);
    const t1 = new Track(1);
    const t2 = new Track(2);

    await t0.play();
    await sleep(7100);
    await t0.stop();
    
    await t1.play();
    await sleep(7000);
    await t1.stop();

    await t2.play();
    await sleep(7100);
    await t2.stop();
}

/** The Track to play the score inside JavaScript */
class Track {
    /**
     * 
     * @param {number} id 
     */
    constructor(id) {
        if (id < 0 || id > 2) {
            throw new Error(`Track id ${id} does not exist!`);
        }
        this.id = id;
    }

    async play() {
        console.log("Playing track", this.id); 
        this.selector_shred_id = await theChuck.runFileWithArgs("select.ck", this.id.toString());
        // this.track_shred_id = await theChuck.getInt("selected_track");
        openForTrack[this.id]();
    }

    async stop() {
        // await theChuck.removeShred(this.track_shred_id);
        // await theChuck.removeShred(this.selector_shred_id);
        await theChuck.signalEvent("stop_self");
        closeForTrack[this.id]();
    }
}
