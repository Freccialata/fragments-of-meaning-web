// ---- GLOBALS -----
me.dir() => string udio_root;
Std.getenv("OS") => string host;
if (host.find("Win") != -1) {
    udio_root + "udio/" => udio_root;
}
global Pan2 garinDac;

NRev common_rev[2];
0.1 => common_rev[0].mix => common_rev[1].mix;

// ---- CLASSES -----
class Sampler extends Chugraph
{
    SndBuf2 sampledata => outlet;

    fun void open(string filename)
    {
        load(filename);
        1.0 => sampledata.rate;
        1 => sampledata.loop;
    }

    fun void load( string filename )
    {     
        filename => sampledata.read;
    }

    function void play(int sliceChoice, int sliceNum, dur duration)
    {
        sampledata.samples() / sliceNum => int slice;
        slice * sliceChoice => int position;
        sampledata.pos(position);

        Math.random2f(.87, 1) => float detune;

        sampledata.rate(detune); // Also plays the sample
        duration => now;
    }

    fun float transpose(float frequency, int semitones)
    {
        1.0594630943592952645618252949463 => float semitone;
        frequency => float result;
        if(semitones > 0)
        {
            for(1 => int j; j <= semitones; j++)
            {
                result * semitone => result;        
            }
        }
        else if(semitones < 0)
        {                 
            for(1 => int j; j <= Math.abs(semitones); j++)
            {            
                result * (1 / semitone ) => result;        
            }
        }
        return result;
    }
}

// ---- FUNCTIONS -----
fun playSamplerWithFile(int spork_id, string filepath, float gain) {
    Sampler sampler => Pan2 pan => common_rev => garinDac;
    sampler.open(filepath);
    gain * .17 => sampler.gain;

    64 => int max_PlayPos_slices;
    10 => int min_change_sPos;
    5 => int max_change_sPos;
    6 => int min_beat_dur;
    12 => int max_beat_dur;

    Math.random2f(min_beat_dur, max_beat_dur)::second => dur beat;
    Math.random2(0,max_PlayPos_slices) => int random_slice;
    Math.random2(0, max_change_sPos) => int change_samplerPos;
    Math.random2f(-.6, .6) => pan.pan;

    // <<< "START! " + spork_id,
    //     "  beat_dur=", (beat / 44100), "s",
    //     "gain=" + gain,
    //     "random_slice=" + random_slice,
    //     "change_samplerPos=" + change_samplerPos >>>;
    0 => int beat_counter;
    while(true)
    {
        // change after x beats
        sampler.play(random_slice, max_PlayPos_slices, beat);
        beat_counter++;
        if (beat_counter > change_samplerPos) {
            // <<< "CHANGE! " + spork_id,
            //     "  random_slice=" + random_slice,
            //     "change_samplerPos=" + change_samplerPos,
            //     "beat_counter=" + beat_counter >>>;
            0 => beat_counter;
            Math.random2f(-.6, .6) => pan.pan;
            Math.random2(min_change_sPos,max_change_sPos) => change_samplerPos; // Update after how much the properties will change
            Math.random2f(min_beat_dur, max_beat_dur)::second => beat; // Update beat duration
            Math.random2(0,max_PlayPos_slices) => random_slice; // Update sampling playing position
            // <<< "\tto:",
            //     "random_slice=" + random_slice,
            //     "change_samplerPos=" + change_samplerPos,
            // "\n">>>;
        }
    }
}

// ---- PLAY -----
spork ~ playSamplerWithFile(0, udio_root + "Echoes_of_Turmoil.wav", .28);
spork ~ playSamplerWithFile(1, udio_root + "Echoes_of_Obsession.wav", .28);
spork ~ playSamplerWithFile(2, udio_root + "Echoes_of_Obsession2.wav", .28);
//spork ~ playSamplerWithFile(3, udio_root + "Echoes_of_Turmoil.wav", .03);
//spork ~ playSamplerWithFile(4, udio_root + "Echoes_of_Obsession.wav", .03);
//spork ~ playSamplerWithFile(5, udio_root + "Echoes_of_Obsession2.wav", .03);

while(true) {
    1::hour => now;
}
