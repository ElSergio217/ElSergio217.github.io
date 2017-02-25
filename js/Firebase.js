var xmlhttp = new XMLHttpRequest();
var url = "https://pickup-d2d07.firebaseio.com/.json";
var id;

xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		var myArr = JSON.parse(xmlhttp.responseText);
		id=myArr.length;
	}
};
xmlhttp.open("GET", url, true);
xmlhttp.send();

var config = {
	apiKey: "AIzaSyCFoKW2DfzmgIwtHp2orM7NTdq7flRi8z8",
	authDomain: "pickup-d2d07.firebaseapp.com",
	databaseURL: "https://pickup-d2d07.firebaseio.com",
	storageBucket: "pickup-d2d07.appspot.com",
};
firebase.initializeApp(config);



function toggleSignIn() {
	if (!firebase.auth().currentUser) {
		var provider = new firebase.auth.GoogleAuthProvider();
		provider.addScope('https://www.googleapis.com/auth/plus.login');
		firebase.auth().signInWithRedirect(provider);
	}else{
		firebase.auth().signOut();
	}
}
var name;
var imgURL;
function initApp() {
	firebase.auth().getRedirectResult().then(function(result) {
		var user = result.user;
	});
	$('#loading').modal({show:true,backdrop:'static'});
setTimeout(function(){
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			var displayName = user.displayName;
			var email = user.email;
			var photoURL = user.photoURL;
			console.log(displayName + "Signed in as" + email);
			$("#login").modal({show:false});
			if(photoURL==null){
				photoURL="https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=64";
			}
			console.log(photoURL);
			getName(user.displayName,email,photoURL);
		}else{
			console.log("not singed in");
			$("#login").modal({show:true, backdrop: 'static'});
		}
	});
	   }, 5000);
}

function getName(curName,curEmail,img){
	name=curName;
	mail=curEmail;
	gapi.user=curEmail;
	imgURL=img;
	userName=name;
	imgr=img;
}

window.onload = function() {
	initApp();
}

function newEvent() {
	var messageListRef = new Firebase('https://pickup-d2d07.firebaseio.com/');
	navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };	
	messageListRef.push({"Loby": document.getElementById("newLoby").value,
						"Event": document.getElementById("newType").value,
						"Sub": document.getElementById("newSub").value,
						"Host": name,
						"mail":mail,
						"img":imgURL,
						"lat": pos.lat, 
						"lng": pos.lng});
	});
}