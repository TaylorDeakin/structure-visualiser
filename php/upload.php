<?php

require("nbt.class.php");
require("idToDataValues.php");
require("IdToTexture.php");
$csvArray = array_map('str_getcsv', file('../res/blocks.csv'));
$blockId = array_column($csvArray, 0);
$blockName = array_column($csvArray, 1);
$blockNameToId = array_combine($blockName, $blockId);

$target = "../uploads/";
$file = $target . basename($_FILES["file"]["name"]);
$success = true;

$slabs = [
    43,
    44,
    125,
    126,
    181,
    182,
    204,
    205
];
$stairs = [
    53,
    67,
    108,
    109,
    114,
    128,
    134,
    135,
    136,
    156,
    163,
    164,
    180,
    203
];

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
        if (isOfSpecifiedType($choice["id"], $stairs)) {
            $choice["isStair"] = true;
            $formatted_palette[] = $choice;
            continue;
        }

        if (isOfSpecifiedType($choice["id"], $slabs)) {
            $choice["isSlab"] = true;
            $formatted_palette[] = $choice;
            continue;
        }

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

    } else {
        $new_item = [
            "name" => $paletteItem[0]['value'],

        ];
    }

    $new_item["id"] = $blockNameToId[$new_item["name"]];
    if (isset($new_item["properties"])) {
        $new_item["dataValue"] = getDataValues($new_item["id"], $new_item["properties"]);
    }
    $new_item["textureFile"] = constructTextureName($new_item);
    return $new_item;
}

function constructTextureName($palette_item)
{
    global $blockIdToTexture;
    $id = $palette_item["id"];

    if (!isset($blockIdToTexture[$id])) {
        return null;
    }

    $result = $blockIdToTexture[$id];

    if (!is_array($result)) {
        return $result;
    }
    $dataValue = 0;
    if (isset($palette_item["dataValue"])) {
        $dataValue = $palette_item["dataValue"];
    }
    return $result[$dataValue];

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

function isOfSpecifiedType($blockId, $arrayToSearch)
{
    if (in_array($blockId, $arrayToSearch)) {
        return true;
    }

    return false;
}
