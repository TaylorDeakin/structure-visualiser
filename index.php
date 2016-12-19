<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<h1>Structure Visualiser</h1>
<p>Upload a file to start!</p>

<form action="/php/upload.php" enctype="multipart/form-data" method="post">
    <label for="file"></label>
    <input id="file" name="file" type="file">
    <button type="submit">Go!</button>
</form>
</body>
</html>