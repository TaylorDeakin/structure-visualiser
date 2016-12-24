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
<script src="js/app.js"></script>


</body>
</html>