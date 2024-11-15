if (me.args() < 1) {
	<<<"non so cosa selezionare, aggiungi :<id file> come argomento">>>;
	me.exit();
}

global Pan2 myDac;
global Event stop_self;

Envelope passthru(500::ms)[2];
myDac.left => Dyno limOutL => passthru[0] => dac.left;
myDac.right => Dyno limOutR => passthru[1] => dac.right;
limOutL.limit();
limOutR.limit();

passthru[0].keyOn();
passthru[1].keyOn();

Std.atoi(me.arg(0)) => int option;

int selected_track;
if (option == 0) {
	Machine.add("sample_garin.ck") => selected_track;
} else if (option == 1) {
	Machine.add("flock_sim.ck") => selected_track;
} else if (option == 2) {
	Machine.add("feedbackloop.ck") => selected_track;
} else {
	<<<"Non c'è un file corrispondente a", option>>>;
	me.exit();
}
<<< "New track spawned", selected_track >>>;

while(true) {
	stop_self => now;
	break;
	1::hour => now;
}

passthru[0].keyOff();
passthru[1].keyOff();
passthru[0].duration() => now;
Machine.remove(selected_track);
me.exit();
