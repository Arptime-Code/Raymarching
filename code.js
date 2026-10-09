//Constants general
const movementConstants = {
  xVelocity : 0,
  yVelocity : 0,
  zVelocity : 0,

  drag : 0.97,

  maxSpeed : 0.02,
};

const keysPressed = {
  "w" : false,
  "a" : false,
  "s" : false,
  "d" : false,
  "ArrowUp" : false,
  "ArrowDown" : false,
};

const mouseMovement = {
  x : 0,
  y : 0,
  sensitivity : 4000,
}






let tmpLoop = Date.now();




//Shader Constants
//Player inputs
const playerPosition = new Float32Array([
  0.0, 1.0, 5.0
]);

const playerRotation = new Float32Array([
  0.0, 0.0, 0.0
]);


//Triangle-/Screen Setup
const corners = new Float32Array([
  -1,-1,  1,-1,  1,1,     // triangle 1
  -1,-1,  1,1,  -1,1,     // triangle 2
]);


//Time
const startingTime = Date.now();
const playerTime = new Uint32Array([
  0
]);







//Event listeners
window.addEventListener("keydown", (event) => {
  keysPressed[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keysPressed[event.key] = false;
});


window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== myCanvas) return;

  mouseMovement.x = event.movementX;
  mouseMovement.y = event.movementY;
});




//Canvas setup - chnage later wiht a title screen
myCanvas.addEventListener('click', () => {
  myCanvas.requestPointerLock();
});








async function getShader() {
  const response = await fetch('./shader.wgsl');
  return await response.text();
}



async function init() {
  const shaderCode = await getShader();





  const canvas  = document.getElementById("myCanvas");
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const context      = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  const adapter      = await navigator.gpu.requestAdapter();
  const device       = await adapter.requestDevice();
  const encoder      = device.createCommandEncoder();

  context.configure({ device, format: canvasFormat });




  const vertexBuffer = device.createBuffer({
    size: corners.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const playerPositionBuffer = device.createBuffer({
    size: playerPosition.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const playerRotationBuffer = device.createBuffer({
    size: playerRotation.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const playerTimeBuffer = device.createBuffer({
    size: playerTime.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });




  device.queue.writeBuffer(vertexBuffer, 0, corners);

  device.queue.writeBuffer(playerPositionBuffer, 0, playerPosition);
  device.queue.writeBuffer(playerRotationBuffer, 0, playerRotation);
  device.queue.writeBuffer(playerTimeBuffer, 0, playerTime);





  const shaderModule = device.createShaderModule({ code: shaderCode });










  const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vertexMain",
      buffers: [{
        arrayStride: 8,
        attributes: [{ format: "float32x2", offset: 0, shaderLocation: 0 }],
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragmentMain",
      targets: [{ format: canvasFormat }],
    },
  });





  //for uniform input
  bindGroupLayout = renderPipeline.getBindGroupLayout(0);

  let bindGroup = device.createBindGroup({
    layout : bindGroupLayout,
    entries : [
      {
        binding : 0,
        resource : { buffer : playerPositionBuffer }
      },
      {
        binding : 1,
        resource : { buffer : playerRotationBuffer }
      },
      {
        binding : 2,
        resource : { buffer : playerTimeBuffer }
      }
    ]
  });








  const renderPass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      storeOp: "store",
    }],
  });






  renderPass.setBindGroup(0, bindGroup);





  renderPass.setPipeline(renderPipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);


  renderPass.draw(6); //6 verticies


  renderPass.end();
  device.queue.submit([encoder.finish()]);















  function render() {
    //playerPosition[2] += 0.0002; this is for easy animation


    //update position
    //basicMovement();
    advancedMovement();
    basicMouseRotation();



    if (((Date.now() - tmpLoop) / 1000) > 1) {
      playerTime[0] = (Date.now() - startingTime) % 100;

      tmpLoop = Date.now();
    }






    //what has to be done every frame (boilerplate)
    device.queue.writeBuffer(playerPositionBuffer, 0, playerPosition);
    device.queue.writeBuffer(playerRotationBuffer, 0, playerRotation);
    device.queue.writeBuffer(playerTimeBuffer, 0, playerTime);







    const encoder = device.createCommandEncoder();

    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        storeOp: "store",
      }],
    });

    renderPass.setBindGroup(0, bindGroup);
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(6);
    renderPass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init();








function basicMovement() {
  if(keysPressed["w"] == true) {
    playerPosition[2] -= 0.005;
  }
  if(keysPressed["s"] == true) {
    playerPosition[2] += 0.005;
  }
  if(keysPressed["a"] == true) {
    playerPosition[0] -= 0.005;
  }
  if(keysPressed["d"] == true) {
    playerPosition[0] += 0.005;
  }
  if(keysPressed["ArrowDown"] == true) {
    playerPosition[1] -= 0.005;
    }
  if(keysPressed["ArrowUp"] == true) {
    playerPosition[1] += 0.005;
  }
}


function basicMouseRotation() {
  playerRotation[0] += (mouseMovement.x/mouseMovement.sensitivity);
  playerRotation[1] -= (mouseMovement.y/mouseMovement.sensitivity);
  
  mouseMovement.x = 0;
  mouseMovement.y = 0;
}







function advancedMovement() {
  if(keysPressed["w"] == true && movementConstants.zVelocity > -movementConstants.maxSpeed) {
    movementConstants.zVelocity -= 0.001;
  }
  if(keysPressed["s"] == true && movementConstants.zVelocity < movementConstants.maxSpeed) {
    movementConstants.zVelocity += 0.001;
  }

  if(keysPressed["a"] == true && movementConstants.xVelocity > -movementConstants.maxSpeed) {
    movementConstants.xVelocity -= 0.001;
  }
  if(keysPressed["d"] == true && movementConstants.xVelocity < movementConstants.maxSpeed) {
    movementConstants.xVelocity += 0.001;
  }

  if(keysPressed["ArrowDown"] == true && movementConstants.yVelocity > -movementConstants.maxSpeed) {
    movementConstants.yVelocity -= 0.001;
  }
  if(keysPressed["ArrowUp"] == true && movementConstants.yVelocity < movementConstants.maxSpeed) {
    movementConstants.yVelocity += 0.001;
  }






  movementConstants.xVelocity *= movementConstants.drag;
  movementConstants.yVelocity *= movementConstants.drag;
  movementConstants.zVelocity *= movementConstants.drag;



  if(Math.abs(movementConstants.xVelocity) < 0.000001) {
    movementConstants.xVelocity = 0;
  }
  if(Math.abs(movementConstants.yVelocity) < 0.000001) {
    movementConstants.yVelocity = 0;
  }
  if(Math.abs(movementConstants.zVelocity) < 0.000001) {
    movementConstants.zVelocity = 0;
  }



  const yaw  = playerRotation[0];
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  playerPosition[0] += movementConstants.xVelocity * cosY - movementConstants.zVelocity * sinY;
  playerPosition[1] += movementConstants.yVelocity;   // up/down stays world-space
  playerPosition[2] += movementConstants.xVelocity * sinY + movementConstants.zVelocity * cosY;
}







//Audio effects

// document.addEventListener('click', () => {
//   const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//   const oscillator = audioContext.createOscillator();
//   const oscillator2 = audioContext.createOscillator();
//   const gainNode = audioContext.createGain();

//   oscillator.frequency.value = 440;
//   oscillator.detune.value = 0;
//   oscillator.type = 'sawtooth'; //sine, square, triangle, sawtooth or custom
//   gainNode.gain.value = 0.02; //1 is 100%


//   oscillator2.frequency.value = 470;
//   oscillator2.type = 'sine';
//   gainNode.gain.value = 0.02;


//   oscillator.connect(gainNode);
//   oscillator2.connect(gainNode);
//   gainNode.connect(audioContext.destination);

//   oscillator.start();
//   oscillator2.start();
// }, { once: true });
