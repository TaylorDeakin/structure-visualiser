<?php

require("nbt.class.php");

$target = "../uploads/";
$file = $target . basename($_FILES["file"]["name"]);
$success = true;

if (move_uploaded_file($_FILES["file"]["tmp_name"], $file)) {
    $nbt = new NBT();
    $nbt->loadFile($file);
    var_dump($nbt->root[0]);
} else {
    // error
}


