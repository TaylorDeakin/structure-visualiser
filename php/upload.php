<?php

require("nbt.class.php");
require("idToDataValues.php");

$blockNameToId = array_flip(array_column(array_map('str_getcsv', file('../res/blocks.csv')), 2));

$target = "../uploads/";
$file = $target . basename($_FILES["file"]["name"]);
$success = true;

if (move_uploaded_file($_FILES["file"]["tmp_name"], $file)) {
    $nbt = new NBT();
    $nbt->loadFile($file);

    // get the data from the file
    $blocks = $nbt->root[0]['value'][0]['value']['value'];
    $palette = $nbt->root[0]['value'][1]['value']['value'];
    $size = $nbt->root[0]['value'][2]['value']['value'];
    $author = $nbt->root[0]['value'][3]['value'];
    $version = $nbt->root[0]['value'][4]['value'];

    $formatted_blocks = [];
    // loop through the blocks and format them nicely
    foreach ($blocks as $block) {
        $new_block = decodeBlock($block);
        $formatted_blocks[] = $new_block;
    }

    $formatted_palette = [];

    // loop through palette items
    foreach ($palette as $paletteItem) {
        $choice = decodePalette($paletteItem);
        $formatted_palette[] = $choice;

    }

    $result = [
        "blocks" => $formatted_blocks,
        "palette" => $formatted_palette,
        "size" => $size,
        "author" => $author,
        "version" => $version
    ];

    $result_json = json_encode($result);

    echo $result_json;

} else {
    var_dump("error");
}

function decodeBlock($block)
{
    $new_block = [
        "pos" => [
            "x" => $block[0]['value']['value'][0],
            "y" => $block[0]['value']['value'][1],
            "z" => $block[0]['value']['value'][2]
        ],
        "state" => $block[1]['value']
    ];

    return $new_block;
}


function decodePalette($paletteItem)
{

    global $blockNameToId;

    if (count($paletteItem) == 2) {
        $new_item = [
            "properties" => [],
            "name" => $paletteItem[1]['value']

        ];

        foreach ($paletteItem[0]['value'] as $property) {
            $new_item["properties"][] = $property["name"] . ":" . $property["value"];
        }

        $new_item["textureFile"] = constructTextureName($new_item);

    } else {
        $new_item = [
            "name" => $paletteItem[0]['value'],
            "textureFile" => explode(":", $paletteItem[0]['value'])[1],
        ];
    }

    $new_item["id"] = $blockNameToId[$new_item["name"]];
    if (isset($new_item["properties"])) {
        $new_item["dataValue"] = getDataValues($new_item["id"], $new_item["properties"]);
    }

    return $new_item;
}

function constructTextureName($palette_item)
{
    global $blockToTextureName;
    $textureName = $palette_item["name"];
    $properties = $palette_item["properties"];
    if (isset($properties["color"])) {
        return $textureName .= "_" . "colored" . "_" . $properties["color"];
    }

    if (isset($blockToTextureName[$textureName])) {
        return $blockToTextureName[$textureName];
    }


    return $textureName;
}


function getDataValues($blockId, $properties)
{
    global $blockIdToDataValues;

    if (isset($blockIdToDataValues[$blockId])) {
        $variants = $blockIdToDataValues[$blockId];
        foreach ($variants as $key => $variant) {
            foreach ($properties as $property) {
                if ($variant[0] === $property) {
                    $match = true;
                } else {
                    $match = false;
                }
                if ($match) {
                    return $key;
                }
            }
        }
    }
}
