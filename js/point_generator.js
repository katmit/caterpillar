

function readModelJSON(url){
	 try {
        var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open model file file!";
            else
                return JSON.parse(httpReq.response); 
    } catch(e) {
        console.log(e);
        return(String.null);
    }
}

function generateFromJSON(url){
	var JSONdata = readModelJSON(url);

	var dataObjs = [];
	for(var i = 0; i < JSONdata.length; i++){
		var vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
		gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(JSONdata[i].vertices),gl.STATIC_DRAW); // coords to that buffer
		
		var indexBuffer = gl.createBuffer(); // init empty triangle index buffer
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(JSONdata[i].indices),gl.STATIC_DRAW); // data in
		
		var normalsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(JSONdata[i].normals), gl.STATIC_DRAW);
		
		var diffuseBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(JSONdata[i].diffuse), gl.STATIC_DRAW);
		
		var ambientBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(JSONdata[i].ambient), gl.STATIC_DRAW);
		
		var specularBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(JSONdata[i].specular), gl.STATIC_DRAW);
		
		var nValBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, nValBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(JSONdata[i].nVals), gl.STATIC_DRAW);
		
		var mMatrix = mat4.create();
		var transformMatrix = mat4.create();
		var translateMatrix = mat4.create();
		var rotateMatrix = mat4.create();
		
		dataObjs.push({
				 "vertexBuffer": vertexBuffer, 
				 "indexBuffer": indexBuffer, 
				 "normalsBuffer": normalsBuffer, 
				 "diffuseBuffer": diffuseBuffer,
				 "ambientBuffer": ambientBuffer,
				 "specularBuffer": specularBuffer,
				 "nValBuffer": nValBuffer,
				 "numPoints": JSONdata[i].indices.length, 
				 "transformMatrix": transformMatrix,
				 "translateMatrix": translateMatrix,
				 "rotateMatrix": rotateMatrix,
				 "mMatrix": mMatrix
				 });
	}
	return dataObjs;
}