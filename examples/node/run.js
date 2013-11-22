var Scry = require('../../scry');

// Function to use for output
var output = console.log;

// Here is my object - a crystal ball. It can be moved,
// polished, or broken. Just like the one at Grandma's house. But
// with a narrator.
function CrystalBall(x, y) {
    this.position = {
        x: x,
        y: y
    };
    this.polished = false;
    this.broken = false;
}
CrystalBall.prototype.move = function(x, y) {
    if (!this.broken) {
        this.position.x = x;
        this.position.y = y;
        this.polished = false;
        output("Narrator: The crystal ball has been moved to (" + x + ", " + y + "). Also, dirty hands have left its gleaming surface unpolished!");
    } else {
        output("Narrator: The crystal ball is broken - it can't be moved!");
    }
};
CrystalBall.prototype.admire = function(who) {
    who = who || 'Someone';
    if (this.broken) {
        output("Narrator: " + who + " has a hard time admiring a broken crystal ball!");
    } else if (!this.polished) {
        output("Narrator: " + who + " thinks that this crystal ball might be pretty, if it wasn't so unpolished.");
    } else {
        output("Narrator: " + who + " admires a beautifully polished crystal ball!");
    }
};
CrystalBall.prototype.polish = function() {
    if (!this.broken) {
        this.polished = true;
        output("Narrator: The crystal ball is now nicely polished.");
    } else {
        output("Narrator: The crystal ball is broken - it can't be polished!");
    }
};
CrystalBall.prototype.shatter = function(device) {
    if (!this.broken) {
        this.broken = true;
        output("Narrator: The crystal ball was shattered with a " + device + "! What a sad day.");
    } else {
        output("Narrator: The crystal ball is already broken, and it can't be shattered even more. Not even with a " + device + ".");
    }
};
CrystalBall.prototype.fix = function() {
    if (!this.broken) {
        output("Narrator: If it ain't broke, don't fix it.");
    } else {
        output("Narrator: As if by magic, the crystal ball is fixed!");
        this.broken = false;
    }
};

var crystalBall = new CrystalBall(0,0);

// Let's make sure that our crystal ball can be watched
// We don't include 'admire', because we really don't care if the
// ball is being admired or not.
Scry.gaze(crystalBall, ['move', 'polish', 'shatter', 'fix']);

// Now, let's add a witch, set to guard the crystal ball.
var witch = {};
// If the ball is moved, she'll move it back and polish it.
witch.moveBackId = crystalBall.scry.watch('move', function() {
    output("Witch: Who moved this? I'm putting it back where it belongs.");
    // We use scry.quietly, since otherwise the witch would be
    // alerted that the crystal ball was moved even when she moved
    // it - an infinite loop.
    crystalBall.scry.quietly('move', witch.moveBackId, 0, 0);
    output("Witch: And now the ball is filthy. I can fix that!");
    crystalBall.polish();   // We can just call polish like normal
});
witch.cryOutId = crystalBall.scry.watch('shatter', function(device) {
    output("Witch: Curses! Who brought a " + device + " in here? My crystal ball is shattered! I'm leaving!");
    // Now that it is shattered, she's going to stop watching
    crystalBall.scry.unwatch([witch.moveBackId, witch.cryOutId]);
});

// Here, we'll add a clumsy wizard to come in and do some tampering!
var wizard = {};
wizard.timesMoved = 0;
wizard.tamper = function() {
    // Usually, he'll try to move the crystal ball to a random
    // location, but sometimes he's clumsy and he'll accidentally
    // break it
    output("Wizard: Tee hee! I'm moving the crystal ball!");
    var doesItBreak = (Math.random() < 0.28 * wizard.timesMoved);
    if (doesItBreak) {
        crystalBall.shatter('clumsy wizard');
        output("Wizard: Ooops! I'll fix it.");
        crystalBall.fix();
        crystalBall.move(0, 0);
        crystalBall.polish();
    } else {
        var rand = function() { return Math.floor(Math.random() * 5) + 1; };
        crystalBall.move(rand(), rand());
        wizard.timesMoved += 1;
    }
};

// Lastly, there is the witch's cat, who is watching the ball, and
// admiring it whenever it get's polished.
var cat = {};
cat.admireId = crystalBall.scry.watch('polish', function() {
    crystalBall.admire('The cat');
});
cat.shriekId = crystalBall.scry.watch('shatter', function() {
    output('Cat: Hssss!');
});

// Now, the wizard will move the ball every two seconds, until he
// breaks it.
var stop = false;
crystalBall.scry.watch('fix', function() { stop = true; });
var timeoutFun = function() {
    output('\n');
    wizard.tamper();
    if (!stop) {
        setTimeout(timeoutFun, 2000);
    } else {
        crystalBall.scry.unwatchAll();
        crystalBall.move(0,0);
        crystalBall.polish();
    }
};
setTimeout(timeoutFun, 500);

