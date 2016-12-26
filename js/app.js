var scene, camera, light, renderer, controls, MAXANISO;
var canvasOnScreen = false;
var progressAmount = 0;
var spinnerText = document.getElementById("spinner-text");
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
    if (!canvasOnScreen) {
        return;
    }
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};

var models = {
    stair: null,
    slab: null,
};
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

function rotateStair(stair, dataValue, pos) {
    spinnerText.innerHTML = "Rotating Stairs";
    stair.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
    console.log(dataValue);
    switch (dataValue) {
        // facing south - bottom
        case 0:
            // 180 degrees
            stair.rotation.y = Math.PI;
            stair.position.set((pos.x * 16) + 4, pos.y * 16, pos.z * 16);
            break;
        // facing north - bottom
        case 1:
            break;
        // facing east - bottom
        case 2:
            // 270 degrees
            stair.rotation.y = 4.71239;
            stair.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
            break;
        // facing west - bottom
        case 3:
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

var incrementAmount;
/**
 * makes a structure appear
 * @param json - json representation of the structure
 */
function generateStructure(json) {
    spinnerText.innerHTML = "Creating Canvas...";
    init();

    var data = JSON.parse(json);
    var blocks = data['blocks'];
    incrementAmount = 100 / blocks.length;
    var palette = data['palette'];

    spinnerText.innerHTML = "Loading Textures";
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
    spinnerText.innerHTML = "Placing Blocks";
    // foreach block in the structure
    blocks.forEach(function (element) {
        paletteItem = palette[element.state];

        // if it's not an air block - need to do this better
        if (paletteItem.id != 0) {

            // get the position part of the object for easier use later
            var pos = element.pos;

            if (paletteItem.isStair) {
                var stair = models.stair.clone();
                stair.material.map = paletteItem.texture;
                stair.scale.set(8, 8, 8);

                rotateStair(stair, paletteItem.dataValue, pos);
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
    //document.body.removeChild(spinner);
}
