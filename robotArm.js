// "use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 5.0;
var LOWER_ARM_HEIGHT = 5.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 3.0;
var UPPER_ARM_WIDTH  = 0.2;
var BALL_RADIUS  = 0.2;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var theta= [ 0, 0, 0];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

var initial_x = 0.0;
var initial_y = 0.0;
var ball =0;
var vPosition;
var vColor;
var context;

var rect;
var x = 0;
var y = 0;
var CONVERSION_RATE = 25;
var rotateLowerLimit = 0;
var rotateUpperLimit = 0;
var countUpper = 1;
var countLower = 1;
var rotateLower = 0;
var rotateUpper = 0;
var webglX;
var webglY;
var ifDot;
//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d ) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}


//--------------------------------------------------


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    // context = canvas.getContext("2d");

    rect = canvas.getBoundingClientRect();
      
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // cBuffer = gl.createBuffer();
    // gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    // gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    // var vColor = gl.getAttribLocation( program, "vColor" );
    // gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    // gl.enableVertexAttribArray( vColor );

    document.getElementById("slider1").onchange = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[1] = event.target.value;
    };
    document.getElementById("slider3").onchange = function(event) {
         theta[2] =  event.target.value;
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );

    ifDot = gl.getUniformLocation(program, "ifDot");
    gl.uniform1i(ifDot, 0);
    

    render();
}

//----------------------------------------------------------------------------


function base() {
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    
    gl.uniform1i(ifDot, 0);
   
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}


function ball_draw()
{
    if (x != 0 && y != 0) 
    {
      var s = scale4(10, 10, 10);
      var t = mult(modelViewMatrix, s);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    
        gl.uniform1i(ifDot, 1);
        // console.log(webglX, webglY);
        // console.log(flatten([vec4(webglX, webglY, 0.0, 1.0)]));
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten([vec4(webglX, webglY, 0.0, 1.0)]), gl.STATIC_DRAW);
        // gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix)); 
        // gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix)); 
        // gl.uniform4fv(vColor, vec4(1.0, 0.0, 1.0, 1.0)); 
        // vPosition = gl.getAttribLocation( program, "vPosition" );     

        gl.drawArrays(gl.POINTS, 0, 1);

    }
}

//----------------------------------------------------------------------------

onmousedown = function(e) 
{

     webglX = (event.clientX - rect.left) / gl.canvas.width * 2 - 1;
       webglY = (event.clientY - rect.top) / gl.canvas.height * -2 + 1;
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
            // console.log(x, y);

      x = x - gl.canvas.width / 2;
      if(y >= gl.canvas.height / 2) {
         y = gl.canvas.height/2 - y;
      } else {
         y = gl.canvas.height / 2 - y;
      }
      // console.log(x, y);
      rotateLower = 0;
         rotateUpper = 0;
         

      y -= BASE_HEIGHT  * CONVERSION_RATE; 
      // console.log(y);
   var L2 = (UPPER_ARM_HEIGHT) * CONVERSION_RATE;
   var L1 = (LOWER_ARM_HEIGHT) * CONVERSION_RATE;

   var temp = (Math.pow(x,2) + Math.pow(y, 2) - Math.pow(L1, 2) - Math.pow(L2, 2)) / (2 * L1 * L2);
   var theta2 = Math.atan2(Math.sqrt(1 - Math.pow(temp, 2)), temp);

   var k1 = L1 + L2 * Math.cos(theta2);
   var k2 = L2 * Math.sin(theta2);

   var theta1 = Math.atan2(y, x) - Math.atan2(k2, k1);

   var theta1Degrees = toDegrees(theta1);
   var theta2Degrees = toDegrees(theta2);    

      rotateLowerLimit = -90 + theta1Degrees;
      rotateUpperLimit = theta2Degrees;
      
      if(rotateLowerLimit < 0) {
         countLower = -1;
      } else {
         countLower = 1;
      }

       
      if(rotateUpperLimit < 0) {
         countUpper = -1;
      } else {
         countUpper = 1;
      }
};

//----------------------------------------------------------------------------

function toDegrees (angle) {
   return angle * (180 / Math.PI);
}

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    ball_draw();

    modelViewMatrix = mat4();    
    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    
    modelViewMatrix = rotate(theta[Base], 0, 1, 0 );
    base();

    if(Math.abs(rotateUpper) >= Math.abs(rotateUpperLimit)) {
     rotateUpper = rotateUpperLimit;
     countUpper = 1;
  } else {
   rotateUpper += countUpper * 1;


  }

  if(Math.abs(rotateLower) >= Math.abs(rotateLowerLimit)) {
   rotateLower = rotateLowerLimit;
   countLower = 1;
  } else {
   rotateLower += countLower * 1;
  }


    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));

    theta[LowerArm] = rotateLower;

    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], 0, 0, 1 ));
    lowerArm();

    theta[UpperArm] = rotateUpper;

    // console.log(theta[LowerArm], theta[UpperArm]);
    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(theta[UpperArm], 0, 0, 1) );
    upperArm();

    modelViewMatrix = mat4();
    requestAnimFrame(render);
}
