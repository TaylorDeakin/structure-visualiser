// global variables for ThreeJS
var scene, camera, light, renderer, controls, MAXANISO;
var canvasOnScreen = false;
var progressAmount = 0;
var spinnerText = document.getElementById("spinner-text");
/**
 * Init will create all the required elements for this project to work
 */
function init() {
    // new scene, camera and light
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var light = new THREE.AmbientLight(0xffffff); // soft white light
    scene.add(light);

// the renderer itself - alpha means transparency
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;

    MAXANISO = renderer.getMaxAnisotropy();

    // mouse control via another library
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // set default camera position
    camera.position.z = 50;
    camera.position.y = 500;
    camera.position.x = 500;

    var axisHelper = new THREE.AxisHelper(5);
    scene.add(axisHelper);
    canvasOnScreen = true;
}

// render loop
var render = function () {
    // if no canvas, don't render
    if (!canvasOnScreen) {
        return;
    }
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};
// model object
var models = {
    stair: null,
    slab: null,
    fencePost: null,
    wallPost: null,
    wallInner: null,
};
// load all the models specified above
for (key in Object.keys(models)) {
    loadModel(key);
}
/**
 * loads a model using the json loader
 * model is then created and put into the model object structure above
 * @param key - the name of the model
 */
function loadModel(key) {
    var JSONloader = new THREE.JSONLoader();
    JSONloader.load("/res/models/" + Object.keys(models)[key] + ".json", function (geometry, material) {
        models[Object.keys(models)[key]] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    });
}

// texture loader function
function loadTexture(url) {
    var tex = THREE.ImageUtils.loadTexture(url);
    tex.anisotropy = MAXANISO;
    return tex;
}
/**
 * rotates stairs to their correct orientation and position
 *
 * note that this function does not currently work as intended
 * also, stair positions appear to be offset by a roughly 4 units in some direction
 * this function will hopefully solve that soon
 * @param stair
 * @param dataValue
 * @param pos
 */
function rotateStair(stair, dataValue, pos) {
    stair.isStair = true;
    spinnerText.innerHTML = "Rotating Stairs";
    stair.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
    console.log(dataValue);
    // the data value indicates which direction a stair ought to be facing
    switch (dataValue) {
        // facing south - bottom
        case 0:
            stair.rotationName = "facing south - bottom";
            // 180 degrees
            stair.rotation.y = Math.PI;
            stair.position.set((pos.x * 16), (pos.y * 16), (pos.z * 16) + 8);
            break;
        // facing north - bottom
        case 1:
            stair.rotationName = "facing north - bottom";
            break;
        // facing east - bottom
        case 2:
            stair.rotationName = "facing east - bottom";
            // 270 degrees
            stair.rotation.y = 4.71239;
            stair.position.set(pos.x * 16, (pos.y * 16), pos.z * 16);
            break;
        // facing west - bottom
        case 3:
            stair.rotationName = "facing west - bottom";
            stair.rotation.y = 1.5708;
            stair.position.set((pos.x * 16) - 4, pos.y * 16, pos.z * 16);
            break;
        // facing south - top
        case 4:
            stair.position.set(pos.x * 16, pos.y * 16, (pos.z * 16));
            stair.rotation.z = Math.PI;
            break;
        // facing north - top
        case 5:
            stair.position.set(pos.x * 16, (pos.y * 16) + 4, (pos.z * 16) + 4);
            stair.rotation.z = Math.PI;
            stair.rotation.x = Math.PI / 2;
            break;
        // facing east - top
        case 6:
            stair.position.set((pos.x * 16) + 4, pos.y * 16, pos.z * 16);
            stair.rotation.z = Math.PI;
            stair.rotation.y = 4.71239;
            break;
        // facing west - top
        case 7:
            stair.rotation.z = Math.PI;
            stair.position.set((pos.x * 16) - 4, pos.y * 16, pos.z * 16);
            stair.rotation.y = 1.5708;
            break;
    }

}

/**
 * makes a structure appear
 * @param json - json representation of the structure
 */
function generateStructure(json) {
    spinnerText.innerHTML = "Creating Canvas...";
    // make it happen
    init();

    var data = JSON.parse(json);
    var blocks = data['blocks'];
    var palette = data['palette'];

    spinnerText.innerHTML = "Loading Textures";
    // foreach element in the palette we want to apply all the textures
    palette.forEach(function (element) {
        // if the palette doesn't have a texture, we don't care (mainly air blocks, but also unsupported blocks)
        if (!element.textureFile) return;
        // if it's an object, it has different textures for different sides
        // ex logs, furnace etc
        if (typeof element.textureFile === 'object') {

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
            // make a cube
            element.texture = [
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + top + ".png"), transparent: true
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + bottom + ".png"), transparent: true
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                }),
                new THREE.MeshLambertMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                })

            ];
        } else {
            element.texture = loadTexture("/res/textures/" + element.textureFile + ".png");
        }

    });
    spinnerText.innerHTML = "Placing Blocks";
    // foreach block in the structure, we want to put it in place
    blocks.forEach(function (element) {
        paletteItem = palette[element.state];

        // if it's not an air block
        if (paletteItem.id != 0) {

            // get the position part of the object for easier use later
            var pos = element.pos;

            if (paletteItem.isStair) {
                var stair = models.stair.clone();
                stair.material.map = paletteItem.texture;
                stair.material.needsUpdate = true;
                stair.scale.set(8, 8, 8);
                rotateStair(stair, paletteItem.dataValue, pos);
                scene.add(stair);
            } else if (paletteItem.isSlab) {
                var slab = models.slab.clone();
                slab.material.map = paletteItem.texture;
                slab.material.needsUpdate = true;
                slab.scale.set(8, 8, 8);
                // slabs start out centered
                // -4 will move them to the bottom
                var offset = -4;
                // slabs with a data value of 8 or higher are top slabs, so invert offset
                if (paletteItem.dataValue > 7) {
                    offset = 4;
                }
                slab.position.set(pos.x * 16, (pos.y * 16) + offset, pos.z * 16);
                scene.add(slab);
            } else if (paletteItem.isFence) {
                var fence = models.fencePost.clone();
                fence.material.map = paletteItem.texture;
                fence.material.needsUpdate = true;
                fence.scale.set(8, 8, 8);
                fence.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                scene.add(fence);
            } else {
                // 16x16x16 cube
                var geometry = new THREE.CubeGeometry(16, 16, 16);
                var texture = paletteItem.texture;
                var material;
                if (texture.constructor === Array) {
                    material = new THREE.MeshFaceMaterial(texture);
                } else {
                    material = new THREE.MeshBasicMaterial({map: palette[element.state].texture, transparent: true});
                }
                // make it happen

                var cube = new THREE.Mesh(geometry, material);
                // set position (since cubes are 16 units^3, need to times position by 16)
                cube.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                // show it
                scene.add(cube);
            }
        }
    });
    document.body.appendChild(renderer.domElement);
    removeSpinner();
    render();
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
            generateStructure(this.responseText);
        }
    };

    http.open(form.method, form.action);
    http.send(data);
    clearScreen();
});

// file input magic, copied from https://tympanus.net/Tutorials/CustomFileInputs/
var input = document.getElementById("file");

input.addEventListener('focus', function () {
    input.classList.add('has-focus');
});
input.addEventListener('blur', function () {
    input.classList.remove('has-focus');
});

var inputs = document.querySelectorAll('.inputfile');
Array.prototype.forEach.call(inputs, function (input) {
    var label = input.nextElementSibling,
        labelVal = label.innerHTML;

    input.addEventListener('change', function (e) {
        var fileName = '';
        if (this.files && this.files.length > 1)
            fileName = ( this.getAttribute('data-multiple-caption') || '' ).replace('{count}', this.files.length);
        else
            fileName = e.target.value.split('\\').pop();

        if (fileName)
            label.querySelector('span').innerHTML = fileName;
        else
            label.innerHTML = labelVal;
    });
});

// spinner stuff
var main = document.getElementById("mainWrapper");
function clearScreen() {
    main.className += " exit";
    setTimeout(showSpinner, 500);
}

function showSpinner() {
    main.parentNode.removeChild(main);
    document.getElementById("spinner").className = "spinner entrance";
}

function removeSpinner() {
    var spinner = document.getElementById("spinner");
    document.body.removeChild(spinner);
}
