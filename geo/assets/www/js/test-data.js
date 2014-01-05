/*
 The MIT License (MIT)
 Copyright (c) 2014 David Winterbourne, Winterbourne Enterprises, LLC, dba Kaidad

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

var TEST_DATA = [
    {   "id": 100,
        "title": "dinosaur-ridge-I70",
        "description": "From Dinosaur Ridge to I-70 to Golden",
        "type": "FeatureCollection",
        "features": [
            {   "id": 135,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.222373, 39.750394]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Berthoud Hall - Colorado School of Mines",
                    "narration": "audio/berthoud_hall.mp3",
                    "autoplay": true,
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 135, "alt": "berthoud", "url": "text/berthoud.html", "mimeType": "text/html" },
                        { "id": 136, "description": "Berthoud Hall", "alt": "berthoud", "url": "images/berthoud_hall.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 136,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.217019, 39.755256]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Coors Brewery",
                    "narration": "audio/coors_brewery.mp3",
                    "autoplay": true,
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 137, "alt": "coors", "url": "text/coors.html", "mimeType": "text/html" },
                        { "id": 138, "alt": "coors", "url": "images/coors.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 137,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.223693, 39.745448]},
                "properties": {
                    "isStart": false,
                    "showMarker": false,
                    "narration": "audio/intro_to_kaidad.mp3",
                    "autoplay": true
                }
            },
            {   "id": 127,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.201838, 39.702026]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "I-70 Road Cut",
                    "description": "I-70 road cut reveals stunning cross-section through Jurassic-Cretaceous strata.",
                    "narration": "audio/i70_roadcut.mp3",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 128, "title": "South side of I-70", "description": "The geologically famous I-70 road cut through the Dakota Hogback west of Denver beautifully exposes (from left to right) ever older, east-dipping South Platte, Lytle, Morrison and Ralston Creek strata in this shot of the south side. The same Mesozoic strata arch discontinuously across the Rockies to the opposing west-dipping Grand Hogback at Newcastle, 155 miles to the west.", "alt": "south side I-70", "url": "images/dak01.jpg", "mimeType": "image/jpg" },
                        { "id": 129, "description": "The buff and black Dakota strata shown on the far left are easily recognized throughout Colorado. Gray, green and maroon claystones of the equally recognizable Late Jurassic Morrison Formation stand to the right of the Lytle-Morrison contact seen in the image below.", "alt": "I-70 - img 2", "url": "images/dak02.jpg", "mimeType": "image/jpg" },
                        { "id": 130, "description": "Informative plaques along the footpath along the other (north) side of the road cut recount some of the stories the rocks have to tell. Access both sides of the road cut via Alameda Parkway (CO26) or the Morrison Exit, I-70 #269.", "alt": "I-70 - img 3", "url": "images/dak03.jpg", "mimeType": "image/jpg" },
                        { "id": 131, "description": "Geologic map of the Front Range, showing area of I-70 road cut.", "alt": "geo map", "url": "images/dakota_geomap.jpg", "mimeType": "image/jpg" },
                        { "id": 132, "description": "Stratigraphic cross-section of the I-70 road cut.", "alt": "strat xsec", "url": "images/dakota_xsect.jpg", "mimeType": "image/jpg" },
                        { "id": 133, "description": "Side-by-side satellite imagery and geologic map of the front range", "alt": "sat/geo", "url": "images/FrontRangeMapTwoplex.jpeg", "mimeType": "image/jpg" },
                        { "id": 134, "description": "Satellite image of the I-70 road cut", "alt": "sat", "url": "images/i70_sat1.png", "mimeType": "image/png" }
                    ]
                }
            },
            {   "id": 102,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.190594, 39.688723]},
                "properties": {
                    "isStart": true,
                    "showMarker": true,
                    "title": "Visitors Center",
                    "description": "Dinosaur Ridge Visitors Center",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "narration": "audio/dino_ridge_intro.mp3",
                    "autoplay": true,
                    "mediaItems": [
                        { "id": 103, "alt": "intro", "url": "text/intro.html", "mimeType": "text/html" }
                    ]
                }
            },
            {   "id": 105,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.192399, 39.681499]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Ripples in the Dakota Group",
                    "description": "Fossilized ripples in Dakota Group mudstone",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 106, "alt": "ripples", "url": "text/ripples.html", "mimeType": "text/html" },
                        { "id": 107, "description": "Fossilized ripples in Dakota Group mudstone", "alt": "ripples", "url": "images/dinoridge1.jpg", "mimeType": "image/jpg" },
                        { "id": 108, "description": "Closeup of fossilized ripples in Dakota Group mudstone", "alt": "ripples_close", "url": "images/dinoridge2.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 109,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.192366, 39.681428]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Crocodilian Trackmarks",
                    "description": "Large ancestors of today's crocodiles (or swimming dinosaurs, according to recent research) may have left these deep slashmarks in the muddy shallow seafloor.",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 110, "alt": "croc_marks", "url": "images/dinoridge3.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 111,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.192360, 39.681409]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Burrows and Trackmarks",
                    "description": "Worms, shellfish and other sea life left these obscure trails and signs on the Cretaceous seafloor preserved in the Dakota Group mudstones at Dinosaur Ridge.",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 112, "alt": "burrows_tracks", "url": "images/dinoridge4.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 113,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.192364, 39.681359]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Dinosaur Tracks",
                    "description": "Numerous dinosaur tracks are visible along Dinosaur Ridge.",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 114, "title": "Dinosaur Tracks", "description": "Tracks of large theropod dinosaurs are colored in for visibility at Dinosaur Ridge. Fossil thieves cut out the hole at bottom left. (One print was returned.)", "alt": "dino_tracks", "url": "images/dinoridge5.jpg", "mimeType": "image/jpg" },
                        { "id": 115, "title": "Dinosaur Trackway", "description": "A variety of dinosaurs left tracks in the mud here 100 million years ago. Remember, it was level ground then. The rocks have since been tilted eastward.", "alt": "dino_tracks", "url": "images/dinoridge6.jpg", "mimeType": "image/jpg" },
                        { "id": 116, "title": "Dinosaur Freeway", "description": "Widespread evidence shows that dinosaurs thrived in the wetlands along the edge of the Cretaceous Interior Seaway. They were not just migrating through here.", "alt": "dino_tracks", "url": "images/dinoridge7.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 117,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.192701, 39.675810]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Morrison Formation",
                    "description": "The 150-million-year-old Morrison Formation crops out on the west side of Dinosaur Ridge. It was first formally described here, its type locality. To geologists, the Morrison Formation says &quot;dinosaurs.&quot; A great surge of dinosaur discovery took place during the late 1800s as fossil hunters explored the Morrison everywhere it crops out—in Wyoming, Montana, Colorado, Utah and beyond. The original specimen of Apatosaurus came from here. The first Stegosaurus was found here (and is now Colorado's state fossil). It consists of mudstones, limestone and sandstone that accumulated near the edge of the vast inland sea that used to cover the Midwest during Mesozoic time.",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 118, "title": "Morrison Formation", "description": "Morrison Formation", "alt": "morrison", "url": "images/dinoridge8.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 119,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.193149, 39.676153]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Apatosaurus Footprint",
                    "description": "Apatosaurus, including the popular but scientifically redundant synonym Brontosaurus, is a genus of sauropod dinosaur that lived from about 154 to 150 million years ago, during the Jurassic Period.",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 120, "title": "Apatosaurus Footprint", "description": "While the sand was still soft here, a large dinosaur left its deep footprints, which are exposed today in cross section on the west side of Dinosaur Ridge.", "alt": "apaprint", "url": "images/dinoridge9.jpg", "mimeType": "image/jpg" },
                        { "id": 121, "title": "Apatosaurus Footprint", "description": "The bulge at left is the underside of a dinosaur footprint like the one seen in cross-section at right. Apatosaurus or Stegosaurus probably made these.", "alt": "apaprint", "url": "images/dinoridgea.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            {   "id": 122,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-105.193267, 39.676368]},
                "properties": {
                    "isStart": false,
                    "showMarker": true,
                    "title": "Dinosaur Bone",
                    "description": "Dinosaur bones can be observed in their original matrix rock.",
                    "detailMapDatabase": "denver-boulder-1.mbtiles",
                    "mediaItems": [
                        { "id": 123, "title": "Dinosaur Bone", "description": "This fossil dinosaur bone is about fist-sized at its left end. Dark minerals contain uranium attracted here over the ages by the bone's geochemical environment.", "alt": "dinobone", "url": "images/dinoridgeb.jpg", "mimeType": "image/jpg" },
                        { "id": 124, "title": "Dinosaur Bone Closeup", "description": "The fossil bone occupies most of this photo. A geiger counter chattered loudly near it—commercial uranium has been mined from the Morrison Formation.", "alt": "dinobone", "url": "images/dinoridgec.jpg", "mimeType": "image/jpg" }
                    ]
                }
            },
            { "id": 125,
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-105.6389, 39.401],
                            [-105.6389, 40.2595],
                            [-104.4304, 40.2595],
                            [-104.4304, 39.401]
                        ]
                    ]
                },
                "properties": {
                    "database": "denver-boulder-1.mbtiles",
                    "minZoomDisplay": 0,
                    "maxZoomDisplay": 7
                }
            },
            { "id": 126,
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-105.3018, 39.6402],
                            [-105.3018, 39.7981],
                            [-105.1359, 39.7981],
                            [-105.1359, 39.6402]
                        ]
                    ]
                },
                "properties": {
                    "database": "denver-boulder-1.mbtiles",
                    "minZoomDisplay": 10,
                    "maxZoomDisplay": 13
                }
            }
        ]
    },
    {
        "id": 200,
        "title": "durango-ouray",
        "description": "Durango to Ouray over Million Dollar Highway",
        "type": "FeatureCollection",
        "features": [
            {   "id": 201,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-107.885399, 37.269041]},
                "properties": {
                    "isStart": true,
                    "showMarker": true,
                    "title": "starting point",
                    "description": "starting point"
                }
            }
        ]
    },
    {
        "id": 300,
        "title": "arches-moab",
        "description": "arches-moab",
        "type": "FeatureCollection",
        "features": [
            {   "id": 301,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-109.804230, 38.931272]},
                "properties": {
                    "isStart": true,
                    "showMarker": true,
                    "title": "starting point",
                    "description": "starting point"
                }
            }
        ]
    },
    {
        "id": 400,
        "title": "canyonlands-hwy313",
        "description": "Canyonlands along Hwy 313",
        "type": "FeatureCollection",
        "features": [
            {   "id": 401,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-109.685783, 38.669336]},
                "properties": {
                    "isStart": true,
                    "showMarker": true,
                    "title": "starting point",
                    "description": "starting point"
                }
            }
        ]
    },
    {
        "id": 500,
        "title": "hwy276-halls-crossing",
        "description": "Hwy 276 across Hall's Crossing",
        "type": "FeatureCollection",
        "features": [
            {   "id": 501,
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-110.569496, 38.023120]},
                "properties": {
                    "isStart": true,
                    "showMarker": true,
                    "title": "starting point",
                    "description": "starting point"
                }
            }
        ]
    }
];

var TEST_DATA_META = [];

TEST_DATA.forEach(function (elem) {
    TEST_DATA_META.push( { id: elem.id, title: elem.title, description: elem.description, loaded: false });
});

var TEST_DATA_BUNDLE_IDS = [100,200,300,400,500];

//expose for testing through mocha/node
if (typeof exports !== 'undefined') {
    exports.TEST_DATA = TEST_DATA;
    exports.TEST_DATA_META = TEST_DATA_META;
    exports.TEST_DATA_BUNDLE_IDS = TEST_DATA_BUNDLE_IDS;
}
