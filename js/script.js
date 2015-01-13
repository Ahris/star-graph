// TODO
// coloring
// redraw the star texture to draw the glow with gray
// menus on click wit da deets
// make it pretty
// get rid of scroll bar

// Shared variables for 3D
var scene, camera, controls, renderer;

// Used to detect mouse over
var mouse = new THREE.Vector2(), INTERSECTED;
var raycaster;

var menuOpen;

// Array of Three.js particles
var particles = [];

// Hashmap of THREE particles to their Game
var gameDataMap = {};

// Extra particle system in the background for effects
var bgParticles, bgParticleCount;


 
/**
 * Sends XML request that returns JSON from Metacritic
 * Goes through each console and queries for its games from metacritic
 * Creates a seperate particle system for each console
 */
function getDataAndDisplay() {
	var url; 
	var listType = "new-releases";
	var consoles = ["ps4", "xboxone", "ps3", "xbox360", "pc", "wii-u", 
	                                             "3ds", "vita", "ios"];
	// Query for the games on each console
	for (var index in consoles) {
		httpGet(consoles[index], listType);
	}
}



/**
 * Send XML request to the metacritic API
 * Documentation: https://www.mashape.com/byroredux/metacritic
 */
function httpGet(console, listType) {
	var xmlHttp;

	if (window.XMLHttpRequest) {
	    // code for IE7+, Firefox, Chrome, Opera, Safari
	    xmlHttp = new XMLHttpRequest();
	} else {
	    // code for IE6, IE5
	    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
	}

	xmlHttp.onreadystatechange = function() {
	    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
	    	var obj = eval("(" + xmlHttp.responseText + ")");
	    	displayAllGames({console:obj}, console);
	    }
	}

	url = "https://byroredux-metacritic.p.mashape.com/game-list/"+console+"/"+listType;

    xmlHttp.open("GET", url, true);
    xmlHttp.setRequestHeader("X-Mashape-Key", 
    	    "obYV1JOoYlmshGaQyAh5TLV0Yythp1gU6dbjsncZkEtK5ajhlN");
    xmlHttp.send(null);    
}



/**
 * Creates the texture for each particle.
 * Must be unique to each particle so each 
 * particle can be inidividually clicked.
 * @param path - path of the texture image
 * @return material - new material for a particle
 */
function loadTexture(path){
    var material = new THREE.SpriteMaterial({
    	color: Math.random() * 0xffffff,
	    size: 15,
        map: new THREE.ImageUtils.loadTexture(path, null, function() {
            material.opacity = 1;
        }),
        opacity: 0,
        blending: THREE.AdditiveBlending,
	    depthTest: false,
	    transparent: true,
    });
    return material;
}



/** 
 * Display all the game data as stars for one console
 * @param metacriticResult - json object returned from query 
 */
function displayAllGames(metacriticResult, console) {
	var platform = null;
	var particleGeometry = new THREE.Geometry();

    // Loops through the list of consoles
	for (var i in metacriticResult) {
		var currentGames = metacriticResult[i].results;	

        // Loop through the games on that console
		for (var j in currentGames) {		
			curGame = currentGames[j];

			// If our game has valid score, create a star for it
			if (curGame.score != "tbd") {
				var material = loadTexture("images/star2.png");	
				var particle = new THREE.Sprite(material);
				var loc = scoreToLocation(curGame.score); 

				particle.position.x = loc.x; 
				particle.position.y = loc.y;
				particle.position.z = loc.z;

				particle.scale.x = particle.scale.y = 5;

				// API doesn't keep track of consoles for each game, so add that
				// Then, add the game to the map so we can reference them on click
				curGame["platform"] = console; 
				gameDataMap[particle.uuid] = curGame; 

				particles.push(particle);
				scene.add(particle);
			}
		}
	}
}



/**
 * Converts a game's score to a star's radius
 * 
 * @param score - score of the game 
 * @return minRadius - radius value based on score
 */
function scoreToRadius(score) {
	var maxRadius = 1;
	var minRadius = .1;

	return minRadius + (score/100) * maxRadius;
}



/**
 * Return the color of the star, which is dependant on the 
 * platform and distance from the center of the galaxy
 * @param platform - platform of the game
 * @param distance - distance of star from the origin
 * @return color - hex color of the star
 * 
 * Color for each platform
 * PS4/PS3 - pale blue
 * XBone/360 - vibrant green
 * pc - purple
 * wii-u - yellow/orange
 * 3DS - 
 * vita - 
 * ios - pink  
 */
function calculateColor(platform, distance) {

}



/**
 * Get a random number between min and max
 * @param min 
 * @param max 
 * @return a random number between min (inclusive) and max (exclusive)
 */
function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}



/**
 * Converts a game's score to a 3D coordinate
 * @param score - score of the game 
 * @return a Vector3 of the position of the star
 */
function scoreToLocation(score) {
	var maxDist = 80;
	var minLowScoreDist = .8 * maxDist;
	var maxTheta = 360;
    var maxZ = 18;
    var theta, x, y, dist;

	// Get random theta and convert theta to radians
	theta = getRandomRange(0, maxTheta);
	var radiansTheta = theta / 180 * Math.PI;
															
	// Scores from 							
	// 100-80 = 20% universe
	// 80-60 = 50% universe
	// 60-0 = 30% universe
	if(score > 80) {
		dist = maxDist * .2 * ((20-(score-80))/20);
		theta = THREE.Math.degToRad(getRandomRange(0, maxTheta));
		x = dist * Math.cos(theta);							
		y = dist * Math.sin(theta);

	} else if(score > 60) {
		dist = maxDist * .5 * ((20-(score-60))/20) + (maxDist * .2);
		theta = THREE.Math.degToRad(getRandomRange(0, maxTheta));
		x = dist * Math.cos(theta);
		y = dist * Math.sin(theta);

    } else {
    	dist = maxDist * .3 * ((20-(score-60))/20) + (maxDist * .7);
		theta = THREE.Math.degToRad(getRandomRange(0, maxTheta));
		x = dist * Math.cos(theta);
		y = dist * Math.sin(theta);
    }

	// There are two spirals in our galaxy //  TODO this isnt really true...
	// Randomly choose one 
	var spiralChoice = getRandomRange(0,1);
	if(spiralChoice > .5) {
		x = dist * Math.cos(theta);
		y = dist * Math.sin(theta);
	} else {
		x = dist * Math.sin(theta);
		y = dist * Math.cos(theta);
	}

	var z = getRandomRange(-1 * maxZ, maxZ); 
	return new THREE.Vector3(x, y, z);
}



/**
 * Creates a starfield in the background of the scene
 */
function createBackgroundParticles() {
	bgParticleCount = 1000,
		bgParticleGeo = new THREE.Geometry(),
	    bgMaterial = new THREE.PointCloudMaterial({
			  color: 0x000000,
			  size: 5,
			  map: THREE.ImageUtils.loadTexture(
			    "images/particle.png"
			  ),
			  blending: THREE.AdditiveBlending,
			  depthTest: false,
			  transparent: true
			});

	// Now create the individual particles
	for (var p = 0; p < bgParticleCount; p++) {
	    // Create a particle with random
	    // Position values, -250 -> 250
	    var pX = Math.random() * 800 - 350,
		    pY = Math.random() * 800 - 350,
		    pZ = Math.random() * 800 - 350,
		    particle = new THREE.Vector3(pX, pY, pZ);
	     
	    // Create a velocity vector
		particle.velocity = new THREE.Vector3(
		    0,              // x
		    -Math.random(), // y: random velocity
		    0);             // z

	    bgParticleGeo.vertices.push(particle);
	}

	bgParticles = new THREE.PointCloud(
	    bgParticleGeo,
	    bgMaterial);

	bgParticles.sortParticles = true;   
	scene.add(bgParticles);
}



/**
 * Creates the skydome from an image 
 */
function createSkyDome() {
	var geometry = new THREE.SphereGeometry(500, 60, 40);
	var uniforms = {
	  texture: {type: 't', value: THREE.ImageUtils.loadTexture("images/bg.png") }
	};
	
	var material = new THREE.ShaderMaterial( {
	    opacity: 0,
	    uniforms: {texture: {type: 't', value: new THREE.ImageUtils.loadTexture("images/bg.png", null, function() {
		  	    material.opacity = 1;
		    })
		} },
	    vertexShader:   document.getElementById('sky-vertex').textContent,
	    fragmentShader: document.getElementById('sky-fragment').textContent
	});
	
	skyBox = new THREE.Mesh(geometry, material);
	skyBox.scale.set(-1, 1, 1);
	skyBox.rotation.order = 'XZY';
	skyBox.renderDepth = 1000.0;
	scene.add(skyBox);
}



/**
 * Trackball Control for the camera
 */
function setupTrackballControls() {
	controls = new THREE.TrackballControls(camera);  
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.8;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;    
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.keys = [65, 83, 68];
	controls.minDistance = 5;
	controls.maxDistance = 475;
	controls.addEventListener('change', render);
}



/**
 * Checks to see if the user has clicked a star and
 * displays a context menu with more information about
 * the star's game if they did
 * @param event
 */
function onDocumentMouseDown(event) {
	event.preventDefault();

	var vector = new THREE.Vector3();
	vector.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
	vector.unproject(camera);

	// raycaster = new THREE.Raycaster();
	raycaster.ray.set(camera.position, 
	     vector.sub(camera.position).normalize());

	var intersects = raycaster.intersectObjects(particles);

	// If the raycaster detects that you clicked on a star
	if (intersects.length > 0) {
		var objClicked = intersects[0].object;
		gameID = objClicked.uuid; // Get the star's UUID 
		var gameData = gameDataMap[gameID];

		//	console.log(gameDataMap[gameID]);   // Look up the game in gameDataMap using that id

		// Set random color for a star
		objClicked.material.color.setHex(Math.random() * 0xffffff);

		var popUp = document.getElementById("pop-up");

		// Close the previous menu
		if(menuOpen) {
			menuOpen = false;
			// popUp.style.visibility = "hidden";
		}

		// Display the new menu
		var menuSelector = document.getElementById("menuSelector");
		var infoBox = document.getElementById("infoBox");

		document.getElementById("gameInfo").innerHTML = 
			"<a href=\"" + gameData.url + "\" class=\"black\">"
			+ gameData.name + " / " + gameData.platform + " / " + gameData.score
			+ "</a>";

		var midPoint = setMenuPosition(objClicked, infoBox);

		displayLine(objClicked, midPoint);

		menuSelector.style.width = getObjectHeight(objClicked) + 20 + "px";
		setSelectorPosition(objClicked, menuSelector);

		menuSelector.style.visibility = "visible";
		popUp.style.visibility = "visible";
		menuOpen = true;
	}	
}



/**
 * Dispaly the line connecting the selector and the box
 * @param star -
 * @param infoBox - 
 * @param middlePoint - 
 */
function displayLine(star, midPoint) {
	// Position of star 
	var position = THREEx.ObjCoord.cssPosition(star, camera, renderer);

	// // Create SVG line
	// var newLine = "<line class=\"line menu\" x1=\"" + position.x + "\" y1=\"" 
	// + position.y + "\" x2=\"" + midPoint.x + "\" y2=\"" + midPoint.y + "\" />"; 
   
 //    //document.getElementById("svgLine").innerHTML = newLine;
 //    document.getElementById("svg").innerHTML = newLine;
 //    document.getElementById("svgLine").innerHTML = document.getElementById("svgLine").innerHTML;
 //    //console.log(document.getElementById("svgLine"));
 	// var popUp = document.getElementById("pop-up");
 	// var lineSVG = document.getElementById("line");
 	// var lineDoc = lineSVG.contentDocument;
 	// // console.log(document.getElementById("pop-up").style.visibility);
 	// var line = lineDoc.getElementById("line");


	var line = document.getElementById("lineObj").contentDocument.getElementById("line");
 	line.setAttribute("x1", position.x);
 	line.setAttribute("x2", midPoint.x);
 	line.setAttribute("y1", position.y);
 	line.setAttribute("y2", midPoint.y);
 	//line.setAttribute("visibility", "visible");

 	var svgTag = document.getElementById("lineObj").contentDocument.getElementById("svgTag");
 	svgTag.setAttribute("height", window.innerHeight);
 	svgTag.setAttribute("width", window.innerWidth);
 	// console.log(line);
}



/**
 * https://github.com/jeromeetienne/threex.objcoord
 */
function setMenuPosition(star, menu) {
	var position = THREEx.ObjCoord.cssPosition(star, camera, renderer);  // Position of star
	var offsetX = 50;
	var offsetY = 30;

	var starHeight = getObjectHeight(star) / 2;

	// Quadrant Checking
	if (position.x >= window.innerWidth / 2) {      	
		if (position.y >= window.innerHeight / 2) { 	// Bottom-right
			menu.style.left = (position.x - menu.offsetWidth - starHeight - offsetX) + "px";
			menu.style.top = (position.y - menu.offsetHeight - starHeight - offsetY) + "px";

			xMid = position.x - starHeight - offsetX;
			yMid = position.y - (menu.offsetHeight / 2) - starHeight - offsetY

			return new THREE.Vector2(xMid, yMid);
		} else {                                        // Upper-right 
			menu.style.left = (position.x - menu.offsetWidth - starHeight - offsetX) + "px";
			menu.style.top = (position.y + starHeight + offsetY) + "px";

			xMid = position.x - starHeight - offsetX;
			yMid = position.y + starHeight + offsetY + (menu.offsetHeight / 2);

			return new THREE.Vector2(xMid, yMid);
		}
	} else {
		if (position.y >= window.innerHeight / 2) { 	// Bottom-left
			menu.style.left = (position.x + starHeight + offsetX) + "px";
			menu.style.top = (position.y - menu.offsetHeight - starHeight - offsetY) + "px";

			xMid = position.x + starHeight + offsetX;
			yMid = position.y - starHeight - offsetY + (menu.offsetHeight / 2);

			return new THREE.Vector2(xMid, yMid);
		} else {                                        // Upper-left
			menu.style.left = (position.x + starHeight + offsetX) + "px";
			menu.style.top = (position.y - menu.offsetHeight - starHeight - offsetY) + "px";

			xMid = position.x + starHeight + offsetX;
			yMid = position.y - (menu.offsetHeight / 2) - starHeight - offsetY;

			return new THREE.Vector2(xMid, yMid);
		}
	}
}



/**
 * https://github.com/jeromeetienne/threex.objcoord
 */
function setSelectorPosition(object, selector) {
	var position = THREEx.ObjCoord.cssPosition(object, camera, renderer);
	selector.style.left = (position.x - selector.offsetWidth / 2) + "px";
	selector.style.top = (position.y - selector.offsetHeight / 2) + "px";
}



/**
 * Display the selector on hover
 * @param event
 */
function onDocumentMouseMove(event) {
	event.preventDefault();

	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

	// find intersections
	var vector = new THREE.Vector3(mouse.x, mouse.y, 1).unproject(camera);
	raycaster.set(camera.position, vector.sub(camera.position).normalize());
	var intersects = raycaster.intersectObjects(particles);

	if (intersects.length > 0) {
		if (INTERSECTED != intersects[0].object) {
			var selector = document.getElementById("hoverSelector");

			// Unselect the last start
			if (INTERSECTED) {
				selector.style.visibility = "hidden";
			}

			// Display the selector around the star
			INTERSECTED = intersects[0].object;

			selector.style.width = getObjectHeight(INTERSECTED) + 20 + "px";
			setSelectorPosition(INTERSECTED, selector);
			selector.style.visibility = "visible";
		}
	} else {
		// Unselect the last star if something was selected
		if (INTERSECTED) {
			var selector = document.getElementById("hoverSelector");
			selector.style.visibility = "hidden";
		}
		INTERSECTED = null;
	}
}

/**
 * Sets up the universe 
 */
function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth/
		                             window.innerHeight, 0.1, 1000 );
	camera.position.x = 115;
	camera.position.y = -115;
	camera.position.z = 119;

	document.addEventListener('mousedown', onDocumentMouseDown, false);

	document.addEventListener('mousemove', onDocumentMouseMove, false );

	setupTrackballControls();

	raycaster = new THREE.Raycaster();

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x170d2f, 1);
	var container = document.getElementById("ThreeJS");
	container.appendChild(renderer.domElement);

	// Allows scene to resize by window resizing
	THREEx.WindowResize(renderer, camera);

	// // Render Axes
	// var axes = new THREE.AxisHelper(100);
	// scene.add(axes);

	createSkyDome();
	createBackgroundParticles();
	getDataAndDisplay();
	render();
}


/**
 * Animates background particles and rotates the camera
 */
var rate = 1;
function animate() {
	// Rotate the extra particle system
	bgParticles.rotation.x += 0.0005;
	bgParticles.rotation.y += 0.0005;
	bgParticles.rotation.z += 0.0009;
		
	var r = .8;
    var g = bgParticles.material.color.g + .003 * rate;

    if (g >= .8 || g <= 0) {
        rate *= -1;
        g = bgParticles.material.color.g + .003 * rate;
    }
 
    var b = 1 - g;

	bgParticles.material.color.setRGB(r, g, b);
	// console.log(bgParticles.material.color);

	// Rotate the camera around the scene
    // camera.position.x += 0.01;
	// camera.position.y += 0.01;

	requestAnimationFrame(animate);
	controls.update();
	render();
}



function threeDimDistance(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;

    return Math.sqrt(dx*dx+dy*dy+dz*dz);
}


function getDistanceFromCamera(object) {
	return threeDimDistance(camera.position, object.position);
}



function getObjectHeight(object) {
	// convert vertical fov to radians
	var vFOV = camera.fov * Math.PI / 180;

	// visible height
	var visualHeight = 2 * Math.tan(vFOV / 2) * getDistanceFromCamera(object);

	// 5 is the size of the star... yes its hard coded... FIXME
	var heightRatio = 5 / visualHeight;

	var finalSize = window.innerHeight * heightRatio;

	return finalSize;
}



/**
 * Renders the scene
 */
function render() {
	renderer.render(scene, camera);                             
};



document.addEventListener("DOMContentLoaded", function(event) { 

 	var lineObj = document.getElementById("lineObj");
	var lineDoc = lineObj.contentDocument;

	var line = lineDoc.getElementById("line");
	line.setAttribute("id", "line")
	line.setAttribute("x1", 0);
	line.setAttribute("x2", 200);
	line.setAttribute("y1", 0);
	line.setAttribute("y2", 200);
 
	init();	
	animate();
});
