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
var route_data;
var socket;



/*Anular app for updating dashbord Realtime*/

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


/* Custom Map Style*/

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
    	//	console.log(data);
   	 		updatevehicle(data);

   	 		/*Check data recived is from selected Vehicle*/
   		 	if(data.trip_id==vehicle_id)
   		 	{
		  		angular.element("#hideclick").scope().updateFn(data.det);
		  		
		  		/*Follow Vehicle if Follow button is on*/
		  		if(follow_vehicle==1)
		  				follow(data.position);

   		 	}
 
    });

    createmap();
    /*Load dashbord div on Right Top of the Map*/
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('hideclick'));
    document.getElementById("hideclick").style.display="none"; 

}


/*Create Google Map*/
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
			scaleControl: false,
			styles:map_style
		};

	map = new google.maps.Map(map_canvas, myOptions);
	infowindow = new google.maps.InfoWindow({
             content: 'holding...'
        });	

}

/*Function to update vechicle status and marker realtime*/
function updatevehicle(data)
{
	var point = new google.maps.LatLng(data.position.lat, data.position.lng);
	uid = data.trip_id;

	/*If uid not present in marker array Create new Vehicle else update the corresponding vehicle*/
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

/*Function for creating a new vehicle*/
function createvehicle(data,point)
{

	var image = 'bus.png'
	var	newmarker = new google.maps.Marker({
			position : point,
			map : map,
			id : uid,
			icon : image
		});

	/*Title Shows while mousehover to the vechile */
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
  	

   	   var polyOptions = 
   	   {
		   strokeColor: '#c0392b',
		   strokeOpacity: 1,
		   strokeWeight: 4 ,
		    zIndex: 2100 
		};	
	  poly = new google.maps.Polyline(polyOptions);
 	  poly.setMap(map);
 		
 	 route_data=load_route(data.det.trip_id);
 	
 	  var polyline2 = new google.maps.Polyline
 	  ({
		            path: [],
		            strokeColor: '#2ecc71',
		            strokeWeight: 4,
		             strokeOpacity: 1,
		              zIndex: 100 
		          });
		    
		     for(var i in route_data.routes)
		     {
		       var cord = new google.maps.LatLng(route_data.routes[i].shape_pt_lat,route_data.routes[i].shape_pt_lng);
		       polyline2.getPath().push(cord);
	    	  }

 	return {
		uid : uid,
		marker : newmarker,
		contentinfo : data.emp,
		headingTo : uid,
		polyline:poly,
		route : polyline2


	}

}


function load_route(vech_id)
{
	console.log(vech_id);
  $.ajax({
      type: 'POST',
      url: 'http://192.168.2.10:1333/route/findbyid',
      data: {"trip_id":vech_id},
      async: false,
      dataType: 'json',
      success: function(data)
      { 
      			route_data=data;    			
      },
      error: function()
       {
       		console.log("route load error");
       		route_data=-1; 
       }
    });
  return route_data;
    
}

function close_details()
{
	  follow_vehicle=0;
	  document.getElementById("hideclick").style.display="none"; 
	  document.getElementById("follow_btn").value="Follow";
	  document.getElementById("show_btn").value="Show Route";
	  vehicles[vehicle_id].route.setMap(null);
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
			if(map.getZoom() < 15)
	 	       map.setZoom(15);
		}
}

function route_toggle()
{
	if(document.getElementById("show_btn").value==="Show Route")
	{
		document.getElementById("show_btn").value="Hide Route";
		vehicles[vehicle_id].route.setMap(map);
	}
	else
	{
		document.getElementById("show_btn").value="Show Route";
		vehicles[vehicle_id].route.setMap(null);
	}
}
