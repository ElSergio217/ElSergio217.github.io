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

function initApp() {
	firebase.auth().getRedirectResult().then(function(result) {
		var user = result.user;
	});

	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			var displayName = user.displayName;
			var email = user.email;
			var photoURL = user.photoURL;
			console.log(displayName + "Signed in as" + email);
			$("#login").modal({show: false, backdrop: "static"});
		}else{
			$("#login").modal({show: true, backdrop: "static"});
		}
	});
}

window.onload = function() {
	initApp();
}