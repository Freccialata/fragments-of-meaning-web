// ---- GLOBALS -----
Pan2 outs => global Pan2 fdbkDac;
// "outs" connects to all upstream shreds/graphs (like a "null node")

602::ms => dur note_dur;

Event new_session_event;

// ---- CLASSES -----
class FeedBackLoop extends Chugraph {
    inlet => Delay dly => ADSR graceful_stop => Dyno limiter => outlet;
    dly => inlet =>
    FoldbackSaturator foldy =>
    HPF cut_lowest => LPF cut_highest =>
    BRF pas2 => 
    dly;

    BRF pas1; BRF pas3;
    limiter.limit();
    0::ms => limiter.attackTime => limiter.releaseTime;
    0.3 => limiter.slopeAbove;

    // Delay params
    note_dur => dly.max;
    dly.max() => dly.delay;
    .9 => dly.gain;

    // Gracefull stop param
    Math.random2f(21, 25) => float release_time_multiplier;
    (1::ms, 1::ms, 1, note_dur*release_time_multiplier) => graceful_stop.set;
    
    // Avoid blow up params
    35 => cut_lowest.freq;
    1142 => cut_highest.freq;

    // Band pass filters params
    218 => pas1.freq;
    420 => pas2.freq;
    901 => pas3.freq;
    4 => pas1.Q;
    11 => pas2.Q;
    7 => pas3.Q;

    // Foldback Saturator params
    0.8 => foldy.threshold;
    .5 => foldy.makeupGain;

    fun void randomiseBandPass() {
        Math.random2f(101, 303) => pas1.freq;
        Math.random2f(370, 798) => pas2.freq;
        Math.random2f(820, 1080) => pas3.freq;
        Math.random2f(12, 30) => pas1.Q;
        Math.random2f(12, 30) => pas2.Q;
        Math.random2f(12, 30) => pas3.Q;
    }

    fun void randomiseFoldThresh() {
        Math.random2f(0.83, 0.94) => foldy.threshold;
    }

    fun void randomiseDelayTime() {
        Math.random2f(0.1, 1) * note_dur => dly.delay;
    }

    fun void start() {
        graceful_stop.keyOn();
    }

    fun void stop() {
        graceful_stop.keyOff();
        graceful_stop.releaseTime() => now;
    }
}

class FeedBackSession extends Chugraph {
    randomOsc() @=> Osc @ beep;
    beep => BPF beep_pass => ADSR beep_start => FeedBackLoop feedb => outlet;
    beep.freq() => beep_pass.freq;
    Math.random2f(1.7, 5) => beep_pass.Q;

    (1::ms, note_dur, 0, 1::ms) => beep_start.set;

    fun void playRandomBeep() {
        Math.random2f(53, 219) => beep.freq;
        .8 => beep.gain;
        beep.freq() => beep_pass.freq;
        beep_start.keyOn();
        note_dur => now;
        beep_start.keyOff();
    }

    fun dur releaseTime() {
        return feedb.graceful_stop.releaseTime();
    }

    fun void randomiseBandPass() {
        feedb.randomiseBandPass();
    }

    fun void lowProbRandomise() {
        feedb.randomiseDelayTime();
        feedb.randomiseFoldThresh();
    }

    fun void start() {
        feedb.start();
        playRandomBeep();
    }

    fun void stop() {
        feedb.stop();
    }
}

// ---- FUNCTIONS -----
fun Osc randomOsc() {
    Math.random2(0, 5) => int choice;

    // Switch
    if (choice == 0) {
        return SinOsc abeep;
    } else if (choice == 1) {
        return SawOsc abeep;
    } else if (choice == 2) {
        return TriOsc abeep;
    } else if (choice == 3) {
        // A simple FM synth for the beep
        SinOsc mod1 => SinOsc carrier;
        2 => carrier.sync;
        0.8 => carrier.gain;
        220 => carrier.freq;
        110 => mod1.freq;
        500 => mod1.gain;
        return carrier;
    } else { // Default
        // SqrOsc more frequent, sounds cooler
        return SqrOsc abeep;
    }
}

fun void playOneFeedbackSession() {
    // <<< "# A session started..." >>>;
    FeedBackSession session => Pan2 panner => outs;
    .25 => session.gain;
    session.lowProbRandomise();
    session.start();

    Math.random2f(-.45, .45) => panner.pan;

    session.releaseTime()/1.2 => dur thread_duration; // was 4!
    now + thread_duration => time thread_stop_at;
    while (now < thread_stop_at) {
        Math.random2f(.1, 2.7) => float to_shuffle;
        to_shuffle::second => now;
        session.randomiseBandPass();
        if (to_shuffle >= 2.1) {
            session.playRandomBeep();
        }
    }
    new_session_event.signal();
    session.stop();
}

// ------- PLAY -------
spork ~ playOneFeedbackSession();

while (true) {
    // wait on new_session_event
    new_session_event => now;
    spork ~ playOneFeedbackSession();
}
