// Flock Sim

// Boids sim guide: http://www.kfish.org/boids/pseudocode.html

// Time to int
// now => time start_t; int id; ((now - start_t) / 1::ms / 1000) $ int => id;

0 => int last_id;

class Vec2 {
    0 => float x;
    0 => float y;

    fun @construct( float in_x, float in_y ) {
        in_x => x;
        in_y => y;
    }

    fun void sumToSelf(Vec2 other) {
        x + other.x => x;
        y + other.y => y;
    }

    fun void subToSelf(Vec2 other) {
        x - other.x => x;
        y - other.y => y;
    }

    // Vector magnitude
    fun float mag() {
        return Math.sqrt(x*x+y*y);
    }

    fun void print() {
        <<< "Vec2=(" + x + ", " + y + ")" >>>;
    }
}

class Boid {
    int id;
    Vec2 pos;
    Vec2 vel;

    fun @construct() {
        ++last_id => id;
    }

    fun @construct( float x, float y ) {
        ++last_id => id;
        x => pos.x;
        y => pos.y;
    }

    fun void print()
    {
        <<< "Boid n.", id, "pos=(" + pos.x + ", " + pos.y + ")" >>>;
    }
}

// Initialise Boids positions -----------------------------
[
    new Boid(110, 234),
    new Boid(320, 234),
    new Boid(440, 234),
    new Boid(440, 234),
] @=> Boid boids[];
boids.cap() => int boids_num;

SawOsc saw[boids_num];
TriOsc trio[boids_num];
saw => LPF lowp[boids_num] => Chorus chor[boids_num] => global Pan2 flockDac;

.2 => float start_gain;
for (0 => int i; i<boids_num; i++) {
    start_gain => saw[i].gain;
    0 => trio[i].gain;

    300::ms => chor[i].baseDelay;
    .5 => chor[i].modDepth;
    .7 => chor[i].modFreq;
    .4 => chor[i].mix;
}

fun toggle_random_osc() {
    Math.random2(0, boids_num-1) => int boid_choice;
    if (saw[boid_choice].gain() > 0) {
        0 => saw[boid_choice].gain;
        start_gain => trio[boid_choice].gain;
        saw[boid_choice] =< lowp[boid_choice];
        trio[boid_choice] => lowp[boid_choice];
    } else if (trio[boid_choice].gain() > 0) {
        0 => trio[boid_choice].gain;
        start_gain => saw[boid_choice].gain;
        trio[boid_choice] =< lowp[boid_choice];
        saw[boid_choice] => lowp[boid_choice];
    }
}

fun void sound_boids() {
    for (0 => int i; i<boids_num; i++) {
        boids[i] @=> Boid @ b;
        Math.clampf(b.pos.x, 120, 600) => saw[i].freq => trio[i].freq;
        Math.clampf(b.pos.y, 120, 600) => lowp[i].freq;
    }
}

fun void print_boids() {
    <<<"------------------------">>>;
    for (0 => int i; i<boids_num; i++) {
        boids[i].print();
    }
}

fun void move_all_boids_to_new_positions() {
    Vec2 @ v1;
    Vec2 @ v2;
    Vec2 @ v3;
    Vec2 @ v4;
    Boid @ b;

    for (0 => int i; i<boids_num; i++) {
        boids[i] @=> b;
        rule1(b) @=> v1;
        rule2(b) @=> v2;
        rule3(b) @=> v3;
        bound_position(b) @=> v4;

        b.vel.sumToSelf(v1);
        b.vel.sumToSelf(v2);
        b.vel.sumToSelf(v3);
        b.vel.sumToSelf(v4);
        b.pos.sumToSelf(b.vel);
    }
}

// Rule 1: Boids try to fly towards the centre of mass of neighbouring boids.
fun Vec2 rule1(Boid bj) {
    Vec2 pcJ;
    Boid @ b;

    for (0 => int i; i<boids_num; i++) {
        boids[i] @=> b;
        if (b.id != bj.id) {
            pcJ.sumToSelf(b.pos);
        }
    }
    pcJ.x / boids_num-1 => pcJ.x; // pcJ = pcJ / N-1
    pcJ.y / boids_num-1 => pcJ.y;

    pcJ.subToSelf(bj.pos);
    pcJ.x / 100 => pcJ.x; // move by 1%
    pcJ.y / 100 => pcJ.y;
    return pcJ;
}

// Rule 2: Boids try to keep a small distance away from other objects (including other boids)
fun Vec2 rule2(Boid bj) {
    10 => float unit_distance;
    Vec2 c;
    Boid @ b;
    for (0 => int i; i<boids_num; i++) {
        boids[i] @=> b;
        if (b.id != bj.id) {
            Vec2 dist_vec;
            b.pos.x => dist_vec.x; // to make a manual copy
            b.pos.y => dist_vec.y;
            dist_vec.subToSelf(bj.pos);

            dist_vec.mag() => float dist;
            // |b.position - bj.position| < 100
            if (dist < unit_distance) { // keep distance of N units
                // c = c - (b.position - bj.position)
                c.subToSelf(dist_vec);
            }
        }
    }
    return c;
}

// Rule 3: Boids try to match velocity with near boids
fun Vec2 rule3(Boid bJ) {
		Vec2 pvJ;
        Boid @ b;
        for (0 => int i; i<boids_num; i++) {
            boids[i] @=> b;
            if (b.id != bJ.id) {
				pvJ.sumToSelf(b.vel);
			}
		}

        pvJ.x / boids_num-1 => pvJ.x; // pvJ = pvJ / N-1
        pvJ.y / boids_num-1 => pvJ.y;

        pvJ.subToSelf(bJ.vel); // (pvJ - bJ.velocity) / 8
        pvJ.x / 8 => pvJ.x;
        pvJ.y / 8 => pvJ.y;
		return pvJ;
}

fun Vec2 bound_position(Boid b) {
    80 => float dir_change;
    170 => float Xmin;
    430 => float Xmax;
    455 => float Ymin;
    530 => float Ymax;
    Vec2 v;

    if (b.pos.x < Xmin) {
        dir_change => v.x;
    } else if (b.pos.x > Xmax) {
        -dir_change => v.x;
    }
    if (b.pos.y < Ymin) {
        dir_change => v.y;
    } else if (b.pos.y > Ymax) {
        -dir_change => v.y;
    }
    
    return v;
}

now + 5::second => time time_to_change;
30::ms => dur tempo;
while(true) {
    sound_boids();
    move_all_boids_to_new_positions();
    // print_boids();
    tempo => now;
    if (now >= time_to_change) {
        now + Math.random2f(1.5, 6)::second => time_to_change;
        toggle_random_osc();
        Math.random2f(10, 80)::ms => tempo;
        // <<< "new tempo:", tempo / 44.1 >>>;
        // print_boids();
    }
}
