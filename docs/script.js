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
    this.load.image('asteroid', '/sprites/wizball.png');
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
        // Write get element by classname visibility
        const gameOverElement = document.querySelector('.gameover');
        const submitButton = document.querySelector('.submit');
        submitButton.addEventListener("click", gameOver);
        if (gameOverElement.style.display === "none") {
            gameOverElement.style.display = "block";
          } else {
            gameOverElement.style.display = "none";
          }
        // as soon as you lose, take off the class name
        // in css give the class a hidden thing/ middle of screen
        
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
        console.log('Enemy descends');
        // Group.create() RETURNS INSTANCE OF NEW OBJECT
        var ast = asteroids.create(x, 10, 'asteroid').setScale(0.5);
        ast.setBounce(1);
        ast.setCollideWorldBounds(true);
        ast.setVelocity(Phaser.Math.Between(-200, 200), 200); // VARIABLE VELOCITY
    }

    function attackEnemy(){}

/* ----- MY BACK END FRONT END CODE ----- */ 

// VARIABLES FOR MY BACKEND API //
const BIA_BACKEND = 'http://localhost:8080/player';
// const BIA_INITIALS = 'http://localhost:8080/player';
// const BIA_SCORE = 'http://localhost:8080/player';
// const BIA_ID = 'http://localhost:8080/player';


    // CONNECTING MY BACKEND //
const dataElementContainer = document.querySelector('#data');
const dataButtonElement = document.querySelector('#data-button'); // Leaderboard Display
const submitDataButtonElement = document.querySelector('#submit'); // Submit Form

let initials = null;


// dataButtonElement.addEventListener('click', async (e) => {
//   try {
//     const response = await fetch(BIA_BACKEND);
//     const data = await response.json();
//     const playerInfoDivs = 
//     `<div>
//       <p>Initials: ${data.initials}</p>
//       <p>Score: ${data.score}</p>
//       </div>`
//     dataElement.innerHTML = playerInfoDivs;
//   } catch(error){
//    console.error(error)
//   }
// });

const addPlayerInfo = async(data) => {
    console.log(data);
    console.log("pepsi");
    const playerInfoDivs = 
        `<div>
          <p>Initials: ${data.initials}</p>
          <p>Score: ${data.score}</p>
          </div>`

    dataElementContainer.innerHTML = playerInfoDivs;
}

// CRUD FUNCTIONALITY FOR FRONT END 

// GET PLAYER

const getPlayerInfo = async() => {
    console.log("hi");
    try {
        const response = await fetch(BIA_BACKEND);
        const data = await response.json();
        addPlayerInfo(data);
    }catch(err){
        console.log(err);
    }
}

// CREATE PLAYER
const createPlayer = async () => {
    const body = {
        initials,
        score
    }
    try{
        const response = await fetch(BIA_BACKEND, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    }catch (error){
        console.log(err)
    }
}

// // READ PLAYER
// const getPlayer = async () => {
//     const body = {
//         initials,
//         score
//     }
//     try{
//         const response = await fetch(BIA_INITIALS, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json"
//             },
//             body: JSON.stringify(body)
//         });
//     }catch (error){
//         console.log(err)
//     }
// }

// UPDATE PLAYER
const updatedPlayer = async () => {
    const body = {
        initials,
        score
    }
    try{
        const response = await fetch(BIA_BACKEND, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    }catch (error){
        console.log(err)
    }
}

// DELETE PLAYER
const deletePlayer = async () => {
    const body = {
        initials,
        score
    }
    try{
        const response = await fetch(BIA_ID, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    }catch (error){
        console.log(err)
    }
}


// BACKEND EVENT LISTENERS - When form is submitted, creates data that sends to backend
// and displays to the screen when leaderboard button is clicked
// DONT NEED the delete and update functions because the player wont interact with it
// IT WILL ON
dataButtonElement.addEventListener("click", getPlayerInfo); // LEADERBOARD
submitDataButtonElement.addEventListener("click",addPlayerInfo); // SUBMIT FORM


// VARIABLES FOR MY THIRD PARTY API //
const GENIUS_MUSIC = 'https://api.genius.com/search?q=Cafe%20Tacvba&access_token=N0_NNZHi7ZgQFGIdrU_GYDPwI3uVrab6SIg4v3Lk6vcDd4I6WtpKhijwjdySMo21';

//CONNECTING MY THIRD PARTY API //
const musicElementContainer = document.querySelector('.musicdataContainer');
const musicButtonElement = document.querySelector('#music-button');

//RANDOM GEN TEST
const musicArr= [
    'Soda Stereo - De Musica Ligera',
    'Los Enanitos Verdes - Lamento Boliviano',
    'Alaska Y Dinarama - A quien le importa',
    'Mon Laferte - Mi Buen Amor', 
    'Cafe Tacvba - Maria'
];

const genRandomMusic = () => {
    let num = Math.floor(Math.random() * musicArr.length);
    // musicArr.split('').join('%20');
    return musicArr[num];
}

genRandomMusic();
console.log(genRandomMusic());


const addMusicInfo = async(data) => {
    console.log(data);
    const randomMusicDivs = 
        `<div>
        <h5>Artist & Song: ${data.response.hits[0].result.full_title}</h5>
        </div>`

    musicElementContainer.innerHTML = randomMusicDivs;
}
const getMusicInfo = async() => {
    try {
        const response = await fetch(GENIUS_MUSIC);
        const data = await response.json();
        addMusicInfo(data);
    }catch(err){
        console.log(err);
    }
}

//EVENT LISTENERS 
musicButtonElement.addEventListener("click", getMusicInfo);

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