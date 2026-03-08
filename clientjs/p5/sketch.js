// Alex Norton
// a^N 
// https://design.alexnortn.com


"use strict";

let toxi = require('toxiclibsjs'),
	p5 = require('p5'),
	$ = require('jquery'),
	Particle = require('./particle.js'),
	Attractor = require('./attractor.js'),
	MakeButton = require('./makeButton.js'),
	vertices = require('./data/verts.json');

	// p5.dom
	// let dom = require('../../node_modules/p5/lib/addons/p5.dom.js');
	
	// Previous 2018 working line « note removed in 2021 due to library addition into principal p5 codebase
	// require('p5/lib/addons/p5.dom');

let _options = {
	width: 100,
	height: 100,
	anchor: null,
	mobile: false,
	phone: false,
	tablet: false,
};

let _canvas = $.Deferred(),
	_render = true;


// Running the sketch in instance mode, don't forget to preface all P5 methods with { p }
let glyph = function (p) {

	// Reference to physics world
	let physics;

	// Canvas
	let canvas;

	let aLockVert = [],
		aSpringVert = [],
		aSpringArr = [],
		aCounterLockVert = [],
		aCounterSpringVert = [],
		aCounterSpringArr = [],
		nLockVert = [],
		nSpringVert = [],
		nSpringArr = [],
		w,h,
		gravity,
		gravityStrength,
		xOff,
		mousePos,
		scaleFactor,
		nScaleFactor,
		center,
		glyphCenter,
		nOffset,
		phi,
		alphaOpa,
		timeOut,
		timeOut1,
		alphaOpa1,
		lineOp,
		glyphOp,
		tempSelection,
		aCenterOffset,
		clockBool,
		bigGlyph,
		aVerts = [],
		aCounterVerts = [],
		nVerts = [];

	// Global interaction states
	let _perlin = $.Deferred(),
		_vertex = $.Deferred(),
		_force  = $.Deferred(),
		_bounce = $.Deferred();

	let _slow = false,
		_slowFn;

	let _renderMode,
		_renderMan;

	var car = {type:"Fiat", model:"500", color:"white"};

	let glyph_obj = 
		{
			img: [],
			x: 0,
			y: 0,
			x_offset: 0,
			y_offset: 0,
			dynamic: {},
			lock: {},
			spring: {},
			width: 100,
			height: 100
		};

	let nudgeAttractor; 

	// Resolve before sketch runs
	p.preload = function() {
		glyph_obj.img = p.loadImage("/images/logo-main.png");
	}

	p.setup = function() {

		canvas = p.createCanvas(window.innerWidth, window.innerHeight);
		canvas.parent('web-lab');
		canvas.id('glyph');

		_canvas.resolve(canvas.elt); // --> Sneaky deferred shenanigans

		p.noStroke();
		
		phi = (1 + p.sqrt(5)) / 2;

		w = p.windowWidth;
		h = p.windowHeight;

		scaleFunc(w,h);

		mousePos = p.createVector();
		xOff = 0;
		alphaOpa = 0;
		alphaOpa1 = 0;
		glyphOp = 0;
		lineOp = 0;
		timeOut = 500;
		timeOut1 = 400;

		// Address N Scaling
		nScaleFactor = 0.3;
		nOffset = p.createVector(250, -500);

		// Centering functions
		center = p.createVector(w/2, h/2);
		glyphCenter = p.createVector();
		aCenterOffset = p.createVector();

		// Setup render mode [fluid, perlin, debug]
		_renderMode = "perlin" 

		centerGlyph(vertices);
		findCenter();

		initPerformanceTest();

		// --------------------------------------
	    // Mobile Glyph

		if (_options.mobile) {

	    	if (_options.phone) {
	    		// 10% height to offset element with respect to header
	    		glyph_obj.y_offset = (p.height * 0.5);
	    	}

	    	if (_options.tablet) {

	    	}
	    	
	    	glyph_obj.height = p.height * 0.5;
	    	glyph_obj.width = glyph_obj.height; 
	    	glyph_obj.x = (p.width - glyph_obj.width) / 2;
	    	glyph_obj.y = (p.height - glyph_obj.height) / 2 - glyph_obj.y_offset;

	    	physInitMobile(); // Initiate the physics world
			
			// return;
		}

		loadArrays(vertices); 	// Load the arrays
		physInit(); 			// Initiate the physics world

		let nudgeStrength = 0.1;

		// Make our Attractor Object
		nudgeAttractor = new Attractor({
			physics: physics,
			position: new toxi.geom.Vec2D(p.width/2,p.height/2),
			radius: 24,
			range: p.width/2,
			strength: nudgeStrength,
			p: p,
		});


		// Setup interactive modules
		_perlin = flowField(100); // Turning up 2nite
		_perlin.reset();

		_renderMan = render(); // Default Fluid

		_bounce = scrollAccumulator();

	}

	p.draw = function() {

		// Only render if glyph is in view
		if (!_render) {
			return;
		}

		// Update the physics world
		physics.update();
		p.background("#1a1a1a");
		// p.clear();

		// if (_options.mobile) {
		// 	mobile_physics();
		// 	return; // No more, no more
		// }

		// Draw the bezier Shapes 
		drawBasicA();
		drawBasicN();

		// Set rendermode. Fluid | Perlin | Debug
		_renderMan.render(_renderMode);


	}

	// Check framerate interval
	function initPerformanceTest() {
		_slowFn = setInterval(testPerformance, 1000);
	}

	function testPerformance() {
		_slow = p.frameRate() < 20
			? true
			: false;
	}
	
	// --------------------------------------
    // Mobile + Tablet

	function mobile_physics() {

		/*

		The following functions allow for fluid interactions on mobile.
		However, due to performace limitations, we'll keep the fluidity
		strictly to desktop.

		setRotation();
		displayPhys();

		*/

		setRotation(); // Handle Gyroscopic goodness

		// Glyph image related to physics sim
		let x_off = center.x - glyph_obj.dynamic.x,
			y_off = center.y - glyph_obj.dynamic.y;

		// Debug Mobile Physics
		/*
			p.strokeWeight(2);
			p.stroke(0,0,0);
			p.line(glyph_obj.lock.x, glyph_obj.lock.y, glyph_obj.dynamic.x, glyph_obj.dynamic.y);
			p.fill(0,0,0);
			p.ellipse(glyph_obj.lock.x, glyph_obj.lock.y,5,5);
			p.ellipse(glyph_obj.dynamic.x, glyph_obj.dynamic.y,5,5);
		*/

		// p.image(
		// 	glyph_obj.img,
		// 	glyph_obj.x + x_off,
		// 	glyph_obj.y + y_off,
		// 	glyph_obj.width,
		// 	glyph_obj.height
		// );
	}

	// --------------------------------------
    // Desktop

	function windowResized() {
		if (_options.mobile) {
			return;
		}

		p.resizeCanvas(p.windowWidth, p.windowHeight);
		w = p.windowWidth;
		h = p.windowHeight;

		scaleFunc(w,h);
		physEmpty(); 			// Empty the Physics Sim
		findCenter();
		centerGlyph(vertices); 
		loadArrays(vertices); 	// Reload the Arrays
		physInit(); 			// Initiate the physics array

		_perlin.resize(); 		// Resize Perlin sim
		_perlin.step(); 		// Setup Perlin sim

	}

	function drawBezier(vertices) {

		p.beginShape();
			for (let i = 0; i < vertices.a_vertex.length; i++) {
				if (vertices.a_vertex[i].vertexType == true) {
					p.p.bezierVertex(
					vertices.a_vertex[i].x, vertices.a_vertex[i].y,
					vertices.a_vertex[i++].x, vertices.a_vertex[i].y,
					vertices.a_vertex[i++].x, vertices.a_vertex[i].y
					);
				} 
				else {
					p.vertex(vertices.a_vertex[i].x, vertices.a_vertex[i].y);
				}
			}
		p.endShape(p.CLOSE);
	}

	function drawBasicA() {
		let fadeSpeed = 2;
		if (glyphOp < 255) glyphOp += fadeSpeed;
		
		// If framerate is slow, draw outline, else fill glyph
		if (_slow) {
			p.noFill();
			p.strokeWeight(1);
			p.stroke(230,230,230,glyphOp); // 35,35,35 before
		} 
		else {
			p.noStroke();
			p.fill(230,230,230,glyphOp); // 35,35,35 before
		}

		p.beginShape();
			p.vertex(aSpringVert[0].x, aSpringVert[0].y);
			p.vertex(aSpringVert[1].x, aSpringVert[1].y);
			p.bezierVertex(aSpringVert[2].x, aSpringVert[2].y, aSpringVert[3].x, aSpringVert[3].y, aSpringVert[4].x, aSpringVert[4].y);
			p.bezierVertex(aSpringVert[5].x, aSpringVert[5].y, aSpringVert[6].x, aSpringVert[6].y, aSpringVert[7].x, aSpringVert[7].y);
			p.bezierVertex(aSpringVert[8].x, aSpringVert[8].y, aSpringVert[9].x, aSpringVert[9].y, aSpringVert[10].x, aSpringVert[10].y);
			p.bezierVertex(aSpringVert[11].x, aSpringVert[11].y, aSpringVert[12].x, aSpringVert[12].y, aSpringVert[13].x, aSpringVert[13].y);
			p.bezierVertex(aSpringVert[14].x, aSpringVert[14].y, aSpringVert[15].x, aSpringVert[15].y, aSpringVert[16].x, aSpringVert[16].y);
			p.bezierVertex(aSpringVert[17].x, aSpringVert[17].y, aSpringVert[18].x, aSpringVert[18].y, aSpringVert[19].x, aSpringVert[19].y);
			p.vertex(aSpringVert[20].x, aSpringVert[20].y);
			p.bezierVertex(aSpringVert[21].x, aSpringVert[21].y, aSpringVert[22].x, aSpringVert[22].y, aSpringVert[23].x, aSpringVert[23].y);
			p.bezierVertex(aSpringVert[24].x, aSpringVert[24].y, aSpringVert[25].x, aSpringVert[25].y, aSpringVert[26].x, aSpringVert[26].y);
			p.bezierVertex(aSpringVert[27].x, aSpringVert[27].y, aSpringVert[28].x, aSpringVert[28].y, aSpringVert[29].x, aSpringVert[29].y);
			p.bezierVertex(aSpringVert[30].x, aSpringVert[30].y, aSpringVert[31].x, aSpringVert[31].y, aSpringVert[32].x, aSpringVert[32].y);
			p.bezierVertex(aSpringVert[33].x, aSpringVert[33].y, aSpringVert[34].x, aSpringVert[34].y, aSpringVert[35].x, aSpringVert[35].y);
			p.bezierVertex(aSpringVert[36].x, aSpringVert[36].y, aSpringVert[37].x, aSpringVert[37].y, aSpringVert[38].x, aSpringVert[38].y);
			p.bezierVertex(aSpringVert[39].x, aSpringVert[39].y, aSpringVert[40].x, aSpringVert[40].y, aSpringVert[41].x, aSpringVert[41].y);
			p.bezierVertex(aSpringVert[42].x, aSpringVert[42].y, aSpringVert[43].x, aSpringVert[43].y, aSpringVert[44].x, aSpringVert[44].y);
			p.bezierVertex(aSpringVert[45].x, aSpringVert[45].y, aSpringVert[46].x, aSpringVert[46].y, aSpringVert[47].x, aSpringVert[47].y);
			p.vertex(aSpringVert[48].x, aSpringVert[48].y);
			p.bezierVertex(aSpringVert[49].x, aSpringVert[49].y, aSpringVert[50].x, aSpringVert[50].y, aSpringVert[51].x, aSpringVert[51].y);
			p.bezierVertex(aSpringVert[52].x, aSpringVert[52].y, aSpringVert[53].x, aSpringVert[53].y, aSpringVert[54].x, aSpringVert[54].y);
		p.endShape(p.CLOSE);
		p.fill('#1a1a1a'); // before #f4f4f4 
		p.beginShape();
		p.vertex(aCounterSpringVert[0].x, aCounterSpringVert[0].y);
		p.vertex(aCounterSpringVert[1].x, aCounterSpringVert[1].y);
		p.bezierVertex(aCounterSpringVert[2].x, aCounterSpringVert[2].y, aCounterSpringVert[3].x, aCounterSpringVert[3].y, aCounterSpringVert[4].x, aCounterSpringVert[4].y);
		p.bezierVertex(aCounterSpringVert[5].x, aCounterSpringVert[5].y, aCounterSpringVert[6].x, aCounterSpringVert[6].y, aCounterSpringVert[7].x, aCounterSpringVert[7].y);
		p.bezierVertex(aCounterSpringVert[8].x, aCounterSpringVert[8].y, aCounterSpringVert[9].x, aCounterSpringVert[9].y, aCounterSpringVert[10].x, aCounterSpringVert[10].y);
		p.bezierVertex(aCounterSpringVert[11].x, aCounterSpringVert[11].y, aCounterSpringVert[12].x, aCounterSpringVert[12].y, aCounterSpringVert[13].x, aCounterSpringVert[13].y);
		p.endShape(p.CLOSE);
	}

	function drawBasicN() {
		let fadeSpeed = 2;
		if (glyphOp < 255) glyphOp += fadeSpeed;
		
		// If framerate is slow, draw outline, else fill glyph
		if (_slow) {
			p.noFill();
			p.strokeWeight(1);
			p.stroke(230,230,230,glyphOp); // 35,35,35 before
		} 
		else {
			p.noStroke();
			p.fill(230,230,230,glyphOp); // 35,35,35 before
		}

		p.beginShape();
			p.vertex(nSpringVert[0].x, nSpringVert[0].y);
			p.vertex(nSpringVert[1].x, nSpringVert[1].y);
			p.vertex(nSpringVert[2].x, nSpringVert[2].y);
			p.vertex(nSpringVert[3].x, nSpringVert[3].y);
			p.vertex(nSpringVert[4].x, nSpringVert[4].y);
			p.vertex(nSpringVert[5].x, nSpringVert[5].y);
			p.vertex(nSpringVert[6].x, nSpringVert[6].y);
			p.vertex(nSpringVert[7].x, nSpringVert[7].y);
			p.vertex(nSpringVert[8].x, nSpringVert[8].y);
			p.vertex(nSpringVert[9].x, nSpringVert[9].y);
		p.endShape(p.CLOSE);
	}

	function rayTest2() {
		let springVector = p.createVector(aSpringVert[5].x, aSpringVert[5].y);
		let lenOffset = springVector.dist(mouseVector);
		let lenMag = 150;
		let rayVector = p.createVector();
				rayVector.x = mouseVector.x + (mouseVector.x - springVector.x) / lenOffset * lenMag;
				rayVector.y = mouseVector.y + (mouseVector.y - springVector.y) / lenOffset * lenMag;

				p.ellipse(rayVector.x, rayVector.y, 10, 10);
				p.strokeWeight(1);
				p.stroke(0);
				p.line(springVector.x, springVector.y, rayVector.x, rayVector.y);
	}

	// Setup the dynamic arrays --> center them on the page
	function loadArrays(vertices) {
		// Always set the arrays to zero, in order to center properly
		aVerts.length = 0;
		aCounterVerts.length = 0;
		nVerts.length = 0;
		for (let i in vertices.a_vertex) {
			aVerts.push(p.createVector(vertices.a_vertex[i].x, vertices.a_vertex[i].y));
			aVerts[i].x *= scaleFactor;
			aVerts[i].x += (glyphCenter.x);
			aVerts[i].y *= scaleFactor;
			aVerts[i].y += (glyphCenter.y);
		}
		for (let j in vertices.counter_vertex) {
		aCounterVerts.push(p.createVector(vertices.counter_vertex[j].x, vertices.counter_vertex[j].y));
			aCounterVerts[j].x *= scaleFactor;
			aCounterVerts[j].x += (glyphCenter.x);
			aCounterVerts[j].y *= scaleFactor;
			aCounterVerts[j].y += (glyphCenter.y);
		}
		for (let k in vertices.n_vertex) {
		nVerts.push(p.createVector(vertices.n_vertex[k].x, vertices.n_vertex[k].y));
			nVerts[k].x *= nScaleFactor;
			nVerts[k].x += nOffset.x;
			nVerts[k].x *= scaleFactor;
			nVerts[k].x += glyphCenter.x;
			nVerts[k].y *= nScaleFactor;
			nVerts[k].y += nOffset.y
			nVerts[k].y *= scaleFactor;
			nVerts[k].y += glyphCenter.y;
		}
	}

	function displayPhys() {
			for (let i in aVerts) {
					p.strokeWeight(scaleFactor);
					let aVertPos = p.createVector(aLockVert[i].x, aLockVert[i].y);
					let trans = p.map(aVertPos.dist(mousePos), 0, center.x/2, 100, 0);
					let strokeCol = p.color(255,0,0,trans);
					p.fill(strokeCol);
					p.stroke(strokeCol);
					p.ellipse(aLockVert[i].x,aLockVert[i].y,scaleFactor,scaleFactor);
					p.line(aLockVert[i].x,aLockVert[i].y,aSpringVert[i].x,aSpringVert[i].y);
					aLockVert[i].display();
					aSpringVert[i].display();
			}
			// Display and draw line between the 'a counter' vertices
			for (let i in aCounterVerts) {
					p.strokeWeight(scaleFactor);
					let aVertPos = p.createVector(aCounterLockVert[i].x, aCounterLockVert[i].y);
					let trans = p.map(aVertPos.dist(mousePos), 0, center.x/2, 100, 0);
					let strokeCol = p.color(255,0,0,trans);
					p.stroke(strokeCol);
					p.fill(strokeCol);
					p.ellipse(aCounterLockVert[i].x,aCounterLockVert[i].y,scaleFactor,scaleFactor);
					p.line(aCounterLockVert[i].x,aCounterLockVert[i].y,aCounterSpringVert[i].x,aCounterSpringVert[i].y);
					aCounterLockVert[i].display();
					aCounterSpringVert[i].display();
			}
			// Display and draw line between the 'N' vertices
			for (let i in nVerts) {
					p.strokeWeight(scaleFactor);
					let aVertPos = p.createVector(nLockVert[i].x, nLockVert[i].y);
					let trans = p.map(aVertPos.dist(mousePos), 0, center.x/2, 100, 0);
					let strokeCol = p.color(255,0,0,trans);
					p.stroke(strokeCol);
					p.fill(strokeCol);
					p.ellipse(nLockVert[i].x,nLockVert[i].y,scaleFactor,scaleFactor);
					p.line(nLockVert[i].x,nLockVert[i].y,nSpringVert[i].x,nSpringVert[i].y);
					nLockVert[i].display();
					nSpringVert[i].display();
			}
	}

	function debugAttractors(loc, strength) { // Pass in location of attractor

			let maxDistance = (p.width);
			let absStrength = p.abs(strength);
			let r,g,b; // color elements

			 if (strength > 0) { // Blue -> Push | Red -> Pull
			 	r = 0;
			 	g = 0;
			 	b = 255;
			 } else {
			 	r = 255;
			 	g = 0;
			 	b = 0;
			 }

			for (let i in aVerts) { // 'a' Vertices
					let aVertPos = p.createVector(aLockVert[i].x, aLockVert[i].y);
					let opacity = p.map(absStrength, 0.015, 0.05, 0, 50); // Look to perlin for values
					let strokeCol = p.color(r,g,b,opacity);
					p.strokeWeight(p.map(aVertPos.dist(loc), 0 , maxDistance, 1, 0));
					p.fill(strokeCol);
					p.stroke(strokeCol);
					p.line(loc.x,loc.y,aSpringVert[i].x,aSpringVert[i].y);
					aSpringVert[i].display();
			}
			
			for (let i in aCounterVerts) { // 'a-Counter' Vertices
					let aVertPos = p.createVector(aCounterLockVert[i].x, aCounterLockVert[i].y);
					let opacity = p.map(absStrength, 0.015, 0.05, 0, 50); // Look to perlin for values
					let strokeCol = p.color(r,g,b,opacity);
					p.strokeWeight(p.map(aVertPos.dist(loc), 0 , maxDistance, 1, 0));
					p.stroke(strokeCol);
					p.fill(strokeCol);
					p.line(loc.x,loc.y,aCounterSpringVert[i].x,aCounterSpringVert[i].y);
					aCounterSpringVert[i].display();
			}
			
			for (let i in nVerts) { // 'N' vertices
					let aVertPos = p.createVector(nLockVert[i].x, nLockVert[i].y);
					let opacity = p.map(absStrength, 0.015, 0.05, 0, 50); // Look to perlin for values
					let strokeCol = p.color(r,g,b,opacity);
					p.strokeWeight(p.map(aVertPos.dist(loc), 0 , maxDistance, 1, 0));
					p.stroke(strokeCol);
					p.fill(strokeCol);
					p.line(loc.x,loc.y,nSpringVert[i].x,nSpringVert[i].y);
					nSpringVert[i].display();
			}
	}

	function displayPhys1(x, y, alphaOpa1) {
			p.strokeWeight(scaleFactor);
			let locConverge = p.createVector(x,y);
			for (let i in aVerts) {
					let aVertPos = p.createVector(aSpringVert[i].x, aSpringVert[i].y);
					let trans = p.map(aVertPos.dist(locConverge), 0, center.x, 100, 0);
					let strokeCol = p.color(255,0,0,trans);
					p.fill(strokeCol);
					p.stroke(strokeCol);
					p.ellipse(aSpringVert[i].x,aSpringVert[i].y,scaleFactor,scaleFactor);
					p.line(aSpringVert[i].x,aSpringVert[i].y,locConverge.x,locConverge.y);
			}
			// Display and draw line between the 'a counter' vertices
			for (let i in aCounterVerts) {
					p.strokeWeight(scaleFactor);
					let aVertPos = p.createVector(aCounterSpringVert[i].x, aCounterSpringVert[i].y);
					let trans = p.map(aVertPos.dist(locConverge), 0, center.x, 100, 0);
					let strokeCol = p.color(255,0,0,trans);
					p.stroke(strokeCol);
					p.fill(strokeCol);
					p.ellipse(aCounterSpringVert[i].x,aCounterSpringVert[i].y,scaleFactor,scaleFactor);
					p.line(locConverge.x,locConverge.y,aCounterSpringVert[i].x,aCounterSpringVert[i].y);
			}
			// Display and draw line between the 'N' vertices
			for (let i in nVerts) {
					p.strokeWeight(scaleFactor);
					let aVertPos = p.createVector(nSpringVert[i].x, nSpringVert[i].y);
					let trans = p.map(aVertPos.dist(locConverge), 0, center.x, 100, 0);
					let strokeCol = p.color(255,0,0,trans);
					p.stroke(strokeCol);
					p.fill(strokeCol);
					p.ellipse(nSpringVert[i].x,nSpringVert[i].y,scaleFactor,scaleFactor);
					p.line(locConverge.x,locConverge.y,nSpringVert[i].x,nSpringVert[i].y);
			}
	}

	function physInit() {

		// Set up Physics environment
		physics = new toxi.physics2d.VerletPhysics2D(); // Initialize the physics
		physics.setDrag (0.01);
		gravityStrength = new toxi.geom.Vec2D(0,0.5);
		gravity = new toxi.physics2d.behaviors.GravityBehavior(gravityStrength); // Set up Gravity
		physics.addBehavior(gravity);

		// Set the world's bounding box
		physics.setWorldBounds(
			new toxi.geom.Rect(
				0,
				0,
				p.width*1.25,
				p.height*1.25
			)
		);

		let springStrength = 0.00035,
				springLength   = 0.05;

			// Make our ToxiParticles for 'a'
			for (let i in aVerts) {
				aLockVert.push(
					new Particle ({
						position: new toxi.geom.Vec2D(aVerts[i].x, aVerts[i].y),
						p: p,
					})
				);
				aLockVert[i].lock();
				aSpringVert.push(
					new Particle ({
						position: new toxi.geom.Vec2D(aVerts[i].x, aVerts[i].y),
						p: p,
					})
				);
				aSpringArr.push(
					new toxi.physics2d.VerletSpring2D(aLockVert[i], aSpringVert[i],springLength, springStrength)
				);
				
				physics.addParticle(aLockVert[i]);
				physics.addParticle(aSpringVert[i]);
				physics.addSpring(aSpringArr[i]);
	}

		// Make our ToxiParticles for 'a counter'
		for (let i in aCounterVerts) {
			aCounterLockVert.push(
				new Particle ({
					position: new toxi.geom.Vec2D(aCounterVerts[i].x, aCounterVerts[i].y),
					p: p,
				})
			);

			aCounterLockVert[i].lock();

			aCounterSpringVert.push(
				new Particle ({
					position: new toxi.geom.Vec2D(aCounterVerts[i].x, aCounterVerts[i].y),
					p: p,
				})
			);

			aCounterSpringArr.push(
				new toxi.physics2d.VerletSpring2D(aCounterLockVert[i], aCounterSpringVert[i],springLength, springStrength)
			);

			physics.addParticle(aCounterLockVert[i]);
			physics.addParticle(aCounterSpringVert[i]);
			physics.addSpring(aCounterSpringArr[i]);
		}

		// Make our ToxiParticles for 'N'
		for (let i in nVerts) {
			nLockVert.push(
				new Particle ({
					position: new toxi.geom.Vec2D(nVerts[i].x, nVerts[i].y),
					p: p
				})
			);
			
			nLockVert[i].lock();

			nSpringVert.push(
				new Particle({
					position: new toxi.geom.Vec2D(nVerts[i].x, nVerts[i].y),
					p: p,
				})
			);
			
			nSpringArr.push(
				new toxi.physics2d.VerletSpring2D(nLockVert[i], nSpringVert[i],springLength, springStrength)
			);
			
			physics.addParticle(nLockVert[i]);
			physics.addParticle(nSpringVert[i]);
			physics.addSpring(nSpringArr[i]);
		}
	}

	function physInitMobile() {

		// Set up Physics environment
		physics = new toxi.physics2d.VerletPhysics2D(); // Initialize the physics
		physics.setDrag (0.01);
			gravityStrength = new toxi.geom.Vec2D(0,0.5);
			gravity = new toxi.physics2d.behaviors.GravityBehavior(gravityStrength); // Set up Gravity
		physics.addBehavior(gravity);

		// Set the world's bounding box
		physics.setWorldBounds(
			new toxi.geom.Rect(
				0,
				0,
				p.width*1.25,
				p.height*1.25
			)
		);

		let springStrength = 0.00035,
			springLength   = 0.05;

		// ToxiParticle: Centroid
		glyph_obj.lock = 
			new Particle ({
				position: new toxi.geom.Vec2D(center.x, center.y),
				p: p,
			});

		glyph_obj.lock.lock();

		glyph_obj.dynamic = 
			new Particle ({
				position: new toxi.geom.Vec2D(center.x, center.y),
				p: p,
			});

		glyph_obj.spring =
			new toxi.physics2d.VerletSpring2D(
				glyph_obj.lock,
				glyph_obj.dynamic,
				springLength,
				springStrength
			);
		
		physics.addParticle(glyph_obj.lock);
		physics.addParticle(glyph_obj.dynamic);
		physics.addSpring(glyph_obj.spring);

	}

	// Reset the physics simulation
	function physEmpty() {
		if (aSpringArr.length == aVerts.length) {
			for (let i in aSpringArr) {
				physics.removeSpringElements(aSpringArr[i]);
			} 

			aSpringArr.length  = 0;
			aLockVert.length   = 0;
			aSpringVert.length = 0;

		}
		if (aCounterSpringArr.length == aCounterVerts.length) {
			for (let i in aCounterSpringArr) {
				physics.removeSpringElements(aCounterSpringArr[i]);
			}

			aCounterSpringArr.length  = 0;
			aCounterLockVert.length   = 0;
			aCounterSpringVert.length = 0;

		}

		if (nSpringArr.length == nVerts.length) {
			for (let i in nSpringArr) {
				physics.removeSpringElements(nSpringArr[i]);
			}

			nSpringArr.length  = 0;
			nLockVert.length   = 0;
			nSpringVert.length = 0;

		}
	}

	function findCenter() {
		w = p.windowWidth;
		h = p.windowHeight;
		
		w < 450 && _options.mobile
			? center.set(w/2, h/2)
			: center.set(w/2, h/2);

		let glyphCenterX = center.x - aCenterOffset.x; 
		let glyphCenterY = center.y + aCenterOffset.y - 25; 
		glyphCenter.set(glyphCenterX, glyphCenterY);
	}

	function centerGlyph(vertices) {
		let xArray = [];
		let yArray = [];
		let xArrayN = [];
		let yArrayN = [];

		for (let i in vertices.a_vertex) xArray.push(vertices.a_vertex[i].x * scaleFactor);
		for (let i in vertices.a_vertex) yArray.push(vertices.a_vertex[i].y * scaleFactor);
		for (let i in vertices.n_vertex) xArrayN.push(vertices.n_vertex[i].x * scaleFactor * nScaleFactor);
		for (let i in vertices.n_vertex) yArrayN.push(vertices.n_vertex[i].y * scaleFactor * nScaleFactor);

		let xMin = arrayMin(xArray);
		let yMin = arrayMin(yArray);
		let xMax = arrayMax(xArray);
		let yMax = arrayMax(yArray);
		let xMinN = arrayMin(xArrayN);
		let yMinN = arrayMin(yArrayN);
		let xMaxN = arrayMax(xArrayN);
		let yMaxN = arrayMax(yArrayN);

		let xCenter = ((xMaxN + xMax) - (xMinN +xMin)) / 2;
		let yCenter = (((yMaxN+ yMax) - (yMinN + yMin)) / 2) - 75;

		aCenterOffset.set(xCenter, yCenter);
		return aCenterOffset;

	}

	//  Calculation Min/Max of any array

	function arrayMin(arr) {
		return arr.reduce(function (p, v) {
			return ( p < v ? p : v );
		});
	}

	function arrayMax(arr) {
		return arr.reduce(function (p, v) {
			return ( p > v ? p : v );
		});
	}

	// Scaling function

	function scaleFunc(w,h) {
		let dynamicScale;
		let scalar = w > h 
			? h 
			: w;

		if (scalar < 450 && _options.mobile) {
			dynamicScale = 3; 				// Mobile Screen			
		} else if (scalar < 1000) {
			dynamicScale = 1.75;  			// Small Screen
		} else {
			dynamicScale = 2; 			// Big Screen
		}

		scaleFactor = scalar / (1920 / dynamicScale);
	}

	// FlowField Attractors
	// 2D distribution of attractors exerting force on the glyph
	let flowField = function(r) {
		let field = [],
			cols, rows,
			area_x, area_y,
			resolution, 
			pos = p.createVector();

		let zoff = 0;

			resolution = r;

		    initialize(); // Set up the Flow Field | Call this immediately

	    function initialize() { // Private | Intialize the field of attractors

	    	area_x = p.width * 0.6;  // 60% of windowWidth
			area_y = p.height * 0.6; // 60% of windowWidth

			// Determine the number of columns and rows based on width and height
		    cols = p.round(area_x / resolution);
		    rows = p.round(area_y / resolution);

		    // Remove previous behaviours | attractors from simulation
		    if (field.length > 0) {
		    	field.forEach(function(attractor) {
		    		attractor.physics.removeBehavior(attractor.attractForce);
		    		physics.removeParticle(attractor);
		    	});
		    }

		    reset(); // Wipe out the array references

			for (let i = 0; i < cols; i++) { // X grid
				for (let j = 0; j < rows; j++) { // Y grid

					pos.x = i * resolution + area_x / 2.5; // 60% of windowWidth, but centered ~ 30%
					pos.y = j * resolution + area_y / 2.5; // 60% of windowHeight, but centered ~ 25%
					
					// Make our Attractor Objects
					field.push(
						new Attractor({
							physics: physics,
							position: new toxi.geom.Vec2D(pos.x,pos.y),
							location: new p5.Vector(pos.x,pos.y),
							radius: 24,
							range: p.width/2,
							strength: 0,
							locked : true,
							p: p,
						})
					);
				}
			}
		}

		function step() { // Private | Update the noise field
			let xoff = 0;
			let index = 0; // c:
			for (let i = 0; i < cols; i++) {
				let yoff = 0;
				for (let j = 0; j < rows; j++) {
					let strength = p.map(
						p.noise(xoff,yoff,zoff),0,1,-0.05,0.05 // Attract => Repel
					);
					field[index].attractForce.setStrength(strength); // Set Attractor strength
					field[index].strength = strength;
					field[index].display();
					yoff += 0.1;

					index++;
				}

				xoff += 0.1;
			}

			zoff += 0.005; // Animate by changing 3rd dimension of noise every frame
		}

		function debug() { // Private | Update the noise field
			let xoff = 0;
			let index = 0; // c:
			for (let i = 0; i < cols; i++) {
				let yoff = 0;
				for (let j = 0; j < rows; j++) {
					let strength = p.map(
						p.noise(xoff,yoff,zoff),0,1,-0.05,0.05 // Attract => Repel
					);
					field[index].attractForce.setStrength(strength); // Set Attractor strength
					field[index].strength = strength;
					field[index].display();
					yoff += 0.1;

					if ((strength > 0.015) || (strength < -0.015)) {
						debugAttractors(field[index].location, field[index].strength); // Display the Flow-Field
					}

					index++;
				}

				xoff += 0.1;
			}

			zoff += 0.005; // Animate by changing 3rd dimension of noise every frame
		}

		function reset() { // Private | Reset
			field.length = 0; // Empty existing array
		}

		function update() {
			if (field.length > 0) {
				return true;
				step(); // if we exist, we do | step forward in time
			} else {
				return false;
			}
		}

		function update_debug() {
			if (field.length > 0) {
				return true;
				debug(); // if we exist, we do | step forward in time
			} else {
				return false;
			}
		}

		// Method calls
		return {
			initialize: function() {
				initialize();
			},
			step: function() {
				step();
			},
			debug: function() {
				debug();
			},
			reset: function() {
				field.forEach(function(attractor) {
					attractor.attractForce.setStrength(0);
				});
			},
			update: function() {
				update();
			},
			update_debug: function() {
				update_debug();
			},
			resize: function() {
				initialize(); // Set up the Flow Field | Call on window.Resize()
			}
		}
	}

	let render = function() {
		function fluid() {
			// Update the attractor position, both touch & mouse events
			p.touchIsDown
				? mousePos.set(p.touchX ,p.touchY)
				: mousePos.set(p.mouseX,p.mouseY);

			nudgeAttractor.set(mousePos.x ,mousePos.y);
		}

		function perlin() {
			_perlin.step();
		}

		function debug() {
			_perlin.debug();
		}

		// Method Calls
		return {
			fluid: function() {
				fluid();
			},
			perlin: function() {
				_perlin.step();
			},
			debug: function() {
				_perlin.debug();
			},
			render: function(mode) {
				if (mode === "perlin") {
					return perlin();
				} else if (mode === "debug") {
					return debug();
				} else {
					return fluid();
				}
			}
		}
	}

	// A little too much interaction, if you ask me! Might be useful later
	p.mouseClicked = function() {
		physics.removeBehavior(gravity);
		// Use perlin noise to achieve a similar* gravity vector
		// xOff += 0.5;
		// Horizontal + Vertical leaping may be too much...
		// gravityStrength.x = p.noise(xOff) * 0.75;
		gravityStrength.y *= -1;
		gravity = new toxi.physics2d.behaviors.GravityBehavior(gravityStrength); // Re-initialize gravity
		physics.addBehavior(gravity);
		// prevent default | Which also shuts down non-p5 handlers!
		// return false; 
	}

	function setRotation() { // If mobile, set the relative orientation of the gravity vector
		if (p.frameCount % 5 === 0) { // For the sake of batteries
			physics.removeBehavior(gravity);

			gravityStrength.y = p.map(p.rotationX, -180, 180, -0.5, 0.5); // For some Reason they are reversed
			gravityStrength.x = p.map(p.rotationY, -90, 90, -0.5, 0.5);

			gravity = new toxi.physics2d.behaviors.GravityBehavior(gravityStrength); // Re-initialize gravity
			
			physics.addBehavior(gravity);
		}
	}

	function motionBlur() {
		p.push();
			p.fill(34,34,34, 100); // was 255 before
			p.rect(0,0,width,height);
		p.pop();
	}

	/*

		jQuery listeners

	*/

	// Deal with resize events
	window.onresize = function() { 
		if (_options.mobile) {
			return;
		}

		let timer;

		clearTimeout(timer);

		$("#glyph").width(window.innerWidth)
			       .height(window.innerHeight);

	    glyphOp = 0; // Fade glyph in each resize to avoid jumpiness

	    windowResized();
        
        timer = setTimeout(function() {
    		windowResized();
        }, 250);  
	}

	// Web Lab interation states	
	// Check Radio.. Transmission..
	$("#fluid-radio, #perlin-radio, #debug-radio")
		.change(function(e) {

			e.stopPropagation();
			e.preventDefault();

	        if ($("#fluid-radio").is(":checked")) { 		// Fluid
	            _renderMode = "fluid"; 
	        }
	        else if ($("#perlin-radio").is(":checked")) {	// Perlin
	            _renderMode = "perlin";
	        }
	        else if ($("#debug-radio").is(":checked")) {	// Debug
	        	_renderMode = "debug";
	        }
	});    
	

	// Calculate displacement during scroll events
	// Can we make this only applicable when p5 is on screen?
	let scrollAccumulator = function() {
		let delta 	   	 = 0,
			prev_delta 	 = 0,
			acceleration = 0;

		function accelerator(dy) {
			prev_delta = delta;
			delta = dy;

			acceleration = (delta - prev_delta) / 2; // Consider uniform update, given by accumulation
		}

		function force() { // Calculate our offset force (may have to invert)
			return p.map(acceleration, -200, 200, -10, 10);
		}

		// Affect physics sim directly
		function gravitation(strength) {
			physics.removeBehavior(gravity);
			gravityStrength.y = strength;
			gravity = new toxi.physics2d.behaviors.GravityBehavior(gravityStrength); // Re-initialize gravity
			physics.addBehavior(gravity);
		}

		function bounceFactory(dy) {
			accelerator(dy); // Calculate acceleration

			if (acceleration > 1) {
				gravitation(force()); // Return gravity back to normal
			} else {
				gravitation(0.5); // Return gravity back to normal
			}

		}

		return { // Overly verbose, why not
			force: function() {
				return force();
			},
			accelerator: function(dy) {
				return accelerator(dy);
			},
			gravitation: function() {
				return gravitation();
			},
			bounceFactory: function(dy) {
				return bounceFactory(dy);
			}
		}
	}

	// Scroll Accumulator
	$( window ).scroll(function() {
		window.settimeout 
		if (_options.mobile) {
			return;
		}
		
		let scroll_top = window.scrollY;
		if (scroll_top < p.height)  { // We only care if it's happening around p5 environment
			_bounce.bounceFactory(scroll_top);
			_render = true;
		}
		else if (window.scrollY > 0) { // hack to get around annoying initialization bug
			_render = false;
		}

	});



}

// --------------------------------------
// Module Exports

module.exports.init = function (args = {}) {
	_options.mobile = args.mobile;
	_options.phone = args.phone;
	_options.tablet = args.tablet;

	_canvas = $.Deferred();

	return new p5(glyph); // Instantiate the entire P5 sketch
}

module.exports.canvas = function () {
	return _canvas;
}










