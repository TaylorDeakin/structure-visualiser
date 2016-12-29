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
    pane: null,
    anvil: null,
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
        models[Object.keys(models)[key]] = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
    });
}

// texture loader function
function loadTexture(url) {
    var tex = new THREE.TextureLoader().load(url);
    tex.anisotropy = MAXANISO;
    return tex;
}

function addLight(pos) {
    var pLight = new THREE.PointLight(0xff0000, 1, 100);
    pLight.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
    scene.add(pLight);
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
    // the data value indicates which direction a stair ought to be facing
    switch (dataValue) {
        // facing south - bottom
        case 0:
            stair.rotationName = "facing south - bottom";
            // 180 degrees
            stair.rotation.y = Math.PI;
            stair.position.set((pos.x * 16), (pos.y * 16), (pos.z * 16) + 4);
            break;
        // facing north - bottom
        case 1:
            stair.rotationName = "facing north - bottom";
            stair.position.set((pos.x * 16), (pos.y * 16), (pos.z * 16) - 4);
            break;
        // facing east - bottom
        case 2:
            stair.rotationName = "facing east - bottom";
            // 270 degrees
            stair.rotation.y = 4.71239;
            stair.position.set((pos.x * 16) + 4, (pos.y * 16), pos.z * 16);
            break;
        // facing west - bottom
        case 3:
            stair.rotationName = "facing west - bottom";
            stair.rotation.y = 1.5708;
            stair.position.set((pos.x * 16) - 4, (pos.y * 16), pos.z * 16);
            break;
        // facing south - top
        case 4:
            stair.rotationName = "facing south - top";
            stair.position.set((pos.x * 16), (pos.y * 16), (pos.z * 16) + 4);
            stair.rotation.x = Math.PI;
            break;
        // facing north - top
        case 5:
            stair.rotationName = "facing north -top";
            stair.position.set((pos.x * 16), (pos.y * 16), (pos.z * 16) - 4);
            stair.rotation.z = Math.PI;
            break;
        // facing east - top
        case 6:
            stair.rotationName = "facing east - top";
            stair.position.set((pos.x * 16) + 4, (pos.y * 16), pos.z * 16);
            stair.rotation.z = Math.PI;
            stair.rotation.y = 4.71239;
            break;
        // facing west - top
        case 7:
            stair.rotationName = "facing west - top";
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
            if (element.id == 145) {
                element.texture = loadTexture("/res/textures/anvil_base.png");
                return;
            }

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
                new THREE.MeshPhongMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                }),
                new THREE.MeshPhongMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                }),
                new THREE.MeshPhongMaterial({
                    map: loadTexture("/res/textures/" + top + ".png"), transparent: true
                }),
                new THREE.MeshPhongMaterial({
                    map: loadTexture("/res/textures/" + bottom + ".png"), transparent: true
                }),
                new THREE.MeshPhongMaterial({
                    map: loadTexture("/res/textures/" + sides + ".png"), transparent: true
                }),
                new THREE.MeshPhongMaterial({
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

        // if block is air, we don't care, so exit early
        if (paletteItem.id == 0) {
            return;
        }

        var pos = element.pos;

        if (paletteItem.isLightSource) {
            addLight(pos);
        }

        // if we're using a custom model, we need to figure out which one
        if (paletteItem.hasOwnProperty("model")) {
            // get the position part of the object for easier use later
            var model;
            switch (paletteItem["model"]) {
                case "stair":
                    model = models.stair.clone(new THREE.MeshPhongMaterial);
                    model.material = models.stair.material.clone();
                    model.material.needsUpdate = true;
                    model.material.map = new THREE.TextureLoader().load("/res/textures/" + paletteItem.textureFile + ".png");

                    model.scale.set(8, 8, 8);
                    rotateStair(model, paletteItem.dataValue, pos);
                    scene.add(model);
                    model = null;
                    break;
                case "slab":
                    model = models.slab.clone();
                    model.material = models.slab.material.clone();
                    model.material.needsUpdate = true;
                    model.material.map = paletteItem.texture;
                    model.scale.set(8, 8, 8);
                    // slabs start out centered
                    // -4 will move them to the bottom
                    var offset = -4;
                    // slabs with a data value of 8 or higher are top slabs, so invert offset
                    if (paletteItem.dataValue > 7) {
                        offset = 4;
                    }
                    model.position.set(pos.x * 16, (pos.y * 16) + offset, pos.z * 16);
                    scene.add(model);
                    break;
                case "fence":
                    model = models.fencePost.clone();
                    model.material = models.fencePost.material.clone();
                    model.material.map = paletteItem.texture;
                    model.material.needsUpdate = true;
                    model.scale.set(8, 8, 8);
                    model.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                    scene.add(model);
                    break;
                case "anvil":
                    console.log("anvil found");
                    model = models.anvil.clone();
                    model.material = models.anvil.material.clone();
                    model.material.map = paletteItem.texture;
                    model.material.needsUpdate = true;
                    model.scale.set(8, 8, 8);
                    model.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                    scene.add(model);
                    break;
            }
        } else {
            // 16x16x16 cube
            var geometry = new THREE.CubeGeometry(16, 16, 16);
            var texture = paletteItem.texture;
            var material;
            if (texture.constructor === Array) {
                material = new THREE.MultiMaterial(texture);
            } else {
                material = new THREE.MeshPhongMaterial({map: palette[element.state].texture, transparent: true});
            }
            // make it happen
            var cube = new THREE.Mesh(geometry, material);
            // set position (since cubes are 16 units^3, need to times position by 16)
            cube.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
            // show it
            scene.add(cube);
        }
    });

    document.body.appendChild(renderer.domElement);

}

// prevent form submission and instead send ajax request
document.getElementById("structure-upload").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var http = new XMLHttpRequest();

    var data = new FormData();
    var structure = document.getElementById("file").files[0];

    data.append("file", structure);
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            generateStructure(this.responseText);
            render();
            removeSpinner();
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
