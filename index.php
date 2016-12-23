<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        body {
            margin: 0;
        }

        canvas {
            width: 100%;
            height: 100%
        }
    </style>
</head>
<body>
<h1>Structure Visualiser</h1>
<p>Upload a file to start!</p>

<form action="/php/upload.php" enctype="multipart/form-data" method="post" id="structure-upload">
    <label for="file"></label>
    <input id="file" name="file" type="file">
    <button type="submit">Go!</button>
</form>

<div id="result"></div>
<script src="js/three.min.js"></script>
<script src="js/OrbitControls.js"></script>
<script>

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

    // mouse control via another library
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    camera.position.z = 50;
    camera.position.y = 500;
    camera.position.x = 500;

    // render loop
    var render = function () {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    };
    render();
</script>
<script>

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
                //document.getElementById("result").innerHTML = this.response;
                generateStructure(this.responseText);
            }
        };

        http.open(form.method, form.action);
        http.send(data);
    });

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
            element.texture = loader.load("/res/textures/" + element.textureFile + ".png");
        });

        // foreach block in the structure
        blocks.forEach(function (element) {
            // if it's not an air block - need to do this better
            if (palette[element.state].name != "air") {
                // get the position part of the object for easier use later
                var pos = element.pos;
                // 16x16x16 cube
                var geometry = new THREE.CubeGeometry(16, 16, 16);
                // random colour for now, while I work on textures
                var material = new THREE.MeshBasicMaterial({map: palette[element.state].texture/*color: 0xffffff * Math.random()*/});
                // make it happen
                var cube = new THREE.Mesh(geometry, material);
                // set position (since cubes are 16 units^3, need to times position by 16)
                cube.position.set(pos.x * 16, pos.y * 16, pos.z * 16);
                // show it
                scene.add(cube);
            }

        })
    }
</script>


</body>
</html>