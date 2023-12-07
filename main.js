//IMPORT MODULES
import './style.css';
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

//CONSTANT & VARIABLES
let width = window.innerWidth;
let height = window.innerHeight;
//-- GUI PAREMETERS
var gui;
const parameters = {
    pointX: 1,
    pointY: 1,
    pointZ: 1,
    gridSizeX: 3,
    gridCountX: 2,
}
 

//-- SCENE VARIABLES
var gui;
var scene;
var camera;
var renderer;
var container;
var control;
var ambientLight;
var directionalLight;

//-- GEOMETRY PARAMETERS
//Create an empty array for storing all the cubes
let gridSize = parameters.gridSizeX ;
let gridCount = parameters.gridCountX ;
let pointLocationX = parameters.pointX;
let pointLocationY = parameters.pointY;
let pointLocationZ = parameters.pointZ;
let pointInScene = null;
let baseGridScene = [[]];
let scaledGridScene = [[]];
let remappedDistanceArray = [[]];
let distanceArray = [[]]; 
let resultMeshArray = [[]];


function main(){
  //GUI
  gui = new GUI;
  gui.add(parameters, 'pointX', 0, 10, 0.1);
  gui.add(parameters, 'pointY', 0, 10, 0.1);
  gui.add(parameters, 'pointZ', 0, 10, 0.1);  
  gui.add(parameters, 'gridCountX', 1, 20, 1);
  gui.add(parameters, 'gridSizeX', 1, 10, 0.1);

  //CREATE SCENE AND CAMERA
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 50, width / height, 0.1, 1000);
  camera.position.set(10, 10, 10)

  //LIGHTINGS
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
  directionalLight.position.set(2,5,5);
  directionalLight.target.position.set(-1,-1,0);
  scene.add( directionalLight );
  scene.add(directionalLight.target);

  //GEOMETRY INITIATION
  // Initiate first cubes
  createPoint();
  createBaseGrid();
  getDistance();
  remapDistance();
  createScaledGrid();
  booleanDifference();


  //RESPONSIVE WINDOW
  window.addEventListener('resize', handleResize);
 
  //CREATE A RENDERER
  renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container = document.querySelector('#threejs-container');
  container.append(renderer.domElement);
  
  //CREATE MOUSE CONTROL
  control = new OrbitControls( camera, renderer.domElement );

  //EXECUTE THE UPDATE
  animate();
}
 
//-----------------------------------------------------------------------------------
//HELPER FUNCTIONS


//-----------------------------------------------------------------------------------

//GEOMETRY FUNKTIONS

//Create Grid
const createBaseGrid = () => {
  const cellSizeU =  gridSize / gridCount;
  const cellSizeV = cellSizeU;
  const cellCountU = gridCount;
  const cellCountV = cellCountU
  for (let i = 0; i < cellCountU; i++) {
    for (let j = 0; j < cellCountV; j++){

      const geometry = new THREE.BoxGeometry(cellSizeU, cellSizeV, 0.1);
      const material = new THREE.MeshPhysicalMaterial();
      material.color = new THREE.Color(0xffffff);
      material.color.setRGB(0, 0, Math.random());
      const cell = new THREE.Mesh(geometry, material); 
      cell.position.set((0.5 * cellSizeU) + (i * cellSizeU),(0.5 * cellSizeV) + (j * cellSizeV),0);
      cell.name = "cell_" + i + "_" + j;
      cell.visible = true; 
      baseGridScene [[i][j]] = cell;
      scene.add(cell);
      // console.log(cell.position);
    } 
  }

};

// Create Refernz Point
const createPoint = () =>{

  const pointGeometry = new THREE.BufferGeometry();
  const pointMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.2 });
  const positionPoint = new Float32Array([pointLocationX , pointLocationY , pointLocationZ])
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(positionPoint, 3));
  const point = new THREE.Points(pointGeometry,pointMaterial);
  
  point.position.set(pointLocationX,pointLocationY,pointLocationZ);
  point.name = "point";
  pointInScene = point;
  scene.add(point);


}

// GET DISTANCE BETEWEEN CELLS AND POINT

const getDistance = () => {

  let cellCountU = gridCount;
  let cellCountV = cellCountU;
  let pointCoordinatX = pointInScene.position.x;
  let pointCoordinatY = pointInScene.position.y;
  // let pointCoordinatZ = pointInScene.position.z;
 
 
  for (let i = 0; i < cellCountU ; i++) {
    
    distanceArray[i] = [];
    
    for (let j = 0; j < cellCountV ; j++){

      let cellToMeasure = scene.getObjectByName("cell_" + i + "_" + j);

      // console.log(cellToMeasure);

      let cellPostionX = cellToMeasure.position.x;
      let cellPostionY = cellToMeasure.position.y;
      
      let distnaceX = pointCoordinatX - cellPostionX;
      let distanceY = pointCoordinatY - cellPostionY;

      let distanceLength = Math.sqrt((distnaceX * distnaceX)+(distanceY*distanceY));
      
      // console.log(distnaceXY);
      distanceArray[i][j] = [distanceLength];     

    }
  }
}

//REMAP THE DISTANCE TO VALUES BETWEEN 0 and 1
const remapDistance = () => {

  let cellCountU = gridCount;
  let cellCountV = cellCountU;

  let minDistance = Number.POSITIVE_INFINITY;
  let maxDistance = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < cellCountU ; i++) {
    
    for (let j = 0; j < cellCountV ; j++){
      
      let distanceLengthTotal = distanceArray[i][j];

      minDistance = Math.min(minDistance, distanceLengthTotal);
      maxDistance = Math.max(maxDistance, distanceLengthTotal);

    }
  } 


  
  for (let i = 0; i < cellCountU ; i++) {
    remappedDistanceArray[i] = [];
    
    for (let j = 0; j < cellCountV ; j++){
      
      let originalDistance = distanceArray[i][j];

      let remappedDistance = (originalDistance - (minDistance+0.05)) / ((maxDistance+0.05) - (minDistance+0.05));

      let scaleFactor = remappedDistance;

      remappedDistanceArray[i][j] = scaleFactor;
      

    }
  } 

  // console.log("Minimum Distance:", minDistance);
  // console.log("Maximum Distance:", maxDistance);

}

//CREATE SECOND GRID

const createScaledGrid = () => {

  let cellCountU = gridCount;
  let cellCountV = cellCountU;

  for (let i = 0; i < cellCountU ; i++) {
    scaledGridScene[i] = [];
    
    for (let j = 0; j < cellCountV ; j++){

      let girdGeometire = null;
      let scaleFactor = null;

      girdGeometire = scene.getObjectByName("cell_" + i + "_" + j);

      let gridCloneGeometry = girdGeometire.geometry.clone();
      let gridCloneMaterial = girdGeometire.material.clone();
      let gridClonePosition = girdGeometire.position.clone();


      gridCloneMaterial.color = new THREE.Color(0xffffff);
      gridCloneMaterial.color.setRGB(0,  1, 0.5);
      const cellScaled = new THREE.Mesh(gridCloneGeometry, gridCloneMaterial);
      cellScaled.position.copy(gridClonePosition);
      cellScaled.name = "cellScaled_" + i + "_" + j;
      cellScaled.visible = true;
      scaleFactor = remappedDistanceArray[i][j];

      

      cellScaled.scale.set(scaleFactor , scaleFactor,5);
      // console.log(cellScaled);
      
      scene.add(cellScaled);

      scaledGridScene[i][j] = cellScaled;

      // console.log(scene);

    }
  } 

};

//SUBTRACT SCALED GRID FROM MAIN GRID

const booleanDifference = () => {

  let cellCountU = gridCount;
  let cellCountV = cellCountU;

  for (let i = 0; i < cellCountU ; i++) {

    resultMeshArray[i] = [];

    for (let j = 0; j < cellCountV ; j++){

      let gridBase = scene.getObjectByName("cellScaled_" + i + "_" + j);
      let gridSubtract = scene.getObjectByName("cell_" + i + "_" + j);
      let gridClonePosition = gridBase.position.clone();

      const currentScale = gridSubtract.scale.clone();
      const inverseScale = new THREE.Vector3(1 / currentScale.x, 1 / currentScale.y, 1 / currentScale.z);
      gridSubtract.scale.copy(inverseScale);
  
      const gridBaseBsp = CSG.fromMesh(gridBase);
      const gridRemoveBsp = CSG.fromMesh(gridSubtract);

      const resultBsp = gridRemoveBsp.subtract(gridBaseBsp);
      const resultMesh = CSG.toMesh(resultBsp, gridBase.matrix)
      // resultMesh.material = gridBase.material;
      const basicMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      resultMesh.material = basicMaterial;
      resultMesh.visible = true;
      resultMesh.position.copy(gridClonePosition);
      resultMesh.name = "Result_" + i + "_" + j;


      scene.add(resultMesh);
      let testingMesh = scene.getObjectByName("Result_" + i + "_" + j);
      // console.log(testingMesh);

      resultMeshArray[i][j] = resultMesh;
      // console.log(resultMesh)
    }
  }
  // removeScaledGrid();
  // removeBaseGrid();

};



//REMOVE OBJECTS and clean the caches
function removeObject(sceneObject) {
  if (!(sceneObject instanceof THREE.Object3D)) {
    console.error("Object is not an instance of THREE.Object3D");
    console.log(sceneObject)
    return;
  }

  // Remove object from scene
  scene.remove(sceneObject);

  // Remove geometries to free GPU resources
  if (sceneObject.geometry) {
    sceneObject.geometry.dispose();
  }

  // Remove materials to free GPU resources
  if (sceneObject.material) {
    if (sceneObject.material instanceof Array) {
      sceneObject.material.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    } else {
      if (sceneObject.material.map) sceneObject.material.map.dispose();
      sceneObject.material.dispose();
    }
  }
}

//Remove SCALEDGRID
const removeScaledGrid = () => {
  let cellCountU = gridCount;
  let cellCountV = cellCountU;

  for (let i = 0; i < cellCountU ; i++) {
    for (let j = 0; j < cellCountV ; j++){

      let scaledCellToRemove = scene.getObjectByName("cellScaled_" + i + "_" + j);
      // console.log(scaledCellToRemove);
      
      removeObject(scaledCellToRemove);

    }
  }

  scaledGridScene = [];
}

//Remove BASEGRID
const removeBaseGrid = () => {
  let cellCountU = gridCount;
  let cellCountV = cellCountU;

  for (let i = 0; i < cellCountU ; i++) {
    for (let j = 0; j < cellCountV ; j++){

      let cellToRemove = scene.getObjectByName("cell_" + i + "_" + j);
      removeObject(cellToRemove);

    }
  }

  gridSize = parameters.gridSizeX;
  gridCount = parameters.gridCountX;
  baseGridScene = [];
}

//Remove ResultGrid
const removeResultGrid = () => {
  let cellCountU = gridCount;
  let cellCountV = cellCountU;

  for (let i = 0; i < cellCountU ; i++) {
    for (let j = 0; j < cellCountV ; j++){

      let cellToRemove = scene.getObjectByName("Result_" + i + "_" + j);
      removeObject(cellToRemove);
      // console.log(cellToRemove);
      // console.log(scene);

    }
  }
}

// REMOVE Point

function removePoint(){
  pointLocationX = parameters.pointX;
  pointLocationY = parameters.pointY;
  pointLocationZ = parameters.pointZ;


  let scenePoint = scene.getObjectByName("point");
  removeObject(scenePoint);
}

//RESPONSIVE
function handleResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
}

//ANIMATE AND RENDER
const animate = () => {
  requestAnimationFrame(animate);

  // 1. Update controls.
  control.update();

  // 2. Check for parameter changes and update the scene.
  if (gridSize !== parameters.gridSizeX || gridCount !== parameters.gridCountX) {
    console.log("Updating grid parameters...");
    removeResultGrid();
    removeScaledGrid();
    removeBaseGrid();
    createBaseGrid();
    getDistance();
    remapDistance();
    createScaledGrid();
    booleanDifference();
    // console.log(scene);
  }

  if (
    pointLocationX !== parameters.pointX ||
    pointLocationY !== parameters.pointY||
    pointLocationZ !== parameters.pointZ
  ) {
    console.log("Updating point parameters...");
    removeResultGrid();
    removeScaledGrid();
    removePoint();
    createPoint();
    removeBaseGrid();
    createBaseGrid();
    getDistance();
    remapDistance();
    createScaledGrid();
    booleanDifference();
    // console.log(scene);
  }

  // 3. Render the scene.
  renderer.render(scene, camera);
};
//-----------------------------------------------------------------------------------
// CLASS
//-----------------------------------------------------------------------------------


//-----------------------------------------------------------------------------------
// EXECUTE MAIN 
//-----------------------------------------------------------------------------------

main();
