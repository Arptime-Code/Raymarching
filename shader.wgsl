struct VertexOutput {
  @builtin(position) verticesPosition: vec4f,
  @location(0) screenCoord: vec2f, //this gets converted to pixel positions into the fragment shader
};


struct MyUniforms {
    time: u32,
}






@group(0) @binding(2) var<uniform> uniforms: MyUniforms;


@group(0) @binding(0) var<uniform> playerPosition: vec3f;
@group(0) @binding(1) var<uniform> playerRotation: vec3f;


const numberOfLights = 3;
const lightPositions = array<vec3f, numberOfLights>(vec3f(0.0,0.0,10.0), vec3f(0.0, 10.0, 0.0), vec3f(10.0, 0.0, 0.0));
const lightColors = array<vec4f, numberOfLights>(vec4f(1.0,0.0,0.0,1.0), vec4f(0.0,0.0,1.0,1.0), vec4f(0.0,1.0,0.0,1.0));
const lightRadius = array<f32, numberOfLights>(200.0, 200.0, 200.0);
const lightDecayRates = array<f32, numberOfLights>(0.5, 0.5, 0.5);
const lightBrightness = array<f32, numberOfLights>(0.8, 0.8, 0.8);



@vertex
fn vertexMain(@location(0) vertices: vec2f) -> VertexOutput {
  return VertexOutput(vec4f(vertices, 0.0, 1.0), vertices); //return into struct
}










@fragment
fn fragmentMain(@location(0) screenCoord: vec2f) -> @location(0) vec4f {

  let rayOrigin    = vec3f(playerPosition); //camera position
  let rayDirection = normalize(vec3f(screenCoord.x * (16/9), screenCoord.y, -1.0)); //set fov with last value //aspect ration 16/9


  //Rotation
  let angleX = playerRotation.y;
  var rotatedDir = vec3f(
    rayDirection.x, 
    rayDirection.y * cos(angleX) - rayDirection.z * sin(angleX),
    rayDirection.y * sin(angleX) + rayDirection.z * cos(angleX),
  );
  let angleY = playerRotation.x;
  rotatedDir = vec3f(
    rotatedDir.x * cos(angleY) - rotatedDir.z * sin(angleY),
    rotatedDir.y, 
    rotatedDir.x * sin(angleY) + rotatedDir.z * cos(angleY),
  );
  let angleZ = playerRotation.z;
  rotatedDir = vec3f(
    rotatedDir.x * cos(angleZ) - rotatedDir.y * sin(angleZ),
    rotatedDir.x * sin(angleZ) + rotatedDir.y * cos(angleZ),
    rotatedDir.z,
  );



  var totalDistance = 0.0;
  var maxDistance   = 100.0;


  var samplePoint = vec3f(0.0, 0.0, 0.0);

  for (var step = 0; step < 300; step++) {
    samplePoint = rayOrigin + rotatedDir * totalDistance;








    let distanceToSurface = createObjects(samplePoint);








    if (distanceToSurface < 0.00000001) { break; }

    totalDistance += distanceToSurface;
    
    
    if (totalDistance > maxDistance) { return vec4f(0.0, 0.0, 0.0, 1.0); }



  }







  return calcColor(samplePoint);//ec4f(1.0, 1.0, 1.0, 1.0); //- vec4f(((vec3f(0.9, 0.9, 0.9) / maxDistance) * min(totalDistance, maxDistance)), 1.0); //my try at fog
}





fn calcColor(samplePoint: vec3f) -> vec4f {
  //Here color code
  const lightWeightExponent = 2;


  var colorBrightness = 0.0;

  var weightColor = vec4f(0.0,0.0,0.0,0.0);
  var totalWeight = 0.0;

  for(var lightId = 0; lightId < numberOfLights; lightId++) {
    let lightDistance = distance(samplePoint, lightPositions[lightId]);

    //let lightWeight = (1 / pow(lightDistance, 2));
    let lightWeight = exp(-lightDecayRates[lightId] * lightDistance); 

    weightColor += (lightWeight * lightColors[lightId]);
    totalWeight += lightWeight;

    colorBrightness += (max(0.0, 1.0 - (lightDistance / lightRadius[lightId])) * lightBrightness[lightId]); 
  }

  let surfaceColor = (weightColor / totalWeight);

  //colorBrightness = (colorBrightness / (1.0 + colorBrightness));
  return (surfaceColor * colorBrightness);
}









fn createObjects(samplePoint: vec3f) -> f32 {
  //Create
  let sphere1 = createSphere(samplePoint, vec3f((randNumberPositive(uniforms.time, 0, 8)-4), 0.0, 0.0), 1.0);
  let sphere2 = createSphere(samplePoint, vec3f(1.5, 0.0, 0.0), 0.5);
  let sphere3 = createSphere(samplePoint, vec3f(1.5, 0.0, -10.0), 2.5);

  //Combine
  var distanceToSurface = min(min(sphere1, sphere2), sphere3);


  //Grid
  let sphereInfinite = createSphere(repeatSimpleSDF(samplePoint, vec3f(5.0, 5.0, 5.0)), vec3f(0.0, 0.0, 0.0), 0.1);

  distanceToSurface = min(distanceToSurface, sphereInfinite);

  return distanceToSurface;
}


fn repeatSimpleSDF(samplePoint: vec3f, spacing: vec3f) -> vec3f {
    return samplePoint - (spacing * round(samplePoint / spacing));
}




fn createSphere(samplePoint: vec3f, worldPosition: vec3f, size: f32) -> f32 {
    let sphere = length(samplePoint - worldPosition) - size;
    
    return sphere;
}




fn randFloat(seed: u32) -> f32 {
    return fract(f32(seed) * 12345.6789);
}

fn randNumberPositive(seed: u32, start: u32, end: u32) -> f32 {
    return f32(start) + (randFloat(seed) * f32(end - start));
}