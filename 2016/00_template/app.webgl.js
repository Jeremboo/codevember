import THREELib from 'three-js';
const THREE = THREELib();

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707',
/**/       secondaryColor = '#FF7F16',
/**/       bgColor = '#0C171A';
/**/ let windowWidth = window.innerWidth,
/**/     windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new THREE.WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.renderer.setClearColor(new THREE.Color(bgColor));
/**/     this.scene = new THREE.Scene();
/**/     this.camera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.dom = this.renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h); // set render size
/**/   }
/**/   add(mesh) {
/**/     this.scene.add(mesh);
/**/     if (!mesh.update) return;
/**/     this.meshListeners.push(mesh.update);
/**/     this.meshCount++;
/**/   }
/**/   update() {
/**/     let i = this.meshCount;
/**/     while (--i >= 0) {
/**/       this.meshListeners[i].apply(this, null);
/**/     }
/**/     this.renderer.render(this.scene, this.camera);
/**/   }
/**/   resize(w, h) {
/**/     this.camera.aspect = w / h;
/**/     this.camera.updateProjectionMatrix();
/**/     this.renderer.setSize(w, h);
/**/   }
/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

// OBJECTS
class Example extends THREE.Object3D {
  constructor() {
    super();

    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(secondaryColor),
      shading: THREE.FlatShading,
      wireframe: true,
    });
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += 0.03;
    this.rotation.y += 0.03;
  }
}

// START
const ex = new Example();

// ADDS
webgl.add(ex);

/* ---- CREATING ZONE END ---- */
/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/ function onResize() {
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   webgl.resize(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', onResize);
/**/ window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
