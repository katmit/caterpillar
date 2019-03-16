
var Eye = new vec4.fromValues(0,0,4,1.0); // default eye position in world space //4
var LookUp = new vec3.fromValues(0, 1.0, 0.0);
var LookAt = new vec3.fromValues(0.0, 0.0, -5);
var Light = new vec4.fromValues(-3,-10,25, 1.0);
var LightColor = new vec4.fromValues(1.0,1.0,1.0, 1.0);

/* webgl and geometry data */
var gl = null;
var caterpillarBuffers = [];

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var ambientAttrib;
var diffuseAttrib;
var specularAttrib;
var nCoefAttrib;
var normalAttrib;
var lightUniform;
var lightColorUniform;
var eyePosUniform;
var modelUniform;
var transformUniform;
var translateUniform;
var rotateUniform;
var lookAtUniform;
var projectionUniform;



// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
	// Get the image canvas, render an image in it
    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
    var cw = imageCanvas.width, ch = imageCanvas.height; 
    var imageContext = imageCanvas.getContext("2d", { preserveDrawingBuffer: true }); 
    var bkgdImage = new Image(); 
    bkgdImage.crossOrigin = "Anonymous";
	bkgdImage.src = "https://raw.githubusercontent.com/katmit/prog3/gh-pages/grass.png";
    bkgdImage.onload = function(){
        var iw = bkgdImage.width, ih = bkgdImage.height;
        imageContext.drawImage(bkgdImage, 0, 0, iw, ih, 0, 0, cw, ch);   
    }
    
    // create a webgl canvas and set it up
    var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
    gl = webGLCanvas.getContext("webgl"); // get a webgl object from it
    try {
		if (gl == null) {
			throw "unable to create gl context -- is your browser gl ready?";
       } else {
         gl.clearDepth(1.0); // use max when we clear the depth buffer
         gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
       }
     } 
     
    catch(e) {
      console.log(e);
    } 
 
}

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        
		uniform mat4 modelMatrix;
		uniform mat4 lookAtMatrix;
		uniform mat4 projectionMatrix;
		uniform mat4 transformMatrix;
		uniform mat4 translateMatrix;
		uniform mat4 rotateMatrix;
		
		attribute vec3 position;
		attribute vec3 ambient;
		attribute vec3 diffuse;
		attribute vec3 specular;
		attribute float nCoef;
		attribute vec3 normal;
		
		//for the fragment shader to use
		varying vec4 currentVertex;
		varying vec3 fAmbient;
		varying vec3 fDiffuse;
		varying vec3 fSpecular;
		varying float fnCoef;
		varying vec3 fNormal;

        void main(void) {
            gl_Position = (projectionMatrix * lookAtMatrix * modelMatrix * transformMatrix * rotateMatrix * translateMatrix) * vec4(position, 1.0);
			currentVertex = (projectionMatrix * lookAtMatrix * modelMatrix * transformMatrix * rotateMatrix * translateMatrix) * vec4(position, 1.0);
			
			fAmbient = ambient;
			fDiffuse = diffuse;
			fSpecular = specular;
			fnCoef = nCoef;
			fNormal = normal;
		}
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision
  
        uniform vec4 lightMatrix;
		uniform vec4 lightColorMatrix;
		uniform vec4 eyePosUniform;
		
		varying vec4 currentVertex;
		varying vec3 fAmbient;
		varying vec3 fDiffuse;
		varying vec3 fSpecular;
		varying float fnCoef;
		varying vec3 fNormal;
		
        void main(void) {
			vec4 L = normalize(lightMatrix  - currentVertex);
			vec4 N = normalize(vec4(fNormal, 1.0));
			float LdotN = max(dot(L, N), 0.0);
				
			vec4 R = normalize(((2.0 * N) * (LdotN)) - L);
			vec4 V = normalize(eyePosUniform - currentVertex);
			float RdotV = max(dot(R, V), 0.0);
				
			vec4 ambientColor = lightColorMatrix * vec4(fAmbient, 1.0);
			vec4 diffuseColor = lightColorMatrix * vec4(fDiffuse, 1.0) * LdotN;
			vec4 specularColor = lightColorMatrix * vec4(fSpecular, 1.0) * pow(RdotV, fnCoef);
				
			gl_FragColor = ambientColor + diffuseColor + specularColor;
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "position"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
      
				ambientAttrib = gl.getAttribLocation(shaderProgram, "ambient");
				gl.enableVertexAttribArray(ambientAttrib);
				
				diffuseAttrib = gl.getAttribLocation(shaderProgram, "diffuse");
				gl.enableVertexAttribArray(diffuseAttrib);
				
				specularAttrib = gl.getAttribLocation(shaderProgram, "specular");
				gl.enableVertexAttribArray(specularAttrib);
				
				nCoefAttrib = gl.getAttribLocation(shaderProgram, "nCoef");
				gl.enableVertexAttribArray(nCoefAttrib);
				
				normalAttrib = gl.getAttribLocation(shaderProgram, "normal");
				gl.enableVertexAttribArray(normalAttrib);
				
				eyePosUniform = gl.getUniformLocation(shaderProgram, "eyePosUniform");
				
				lightUniform = gl.getUniformLocation(shaderProgram, "lightMatrix");
				
				lightColorUniform = gl.getUniformLocation(shaderProgram, "lightColorMatrix");
				
				modelUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
				
				lookAtUniform = gl.getUniformLocation(shaderProgram, "lookAtMatrix");
				
				projectionUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
				
				transformUniform = gl.getUniformLocation(shaderProgram, "transformMatrix");
				
				translateUniform = gl.getUniformLocation(shaderProgram, "translateMatrix");
				
				rotateUniform = gl.getUniformLocation(shaderProgram, "rotateMatrix");
                
            }
        }
    } 
    catch(e) {
        console.log(e);
    }
}

function renderUnit(data) {
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	var view = new mat4.create();
	mat4.lookAt(view, vec3.fromValues(Eye[0], Eye[1], Eye[2]), vec3.fromValues(Eye[0] + LookAt[0],
				Eye[1] + LookAt[1], Eye[2] + LookAt[2]), LookUp);
	var projection = new mat4.create();
	mat4.perspective(projection, Math.PI / 2, 1, 0.1, 100.0);

	data.mMatrix = mat4.create();
	
	gl.uniformMatrix4fv(lookAtUniform, false, view);
				
	gl.uniformMatrix4fv(projectionUniform, false, projection);
	 
	gl.uniformMatrix4fv(modelUniform, false, data.mMatrix);
		
	gl.uniformMatrix4fv(transformUniform, false, data.transformMatrix);
		
	gl.uniformMatrix4fv(translateUniform, false, data.translateMatrix);
		
	gl.uniformMatrix4fv(rotateUniform, false, data.rotateMatrix);
	
	// vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,data.vertexBuffer); // activate
    gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
	 
	gl.bindBuffer(gl.ARRAY_BUFFER, data.ambientBuffer);
	gl.vertexAttribPointer(ambientAttrib, 3, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, data.diffuseBuffer);
	gl.vertexAttribPointer(diffuseAttrib, 3, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, data.specularBuffer);
	gl.vertexAttribPointer(specularAttrib, 3, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, data.nValBuffer);
	gl.vertexAttribPointer(nCoefAttrib, 1, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, data.normalsBuffer);
	gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 0, 0);
	
	gl.uniform4fv(lightUniform, Light);
		
	gl.uniform4fv(lightColorUniform, LightColor);
		
	gl.uniform4fv(eyePosUniform, Eye);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.indexBuffer); // activate
    gl.drawElements(gl.TRIANGLES, data.numPoints, gl.UNSIGNED_SHORT,0); // render 
} 


