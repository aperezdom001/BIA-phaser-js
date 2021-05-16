console.log("JS linked!");

/* ---- SETUP ---- */
    const config = {
        /* WHAT IT WILL USE TO RENDER IF WEBGL FAILS, USES CANVAS */
        type: Phaser.AUTO,

        /* SIZE OF CANVAS ELEMENT */
        width: 800,
        height: 600,

        /* GAME PHYSICS */
        /* OBJECT FACTORYL this.physics.add(foo)*/
        physics:{
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },

        /* GAME IS A SEQUENCE OF SCENES */
        /* INSTANCES NEED CRUD FUNCTIONALITY FOR RENDER */
        scene:{
            preload: preload,
            create: create,
            update: update
        }
    };

    const game = new Phaser.Game(config);
    var score = 0;
    var scoreText = 0;
    var platforms;
    var asteroids;
    var player;
    var cursor;
    var gameOver;

        /* NEED TO PRELOAD ASSETS FIRST*/ 
function preload() {
    /* ASSETS ARE SOURCED FROM THEIR SITE*/
    this.load.setBaseURL('https://labs.phaser.io/assets');

    /* FIRST PARAM IS JUST SETTING A VAR NAME*/
    /* SECOND FINISHES THE URL REFERENCE */
    this.load.image('sky', '/skies/sky4.png');
    this.load.image('ground', '/sprites/platform.png');
    // this.load.image('star', '/phaser3/star2.png');
    this.load.image('star', '/demoscene/star.png');
    this.load.image('asteroid', '/games/asteroids/asteroid2.png');
    this.load.spritesheet('dude',
        '/sprites/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
}

        /* ADDING ASSETS TO BROWSER/CANVAS */
function create() {

    /* LOADED IN ORDER OF BACK TO FRONT */
    this.add.image(400, 300, 'sky');
    // this.add.image(400, 300, 'star');

    /* SHOW PLAYER SCORE (COORDINATES, DEFAULT STRING, STYLING) */
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    

    /* PLATFORMS ARE GROUPED OBJECTS: STATIC */
    platforms = this.physics.add.staticGroup();
    createPlatforms(platforms);

    /* ---- FALLING STAR OBJECTS! ---- */
    // GROUP IS NOT STATIC
    stars = this.physics.add.group({
        key: 'star', // TEXTURE KEY
        repeat: 11, // 12 STARS IN TOTAL
        setXY: { x: 12, y: 0, stepX: 70} // SIBLING SPACING = 70px
    })

    // COLLIDE WITH PLATFORMS
    this.physics.add.collider(stars, platforms);

    // RANDOM BOUNCE VALUE
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });


    /* CREATING A PLAYER CHARACTER!!! */
    player = this.physics.add.sprite(100, 450, 'dude');

    /* SETTING SPRITE OBJECT PHYSICS*/
    player.setCollideWorldBounds(true); // STAYS WITHIN CANVAS
    player.setBounce(0.2); // BOUNCES WHEN HE HITS THE EDGE

        /* ---- FALLING ASTEROIDS (RELEASED WHEN A STAR IS COLLECTED) ---- */
        asteroids = this.physics.add.group();
    this.physics.add.collider(asteroids, platforms);
    this.physics.add.collider(player, asteroids, asteroidHit, null, this);

    /* DETECT COLLISION WITH PLATFORMS*/
    /* SO SPRITE DOESNT'T FALL THROUGH TO SCREEN BOTTOM */
    this.physics.add.collider(player, platforms);

    /* DETECT OVERLAP WITH STARS => COLLECT */
    this.physics.add.collider(stars, platforms); // ALLOW FOR COLLISION
    this.physics.add.overlap(player, stars, collectStar, null, this);
    // UPON OVERLAP, CALL collectStar();

    /* ---- ANIMATIONS!! ---- */
    this.anims.create({
        // KEYBOARD TRIGGER
        key: 'left',

        //WHICH FRAMES IN THIS SPRITESHEET TO USE
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3}),
        frameRate: 10,
        repeat: -1  // LOOPS THROUGH SET FRAMES
    });

    // PLAYER FACING FORWARD
    this.anims.create({
        key: 'turn',
        frames:[{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //

    // KEYBOARD FUNCTIONALITY
    cursors = this.input.keyboard.createCursorKeys();

}

function update() {

    // IF THE GAME IS OVER...
    if(gameOver){
        return;
    }

    /* DEFINING WHAT HAPPENS WITH EACH KEYBOARD TRIGGER*/

    if(cursors.left.isDown){
        player.setVelocityX(-160);  // LEFT = NEGATIVE X AXIS
        player.anims.play('left', true); // CALLING 'LEFT' ANIM FROM BEFORE
    } 
    
    else if(cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    
    else{
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    // JUMPING: CHECK IF ON THE FLOOR SO NO DOUBLE JUMPS //
    if(cursors.up.isDown && player.body.touching.down){
        player.setVelocityY(-300); // HEIGHT OF JUMP
    }
}

function asteroidHit(player, ast){
    // IF HIT, STOP EVERYTHING
    this.physics.pause();

    // FADE PLAYER, RESET SPRITE
    player.setTint(0xff0000);
    player.anims.play('turn');

    // END GAME
    gameOver = true;
}

function collectStar(player, star){
    // TEST
    console.log('Char collect the star');
    // MAKE STAR INVISIBLE
    star.disableBody(true, true);

    // ADD TO PLAYER SCORE
    score+=10;
    scoreText.setText('Score ' + score);

    /* -- DROP ASTEROID -- */
    // IF LAST STAR, RESET ALL STARS TO ACTIVE
    if(stars.countActive(true) === 0){
        stars.children.iterate(function (child){
            child.enableBody(true, child.x, 0, true, true);
        });
    }

    // RANDOMLY GENERATE X COORDINATE TO DROP FROM SKY
    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    dropAsteroid(x);

    // NEW ASTEROID ONLY AFTER PLAY GETS A STAR
    // dropAsteroid();
}

    function createPlatforms(platforms){
    /* SETTING THE GROUND USING A PLATFORM (SCALING UP TO FILL THE SCENE)*/
    /* ALWAYS ALWAYS USE refreshBody() WHEN RESCALING A STATIC OBJECT*/
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    /* ADDING FLOATING PLATFORMS*/
    /* NO RESCALE SO NO refesh() */
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    }

    function dropAsteroid(x){
        console.log('Astroid dropped')
        // Group.create() RETURNS INSTANCE OF NEW OBJECT
        var ast = asteroids.create(x, 16, 'asteroid').setScale(0.5);
        ast.setBounce(1);
        ast.setCollideWorldBounds(true);
        ast.setVelocity(Phaser.Math.Between(-200, 200), 200); // VARIABLE VELOCITY
    }

/* WEBSITE TUTORIAL IS OUT OF DATE. FOLLOWING preload() DOES NOT WORK BC FILESTRUCTURE DOESN'T EXIST
    http://phaser.io/tutorials/making-your-first-phaser-3-game/part2 */
// function preload() {
//     this.load.image('sky', 'assets/sky.png');
//     this.load.image('ground', 'assets/platform.png');
//     this.load.image('star', 'assets/star.png');
//     this.load.image('bomb', 'assets/bomb.png');
//     this.load.spritesheet('dude',
//         'assets/dude.png',
//         { frameWidth: 32, frameHeight: 48 }
//     );
// }