// new scene, camera and light
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

// the renderer itself - alpha means transparency
var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = false;
document.body.appendChild(renderer.domElement);
var MAXANISO = renderer.getMaxAnisotropy();

// mouse control via another library
controls = new THREE.OrbitControls(camera, renderer.domElement);

// set default camera position
camera.position.z = 50;
camera.position.y = 500;
camera.position.x = 500;

var axisHelper = new THREE.AxisHelper(5);
scene.add(axisHelper);

// render loop
var render = function () {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};
render();

var models = {
    stair: null,
    slab: null,
};
count = 0;
for (key in Object.keys(models)) {
    loadModel(key);
}

function loadModel(key) {
    var JSONloader = new THREE.JSONLoader();
    JSONloader.load("/res/models/" + Object.keys(models)[key] + ".json", function (geometry, material) {
        models[Object.keys(models)[key]] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    });
}

// texture loader
function loadTexture(url) {
    var tex = THREE.ImageUtils.loadTexture(url);
    tex.anisotropy = MAXANISO;
    return tex;
}

function rotateStair(stair, dataValue) {
    switch (dataValue) {
        case 0:
            break;
        case 1:
            break;
        case 2:
            break;
        case 3:
            break;
        case 4:
            stair.rotation.z = Math.PI / 2;
            break;
        case 5:
            break;
        case 6:
            break;
        case 7:
            break;
    }

}

/**
 * makes a structure appear
 * @param json - json representation of the structure
 */
function generateStructure(json) {
    var data = JSON.parse(json);
    var blocks = data['blocks'];
    var palette = data['palette'];

    var loader = new THREE.TextureLoader();
    palette.forEach(function (element) {
        if (!element.textureFile) return;

        if (typeof element.textureFile === 'object') {
            console.log(element);
            var textures = element.textureFile;
            var sides, top, bottom;

            if (textures.hasOwnProperty("side")) {
                sides = textures.side;
            }

            if (textures.hasOwnProperty("top")) {
                top = textures.top;
            }

            if (textures.hasOwnProperty("bottom")) {
                bottom = textures.bottom;
            }

            if (!bottom) {
                bottom = sides;
            }

            if (!top) {
                top = sides;
            }

            element.texture = [
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png")
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png")
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + top + ".png")
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + bottom + ".png")
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png")
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png")
                })

            ];
        } else {
            element.texture = loadTexture("/res/textures/" + element.textureFile + ".png");
        }


    });

    // foreach block in the structure
    blocks.forEach(function (element) {
        paletteItem = palette[element.state];

        // if it's not an air block - need to do this better
        if (paletteItem.id != 0) {

            // get the position part of the object for easier use later
            var pos = element.pos;

            if (paletteItem.isStair) {
                console.log(paletteItem.dataValue);
                var stair = models.stair.clone();
                stair.material.map = paletteItem.texture;
                stair.scale.set(8, 8, 8);
                stair.position.set(pos.x * 16, pos.y * 16, (pos.z * 16) - 4);
                rotateStair(stair, dataValue);
                scene.add(stair);
            } else if (paletteItem.isSlab) {
                var slab = models.slab.clone();
                slab.material.map = paletteItem.texture;
                slab.scale.set(8, 8, 8);
                slab.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                scene.add(slab);
            } else {
                // 16x16x16 cube
                var geometry = new THREE.CubeGeometry(16, 16, 16);
                var texture = paletteItem.texture;
                var material;
                if (texture.constructor === Array) {
                    material = new THREE.MeshFaceMaterial(texture);
                } else {
                    material = new THREE.MeshBasicMaterial({map: palette[element.state].texture});
                }
                // make it happen

                var cube = new THREE.Mesh(geometry, material);
                // set position (since cubes are 16 units^3, need to times position by 16)
                cube.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                // show it
                scene.add(cube);
            }
        }

    })
}

// prevent form submission and instead send ajax request
document.getElementById("structure-upload").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var http = new XMLHttpRequest();

    var data = new FormData();
    var structure = document.getElementById("file").files[0];

    data.append("file", structure);

    console.log(data.get("file"));

    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //console.log(this.response);
            generateStructure(this.responseText);
        }
    };

    http.open(form.method, form.action);
    http.send(data);
});