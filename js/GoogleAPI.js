var map;
var xmlhttp = new XMLHttpRequest();
var url = "https://dl.dropboxusercontent.com/s/p5rmnwojc0h3j5k/rows.json";

xmlhttp.open("GET", url, true);
xmlhttp.send();

setTimeout(function(){
       processRequest();
    }, 2000);

function refresh(){
	location.reload();
}

function processRequest(e) {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		var myArr = JSON.parse(xmlhttp.responseText);
		initMap(myArr);
	}
}

function initMap(arr) {
	console.log(xmlhttp.readyState);
  var styles = [
    {
        "featureType": "all",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "weight": "2.00"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#9c9c9c"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#f2f2f2"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "saturation": -100
            },
            {
                "lightness": 45
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#eeeeee"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#7b7b7b"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#46bcec"
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#c8d7d4"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#070707"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    }
];

  navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
		map.setCenter(pos);
		var marker = new google.maps.Marker({
			position: pos,
			map: map,
			icon:'https://www.robotwoods.com/dev/misc/bluecircle.png',
			optimized: false,
      		zIndex:99999999
		});
		
    });
  
  var styledMap = new google.maps.StyledMapType(styles,
    {name: "Styled Map"});
	
	map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
		disableDefaultUI: true
    });

	map.mapTypes.set('map_style', styledMap);
	map.setMapTypeId('map_style');
	Category_list = []
	for (var x in arr) {
		var lat=parseFloat(arr[x].Latitude);
		var lng=parseFloat(arr[x].Longitude);
		var Location = new google.maps.LatLng(lat, lng);
        addMarker(map, Location, arr[x]["Business Name"], 
        						arr[x]["License Category"],
         						arr[x]["License Type"],
          						arr[x]["Contact Phone Number"] );
        if (Category_list.indexOf(arr[x]["License Category"]) == -1){
        	Category_list.push(arr[x]["License Category"]);
        }
    }
    for (var x in Category_list){
    	document.getElementById("list").innerHTML += '<li><a href="#" onclick="someFunction('+"'" + Category_list[x]+"'"+')">'+ Category_list[x] +'</a></li>';
    }
}
var marker_list = []
function addMarker(maps,location, name, cat, type, num) {
		var marker = new google.maps.Marker({
			position: location,
			map: map,
			icon:"img/icon.png",
			Category: cat,
			visible:true
		});
		
    google.maps.event.addListener(marker, 'click', function () {
		$("#event").modal('show');
		document.getElementById("name").innerHTML = name;	
		document.getElementById("cat").innerHTML = cat;	
		document.getElementById("type").innerHTML = type;	
		document.getElementById("num").innerHTML = num;	
    });
    marker_list.push(marker);
}

function someFunction(tag){
	if(tag == "all"){
		for(var x in marker_list){
			marker_list[x].setVisible(true);
		}
	}else{
		for(var x in marker_list){
			marker_list[x].setVisible(false);
			if(marker_list[x].Category == tag){
				marker_list[x].setVisible(true);
			}
		}
	}
}