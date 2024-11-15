// ---------- GLOBALS ----------
Envelope keys(700::ms)[2];
Dyno limiters[2];
limiters[0] => keys[0] => dac.left;
limiters[1] => keys[1] => dac.right;
limiters[0].limit();
limiters[1].limit();

global Pan2 garinDac => Envelope garinKeys(700::ms)[2] => limiters;
global Pan2 flockDac => Envelope flockKeys(700::ms)[2] => limiters;
global Pan2 fdbkDac => Envelope fdbkKeys(700::ms)[2] => limiters;

global Event e_garin;
global Event e_flock;
global Event e_feedb;
global float g_min_dur;
global float g_max_dur;

<<<"Min dur", g_min_dur, "| Max dur", g_max_dur>>>;

15::second => dur bar;
4::second => dur mix_dur;

// ---------- CLASSES ----------
class Composizione extends Chugraph {
    string path;
    int started;
    int shred_id;
    Event @ e_status;
    Envelope @ env_key[2];

    fun @construct(string name, Event e, Envelope env[]) {
        me.dir() + name => path;
        e @=> e_status;
        env @=> env_key;
    }

    fun int equals(Composizione other) {
        return path == other.path;
    }

    fun start() {
        if (started == 0) {
            Machine.add(path) => shred_id;
            e_status.signal();
        } else {
            <<< "Cannot start shred that is already started. Create another class instance. ID", shred_id >>>;
        }
        1 => started;
    }

    fun stop() {
        if (started == 1) {
            Machine.remove(shred_id);
            e_status.signal();
        } else {
            <<< "Cannot remove shred that is not started. ID", shred_id >>>;
        }
        0 => started;
    }

    fun startWithKey() {
        start();
        env_key[0].keyOn();
        env_key[1].keyOn();
        env_key[0].duration() => now;
    }

    fun stopWithKey() {
        env_key[0].keyOff();
        env_key[1].keyOff();
        env_key[0].duration() => now;
        stop();
    }

    fun playFor(dur duration) {
        startWithKey();
        duration => now;
        stopWithKey();
    }
}

// ---------- FUNCTIONS ----------
fun startGlobalKey() {
    keys[0].keyOn();
    keys[1].keyOn();
}

fun stopGlobalKey() {
    keys[0].keyOff();
    keys[1].keyOff();
}

// ---------- PLAY ----------
[
new Composizione("sample_garin.ck", e_garin, garinKeys),
new Composizione("flock_sim.ck", e_flock, flockKeys),
new Composizione("feedbackloop.ck", e_feedb, fdbkKeys),
] @=> Composizione composizioni[];

2::second => now;
startGlobalKey();

Composizione last_comp;
while (true) {
    Math.random2(0, 2) => int comp_choice;
    Composizione @ curr_comp;
    composizioni[comp_choice] @=> curr_comp;
    if (curr_comp.equals(last_comp)) {
        composizioni[(comp_choice+1)%3] @=> curr_comp;
    }
    while (curr_comp.started == 1) {
        <<<curr_comp.path, "Already started.", "Inside while loop">>>;
        composizioni[(comp_choice+1)%3] @=> curr_comp;
    }

    Math.random2f(g_min_dur, g_max_dur)::minute => dur curr_dur;
    spork ~ curr_comp.playFor(curr_dur);

    curr_comp @=> last_comp;
    if (Math.randomf() < .8) {
        curr_dur => now;
    } else {
        curr_dur*0.8 => now;
    }
}
stopGlobalKey();
