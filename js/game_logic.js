var gameBoard = [];
var gameObjects = {
	"fence": {},
	"catHeadDown": {},
	"catHeadRight": {},
	"catHeadLeft": {},
	"catHeadUp": {},
	"catBody": {},
	"catBody_Enemy": {}, 
	"fruits": {},
	"flower_grass": {}
};
var boardWidth = 20;
var boardHeight = 20;
var tileDelta = 0.25;
var catDelta = 0.01;
var eyeDelta = 0.3;

var catQueue = [];
var catQueue_enemy = [];
var currentKey = null;

/** SOUNDS **/
var biteSound = new Audio('sounds/bite.wav');
var wallHit = new Audio('sounds/wall_hit.wav');
var catHit = new Audio('sounds/cat_hit.wav');
var bgMusic = new Audio('sounds/background.mp3');
bgMusic.loop = true;

function loadObjects(){
	//https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/apple.json
	gameObjects.fence.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/fence.json");
	
	gameObjects.catHeadDown.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/catHead.json");
	gameObjects.catHeadDown.pos = [0, 0];
	gameObjects.catHeadDown.boardPos = [0, 0];
	gameObjects.catHeadDown.rotation = 0;
	
	gameObjects.catHeadRight.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/catHeadRight.json");
	gameObjects.catHeadRight.pos = [0, 0];
	gameObjects.catHeadRight.boardPos = [0, 0];
	
	gameObjects.catHeadLeft.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/catHeadLeft.json");
	gameObjects.catHeadLeft.pos = [0, 0];
	gameObjects.catHeadLeft.boardPos = [0, 0];
	
	gameObjects.catHeadUp.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/catHeadUp.json");
	gameObjects.catHeadUp.pos = [0, 0];
	gameObjects.catHeadUp.boardPos = [0, 0];
	
	gameObjects.catBody.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/catBody.json");
	gameObjects.catBody.pos = [0, 0];
	gameObjects.catBody.boardPos = [0, 0];
	 
	gameObjects.fruits = [];
	
	var cherry = {};
	var cherryData = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/cherry.json");
	cherry.data = cherryData;
	cherry.pos = [0, 0];
	cherry.name = "fruit";
	gameObjects.fruits.push(cherry);
	
	var grapes = {};
	var grapesData = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/grapes.json");
	grapes.data = grapesData;
	grapes.pos = [0, 0];
	grapes.name = "fruit";
	gameObjects.fruits.push(grapes);
	
	var apple = {};
	var appleData = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/apple.json");
	apple.data = appleData;
	apple.pos = [0, 0];
	apple.name = "fruit";
	gameObjects.fruits.push(apple);
	
	gameObjects.flower_grass.data = generateFromJSON("https://raw.githubusercontent.com/katmit/caterpillar/master/model_data/flower_grass.json");
	gameObjects.flower_grass.pos = [0, 0];

}

function initGameBoard(){
	gameBoard.length = 0; //clear the array
	var xMin = -tileDelta * (boardWidth / 2);
	var yMax = tileDelta * (boardHeight / 2);
	console.log(xMin + ", " + yMax);
	for(var i = 0; i <= boardHeight; i++){
		var boardRow = [];
		for(var j = 0; j <= boardWidth; j++){
			boardRow.push({
				"coords": [xMin + (j * tileDelta), yMax - (i * tileDelta)],
				"xDir": 0,
				"yDir": 0,
				"obj": []
			});
		}
		gameBoard.push(boardRow);
	}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function processInput(){
	var headTile = gameBoard[catQueue[0].gridY][catQueue[0].gridX];
		switch(currentKey){
			case "up":
				if(headTile.yDir == -1){ return; }
				
				
				catQueue[0].objRef = gameObjects.catHeadUp;
				headTile.xDir = 0;
				headTile.yDir = 1;
				break;
			case "down":
				if(headTile.yDir == 1){ return; }
				catQueue[0].objRef = gameObjects.catHeadDown;
				headTile.xDir = 0;
				headTile.yDir = -1;
				break;
			case "left":
				if(headTile.xDir == 1){ return; }
				
				catQueue[0].objRef = gameObjects.catHeadLeft;
				headTile.xDir = -1;
				headTile.yDir = 0;
				break;
			case "right":
				if(headTile.xDir == -1){ return; }
				catQueue[0].objRef = gameObjects.catHeadRight;
				headTile.xDir = 1;
				headTile.yDir = 0;
				break;
		}
	currentKey = null;
}

var fruit = null;
function spawnFruit(){
	var x = Math.floor(Math.random() * boardWidth);
	var y = Math.floor(Math.random() * boardHeight);
	while(gameBoard[y][x].obj.length != 0){
		console.log(x + ", " + y + " was occupied!");
		x = Math.floor(Math.random() * boardWidth);
		y = Math.floor(Math.random() * boardHeight);
	}
	console.log("placing fruit at " + x + ", " + y);
	fruit = gameObjects.fruits[Math.floor(Math.random() * gameObjects.fruits.length)];
	gameBoard[y][x].obj = fruit;
	mat4.translate(fruit.data[0].translateMatrix, fruit.data[0].translateMatrix, 
				   vec3.fromValues(gameBoard[y][x].coords[0] - fruit.pos[0],
				   gameBoard[y][x].coords[1] - fruit.pos[1], 0));
	fruit.pos[0] = gameBoard[y][x].coords[0];
	fruit.pos[1] = gameBoard[y][x].coords[1];
}

var animationDelta = tileDelta / 5.0;
async function gameLoop(){
	//restart the music, start playing it
	bgMusic.currentTime = 0;
	bgMusic.play();
	//hide the start button
	document.getElementById("startBtn").style.visibility = "hidden";
	document.getElementById("scoreLbl").style.visibility = "visible";
	
	//place the intial fruit object
	fruit = gameObjects.fruits[Math.floor(Math.random() * gameObjects.fruits.length)];
	gameBoard[(boardWidth / 2) + 4][boardHeight / 2].obj = fruit;
	mat4.translate(fruit.data[0].translateMatrix, fruit.data[0].translateMatrix, 
				   vec3.fromValues(gameBoard[(boardWidth / 2) + 4][boardHeight / 2].coords[0] - fruit.pos[0],
				   gameBoard[(boardWidth / 2) + 4][boardHeight / 2].coords[1] - fruit.pos[1], 0));
	fruit.pos[0] = gameBoard[(boardWidth / 2) + 4][boardHeight / 2].coords[0];
	fruit.pos[1] = gameBoard[(boardWidth / 2) + 4][boardHeight / 2].coords[1];
	
	var clock = new Date();
	var lastEnemyMove = clock.getTime();
	var enemyRespawnTime = clock.getTime();
	var growCaterpiller = false;
	var growEnemyCaterpiller = false;
	
	while(true){
		clock = new Date();
		//check for user input
		if(currentKey != null){
			processInput();
		}
		
		//MOVE PLAYER CATERPILLAR
		for(var i = 1; i <= catQueue.length; i++){
			var current = catQueue.shift();
			current.oldGridX = current.gridX; //for use in animation?
			current.oldGridY = current.gridY;
			current.gridX+= gameBoard[current.oldGridY][current.oldGridX].xDir;
			current.gridY-= gameBoard[current.oldGridY][current.oldGridX].yDir;
			
			if(current.name == "head"){ //head of the worm
				try{
					if(gameBoard[current.gridY][current.gridX].obj.length != 0 && gameBoard[current.gridY][current.gridX].obj != fruit){
					    catHit.play();
						handleGameOver("Stop hitting yourself!");
						return;  
					}else if(gameBoard[current.gridY][current.gridX].obj == fruit){
						biteSound.play();
						growCaterpiller = true;
						spawnFruit();
					}
					gameBoard[current.gridY][current.gridX].xDir = gameBoard[current.oldGridY][current.oldGridX].xDir;
					gameBoard[current.gridY][current.gridX].yDir = gameBoard[current.oldGridY][current.oldGridX].yDir;
				}catch(TypeError){ //hit the side of the board
					wallHit.play();
					handleGameOver("Try to avoid hitting walls.");
					return;
				}		
			}
			gameBoard[current.oldGridY][current.oldGridX].obj = [];
			gameBoard[current.gridY][current.gridX].obj = current;
			current.x = gameBoard[current.gridY][current.gridX].coords[0];
			current.y = gameBoard[current.gridY][current.gridX].coords[1];
			catQueue.push(current); //put at the end of the line
		}
		
		//ADD UNIT TO THE CATERPILLAR
		if(growCaterpiller){
			var endOfWorm = catQueue[catQueue.length - 1];
			var newX = Math.max(0, Math.min(endOfWorm.gridX - gameBoard[endOfWorm.gridY][endOfWorm.gridX].xDir, boardWidth - 1));
			var newY = Math.max(0, Math.min(endOfWorm.gridY + gameBoard[endOfWorm.gridY][endOfWorm.gridX].yDir, boardHeight - 1));
			gameBoard[newY][newX].obj = newCatBody(gameBoard[newY][newX].coords[0], gameBoard[newY][newX].coords[1], newY, newX);
			gameBoard[newY][newX].obj.oldGridX = Math.max(0, Math.min(newX + gameBoard[endOfWorm.gridY][endOfWorm.gridX].xDir, boardWidth - 1));
			gameBoard[newY][newX].obj.oldGridY = Math.max(0, Math.min(newY + gameBoard[endOfWorm.gridY][endOfWorm.gridX].yDir, boardHeight - 1));
			gameBoard[newY][newX].xDir = gameBoard[endOfWorm.gridY][endOfWorm.gridX].xDir;
			gameBoard[newY][newX].yDir = gameBoard[endOfWorm.gridY][endOfWorm.gridX].yDir;
			catQueue.push(gameBoard[newY][newX].obj);
			document.getElementById("scoreLbl").innerHTML = "Your Length: " + catQueue.length;
			growCaterpiller = false;
		}
		
		//ANIMATION
	 	for(var j = 1; j <= 5; j++){
			//shift the eye position to follow the caterpillar
			var eyeX = gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].xDir == -1? gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].coords[0] - (j * animationDelta):
								 gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].xDir == 1? gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].coords[0] + (j * animationDelta): catQueue[0].x;
			var eyeY = gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].yDir == -1? gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].coords[1] - (j * animationDelta):
								 gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].yDir == 1? gameBoard[catQueue[0].oldGridY][catQueue[0].oldGridX].coords[1] + (j * animationDelta): catQueue[0].y;
			Eye = [eyeX * eyeDelta, eyeY * eyeDelta, Eye[2], 1.0];
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
			//RENDER SCENERY
			renderScenery();
			//RENDER FRUIT
			if(fruit != null){
				renderUnit(fruit.data[0]);
			}
			//RENDER CATERPILLAR
			for(var i = 0; i < catQueue.length; i++){
				var animX;
				try{
					animX = gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].xDir == -1? gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].coords[0] - (j * animationDelta):
						    gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].xDir == 1? gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].coords[0] + (j * animationDelta): catQueue[i].x;
				
				}catch(e){
					console.log("at " + i);
					console.log(catQueue[i]);
					throw e;
				}
				var animY = gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].yDir == -1? gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].coords[1] - (j * animationDelta):
								 gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].yDir == 1? gameBoard[catQueue[i].oldGridY][catQueue[i].oldGridX].coords[1] + (j * animationDelta): catQueue[i].y;
				mat4.translate(catQueue[i].objRef.data[0].translateMatrix, catQueue[i].objRef.data[0].translateMatrix,
							   vec3.fromValues(animX - catQueue[i].objRef.pos[0], animY - catQueue[i].objRef.pos[1], 0));
				catQueue[i].objRef.pos[0] = animX;
				catQueue[i].objRef.pos[1] = animY;
				renderUnit(catQueue[i].objRef.data[0]);
			}
			await sleep(30);
		} 
		
		
		try{
			if(gameBoard[catHead.gridY - gameBoard[catHead.gridY][catHead.gridX].yDir][catHead.gridX + gameBoard[catHead.gridY][catHead.gridX].xDir].obj.length != 0 && 
			  (gameBoard[catHead.gridY - gameBoard[catHead.gridY][catHead.gridX].yDir][catHead.gridX + gameBoard[catHead.gridY][catHead.gridX].xDir].obj.name != "fruit")){
					catHit.play();
					handleGameOver("Stop hitting yourself!");
					return;
			}
		}catch(TypeError){}
		
	}	
}

function newCatBody(xPos, yPos, gridY, gridX){
	return {"name": "body", "objRef": gameObjects.catBody, "x": xPos, "y": yPos, "gridY":gridY, "gridX":gridX};
}

function newCatHead(xPos, yPos, gridY, gridX){
	return {"name": "head", "objRef": gameObjects.catHeadDown, "x": xPos, "y": yPos, "gridY":gridY, "gridX":gridX};
}


function handleGameOver(message){
	bgMusic.pause();
	bgMusic.currentTime = 0;
	document.getElementById("notifier").innerHTML = "Game Over!";
	document.getElementById("notifier").style.visibility = "visible";
	document.getElementById("notifierSub").innerHTML = message;
	document.getElementById("notifierSub").style.visibility = "visible";
	document.getElementById("startBtn").onclick = restartGame;
	document.getElementById("startBtn").innerHTML = "Try Again";
	document.getElementById("startBtn").style.visibility = "visible";
}

function restartGame(){
	document.getElementById("scoreLbl").innerHTML = "Your Length: 3";
	document.getElementById("notifier").style.visibility = "hidden";
	document.getElementById("notifierSub").style.visibility = "hidden";
	catQueue = [];
	gameBoard = [];
	currentKey = null;
	setUpGame();
	gameLoop();
}

function setUpGame(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
	catQueue.length = 0; //clear caterpillar queue
	initGameBoard();
	renderScenery();
  
	gameBoard[boardWidth / 2][boardHeight / 2].obj = newCatHead(0, 0, boardWidth / 2, boardWidth / 2);
	gameBoard[boardWidth / 2][boardHeight / 2].yDir = -1;
	gameBoard[(boardWidth / 2) - 1][boardHeight / 2].obj = newCatBody(gameBoard[(boardWidth / 2) - 1][boardHeight / 2].coords[0],
																	  gameBoard[(boardWidth / 2) - 1][boardHeight / 2].coords[1],
																	  (boardWidth / 2) - 1, boardWidth / 2);
	gameBoard[(boardWidth / 2) - 1][boardHeight / 2].yDir = -1;
	gameBoard[(boardWidth / 2) - 2][boardHeight / 2].obj = newCatBody(gameBoard[(boardWidth / 2) - 2][boardHeight / 2].coords[0],
																	  gameBoard[(boardWidth / 2) - 2][boardHeight / 2].coords[1],
																	  (boardWidth / 2) - 2, boardWidth / 2);
	gameBoard[(boardWidth / 2) - 2][boardHeight / 2].yDir = -1;
  					
	mat4.translate(gameObjects.catHeadDown.data[0].translateMatrix, gameObjects.catHeadDown.data[0].translateMatrix, 
				 vec3.fromValues(gameBoard[boardWidth / 2][boardHeight / 2].coords[0] - gameObjects.catHeadDown.pos[0],
				 gameBoard[boardWidth / 2][boardHeight / 2].coords[1] - gameObjects.catHeadDown.pos[1], 0));
	gameObjects.catHeadDown.pos[0] = gameBoard[boardWidth / 2][boardHeight / 2].coords[0];
	gameObjects.catHeadDown.pos[1] = gameBoard[boardWidth / 2][boardHeight / 2].coords[1];
	// mat4.translate(gameObjects.catHeadDown.data[0].translateMatrix, gameObjects.catHeadDown.data[0].translateMatrix, 
				 // vec3.fromValues(1 - gameObjects.catHeadDown.pos[0], 1 - gameObjects.catHeadDown.pos[0], 0));
	// gameObjects.catHeadDown.pos[0] = 1;
	// gameObjects.catHeadDown.pos[1] = 1;
	// mat4.translate(gameObjects.catHeadDown.data[0].translateMatrix, gameObjects.catHeadDown.data[0].translateMatrix, 
				   // vec3.fromValues(0 - gameObjects.catHeadDown.pos[0], 0 - gameObjects.catHeadDown.pos[0], 0));
	// mat4.rotate(gameObjects.catHeadDown.data[0].rotateMatrix, gameObjects.catHeadDown.data[0].rotateMatrix,
							 // Math.PI - gameObjects.catHeadDown.rotation, vec3.fromValues(0, 0, 1));
	// mat4.translate(gameObjects.catHeadDown.data[0].translateMatrix, gameObjects.catHeadDown.data[0].translateMatrix, 
				   // vec3.fromValues(-gameObjects.catHeadDown.pos[0], -gameObjects.catHeadDown.pos[0], 0));
	 // gameObjects.catHeadDown.rotation = Math.PI;	
	
	renderUnit(gameObjects.catHeadDown.data[0]);
	catQueue.push(gameBoard[boardWidth / 2][boardHeight / 2].obj);
	
 	mat4.translate(gameObjects.catBody.data[0].translateMatrix, gameObjects.catBody.data[0].translateMatrix, 
				 vec3.fromValues(gameBoard[(boardWidth / 2) - 1][boardHeight / 2].coords[0] - gameObjects.catBody.pos[0],
				 gameBoard[(boardWidth / 2) - 1][boardHeight / 2].coords[1] - gameObjects.catBody.pos[1], 0));
	gameObjects.catBody.pos[0] = gameBoard[(boardWidth / 2) - 1][boardHeight / 2].coords[0];
	gameObjects.catBody.pos[1] = gameBoard[(boardWidth / 2) - 1][boardHeight / 2].coords[1];
	renderUnit(gameObjects.catBody.data[0]);
	catQueue.push(gameBoard[(boardWidth / 2) - 1][boardHeight / 2].obj);
   
	mat4.translate(gameObjects.catBody.data[0].translateMatrix, gameObjects.catBody.data[0].translateMatrix, 
				 vec3.fromValues(gameBoard[(boardWidth / 2) - 2][boardHeight / 2].coords[0] - gameObjects.catBody.pos[0],
				 gameBoard[(boardWidth / 2) - 2][boardHeight / 2].coords[1] - gameObjects.catBody.pos[1], 0));
	gameObjects.catBody.pos[0] = gameBoard[(boardWidth / 2) - 2][boardHeight / 2].coords[0];
	gameObjects.catBody.pos[1] = gameBoard[(boardWidth / 2) - 2][boardHeight / 2].coords[1];
	renderUnit(gameObjects.catBody.data[0]);
	catQueue.push(gameBoard[(boardWidth / 2) - 2][boardHeight / 2].obj); 
}

function renderScenery(){
	//render fence
	renderUnit(gameObjects.fence.data[0]);
	
	//render flowers
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(-3.75 - gameObjects.flower_grass.pos[0], 1 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [-3.75, 1];
	renderUnit(gameObjects.flower_grass.data[0]);
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(-1 - gameObjects.flower_grass.pos[0], 3.75 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [-1, 3.75];
	renderUnit(gameObjects.flower_grass.data[0]);
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(1.5 - gameObjects.flower_grass.pos[0], 4 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [1.5, 4];
	renderUnit(gameObjects.flower_grass.data[0]);
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(3.75 - gameObjects.flower_grass.pos[0], 2.25 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [3.75, 2.25];
	renderUnit(gameObjects.flower_grass.data[0]);
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(4 - gameObjects.flower_grass.pos[0], -2 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [4, -2];
	renderUnit(gameObjects.flower_grass.data[0]);
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(1 - gameObjects.flower_grass.pos[0], -3.5 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [1, -3.5];
	renderUnit(gameObjects.flower_grass.data[0]);
	mat4.translate(gameObjects.flower_grass.data[0].translateMatrix, gameObjects.flower_grass.data[0].translateMatrix,
				   vec3.fromValues(-3.75 - gameObjects.flower_grass.pos[0], -4 - gameObjects.flower_grass.pos[1], 0));
	gameObjects.flower_grass.pos = [-3.75, -4.];
	renderUnit(gameObjects.flower_grass.data[0]);
}


function main() {
	setupWebGL(); // set up the webGL environment
	setupShaders();
	heightRatio = 1 / gl.drawingBufferHeight;
	widthRatio = 1 / gl.drawingBufferWidth;
	loadObjects();
	setUpGame();
	document.getElementById("startBtn").style.visibility = "visible";
}