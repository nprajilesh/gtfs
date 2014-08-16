var map;
var poly;
var path;
var infowindow;
var autocomplete;
var follow_vehicle=0;
var uid;
var markersarr = {};
var vehicles = {};
var vehicle_id= -1;
var socket;


var app = angular.module('details',['ui.bootstrap']);
app.controller('DetailsController',function($scope,$log)
{
   $scope.empList={};
   $scope.updateFn=function(data)
   {
     $scope.empList=data;
     $scope.$digest();
   };
 });

var map_style =[{"featureType":"landscape","stylers":[{"hue":"#F1FF00"},{"saturation":-27.4},{"lightness":9.4},{"gamma":1}]},{"featureType":"road.highway","stylers":[{"hue":"#0099FF"},{"saturation":-20},{"lightness":36.4},{"gamma":1}]},{"featureType":"road.arterial","stylers":[{"hue":"#00FF4F"},{"saturation":0},{"lightness":0},{"gamma":1}]},{"featureType":"road.local","stylers":[{"hue":"#FFB300"},{"saturation":-38},{"lightness":11.2},{"gamma":1}]},{"featureType":"water","stylers":[{"hue":"#00B6FF"},{"saturation":4.2},{"lightness":-63.4},{"gamma":1}]},{"featureType":"poi","stylers":[{"hue":"#9FFF00"},{"saturation":0},{"lightness":0},{"gamma":1}]}];
            geolocation_marker = new google.maps.Marker({
                icon: {
                    url: 'static/images/geolocation-bluedot.png',
                    size: new google.maps.Size(17, 17),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(8, 8)
                },
                map: null,
                position: new google.maps.LatLng(0, 0)
            });
function init()
{

	socket = io.connect('http://localhost:3000');
    socket.on('realtime', function (data) {
    		console.log(data);
   	 		updatevehicle(data);
   		 	if(data.trip_id==vehicle_id)
   		 	{
		  		angular.element("#hideclick").scope().updateFn(data.det);
		  		if(follow_vehicle==1)
		  				follow(data.position);

   		 	}
 
    });

    createmap();
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('hideclick'));
    document.getElementById("hideclick").style.display="none"; 

}



function createmap()
{

	map_canvas = document.getElementById("map_canvas");
	var myOptions = {
			center : new google.maps.LatLng(8.4875,76.9525),
			zoom : 12,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			streetViewControl: false,
			mapTypeControl: false,
			panControl: false,
			styles:map_style
		};
	map = new google.maps.Map(map_canvas, myOptions);
	infowindow = new google.maps.InfoWindow({
             content: 'holding...'
        });	

}

function updatevehicle(data)
{
	var point = new google.maps.LatLng(data.position.lat, data.position.lng);
	uid = data.trip_id;
	if(!(uid in markersarr))
		vehicles[uid] = createvehicle(data,point);
	else
	{
		vehicles[uid].contentinfo = data.emp;
		markersarr[uid].animateTo(point,{  
			easing : "linear",
			duration : 1000,
			complete : function(){

			}
		});
	}
	path = vehicles[uid].polyline.getPath();
	path.push(point);
}

function createvehicle(data,point)
{

	var image = 'bus.png'
	var	newmarker = new google.maps.Marker({
			position : point,
			map : map,
			id : uid,
			icon : image
		});

	newmarker.setTitle(data.det.trip_id);
	markersarr[uid]=newmarker;
  	google.maps.event.addListener(markersarr[uid], 'click', function() {
  	   	vehicle_id=this.id;
  		socket.emit('click',vehicle_id);
     	 document.getElementById('hideclick').style.display = "block";
     	
     	/*To stop following previous vechicle*/
     	 follow_vehicle=0;
		document.getElementById("follow_btn").value="Follow";
  	});
  	
  	var routelayer = new google.maps.KmlLayer({
		preserveViewport : true,
		map : map
	});

			var polyOptions = {
		    strokeColor: '#c0392b',
		    strokeOpacity: 1.0,
		    strokeWeight: 4 
			  };	
		  poly = new google.maps.Polyline(polyOptions);
 		  poly.setMap(map);

 	return {
		uid : uid,
		marker : newmarker,
		route : routelayer,
		contentinfo : data.emp,
		headingTo : uid,
		polyline:poly


	}

}


function close_details()
{
	  follow_vehicle=0;
	  document.getElementById("hideclick").style.display="none"; 
	  document.getElementById("follow_btn").value="Follow";
}



function follow(position)
{
	 map.setCenter(new google.maps.LatLng(position.lat,position.lng));
}

function follow_toggle()
{	
		if(document.getElementById("follow_btn").value==="stop")
		{
			follow_vehicle=0;
			document.getElementById("follow_btn").value="Follow";
		}
		else
		{
			follow_vehicle=1;
			document.getElementById("follow_btn").value="stop";
		}
}