var video = document.getElementById('video'), vendorUrl = window.URL || window.webkitURL;
const videoConstraints = {};
const button = document.getElementById('button');
const snap = document.getElementById('Snap');
const whiteBalance = document.getElementById('WhiteBalance');
const recordButton = document.getElementById('recordButton');

const wbb = document.getElementById('WhiteBalanceBool');
const fpsPrint = document.getElementById('Frame Rate: ');


var zoom = 1;
var imageCapture;
var canvas = document.getElementById('Canvas');
var context = canvas.getContext('2d');
var applyeffect = false;
var recorder = true; 
var in1 = 0;
var in2 = 0;
var in3 = 0;
var counter = 0; 
var truLabel = false;
var val = 0; 
var constant = 200;
var lastCalledTime;
var fps;
var calculated = []


const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

const stream = canvas.captureStream();
recordButton.addEventListener('click' , event => {
	
	if(recorder == true){ 
		startRecording();
		recorder = false;
		console.log(recorder);
	}
	else{ 
		stopRecording();
		recorder = true;
		recordButton.textContent = 'Start Recording';
	}
	
});
function handleSourceOpen(event) {
	console.log('MediaSource opened');
	sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="h264"');
	console.log('Source buffer: ', sourceBuffer);
  }
  
function handleDataAvailable(event) {
	if (event.data && event.data.size > 0) {
	  recordedBlobs.push(event.data);
	}
  }
  
function handleStop(event) {
	console.log('Recorder stopped: ', event);
	const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
	video.src = window.URL.createObjectURL(superBuffer);
  }

function startRecording() {
	let options = {mimeType: 'video/webm'};
	recordedBlobs = [];
	try {
	  mediaRecorder = new MediaRecorder(stream, options);
	} catch (e0) {
	  console.log('Unable to create MediaRecorder with options Object: ', e0);
	  try {
		options = {mimeType: 'video/webm,codecs=vp9'};
		mediaRecorder = new MediaRecorder(stream, options);
	  } catch (e1) {
		console.log('Unable to create MediaRecorder with options Object: ', e1);
		try {
		  options = 'video/vp8'; // Chrome 47
		  mediaRecorder = new MediaRecorder(stream, options);
		} catch (e2) {
		  alert('MediaRecorder is not supported by this browser.\n\n' +
			'Try Firefox 29 or later, or Chrome 47 or later, ' +
			'with Enable experimental Web Platform features enabled from chrome://flags.');
		  console.error('Exception while creating MediaRecorder:', e2);
		  return;
		}
	  }
	}
	console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(100); // collect 100ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
	mediaRecorder.stop();
	console.log('Recorded Blobs: ', recordedBlobs);
	video.controls = true;
	download();
 
  }

function gotDevices(mediaDevices) {
	select.innerHTML = '';
	select.appendChild(document.createElement('option'));
	let count = 1;
	mediaDevices.forEach(mediaDevice => {
		if (mediaDevice.kind === 'videoinput') {
			const option = document.createElement('option');
			option.value = mediaDevice.deviceId;
			const label = mediaDevice.label || `Camera ${count++}`;
			const textNode = document.createTextNode(label);
			option.appendChild(textNode);
			select.appendChild(option);
		}
	});
}

function download() {
	const blob = new Blob(recordedBlobs, {type: 'video/webm'});
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = 'test.webm';
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
	  document.body.removeChild(a);
	  window.URL.revokeObjectURL(url);
	}, 100);
  }

navigator.mediaDevices.enumerateDevices().then(gotDevices);

button.addEventListener('click', event => {
	if (typeof currentStream !== 'undefined') {
		stopMediaTracks(currentStream);
	}
	if (select.value === '') {
		videoConstraints.facingMode = 'environment';
	}
	else {
	  videoConstraints.deviceId = select.value ;

	}
	const constraints = {
		video: videoConstraints,
		audio: false,
		
	};
	navigator.mediaDevices.getUserMedia(constraints)
	.then(mediaStream => { 
		video.srcObject = mediaStream;
		const mediaStreamTrack = mediaStream.getVideoTracks()[0];
		mediaStreamTrack.applyConstraints({
			width: 1280,
			height: 720, 
			whiteBalance: false
		  });
		imageCapture = new ImageCapture(mediaStreamTrack);
		drawFrame(video);

	})
	.catch(error => console.error('getUserMedia() error:' , error));
});

video.addEventListener('canplay', function () {
    // Set the canvas the same width and height of the video
    canvas.width = 1280;
    canvas.height = 720;    
    video.play();

    // start drawing the frames  
    drawFrame(video);
});

function drawFrame(video) {
	/*Grabs frame from the video*/
	context.drawImage(video, 0, 0, canvas.width, canvas.height);

	/*Checks if white balance been turned on. If turned on, for first 
	time, the filter is calculated and then the weights are applied
	and everytime frame grab after that it doesn't calculate the 
	weight, it just applies the filter*/
	if(applyeffect){ 
		var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		whiteBalanceFunc(imageData.data);
		context.putImageData(imageData, 0, 0);
	}
	
	if(!applyeffect && in1 != 0){ 
		console.log('This hit only once')
		console.log(calculated)
		in1 = 0
	}

	/*This part calculates the time elapsed between this point at the previous 
	call and the current call*/
	if(!lastCalledTime) {
		lastCalledTime = performance.now();
		fps = 0;
		return;
	}
	 
	delta = (performance.now() - lastCalledTime)/1000;
	lastCalledTime = performance.now();
	fps = 1/delta;
	
	calculated.push(delta)
	console.log(calculated.length)
	if (calculated.length%25 == 0){ 
		var sum = 0;
		for( var i = 0; i < calculated.length; i++ ){
    		sum += calculated[i]; //don't forget to add the base
		}

		var avg = sum/calculated.length;
		console.log(" The average is: " + avg );
		fpsPrint.innerHTML = (1/avg) + 'fps'; 
		calculated = [];
	} 

	setTimeout(function () {
		drawFrame(video);
	}, 1000);
}

function whiteBalanceFunc(data){ 
	if(applyeffect && truLabel){
		calculateElements(data);
	}		
	for (var i = 0; i < data.length; i+=4){
		data[i] = in1* data[i]; // Invert Red
		data[i+1] = in2 * data[i+1]; // Invert Green
		data[i+2] = in3 * data[i+2];; // Invert Blue
	}
		
}
function calculateElements(data){ 
	for (var i = 0; i < data.length; i+= 4) {
		counter+=1; 
		in1 += data[i]; //Sum Red Values
		in2 += data[i+1]; //Sum Green Values
		in3 += data[i+2]; //Sum Blue Values
		truLabel = false;
			
	}
	varTemp = ((in1/counter) + (in2/counter) + (in3/counter))/3;
	if (varTemp > 170){ 
		constant = 200; 
	}
	else{ 
		constant = 128; 
	}
	in1 = (constant/(in1/counter)); //Calc Average Red value and weight
	in2 = (constant/(in2/counter)); //Calc Average Green value and weight
	in3 = (constant/(in3/counter)); //Calc Average Blue value and weight


	// averageRed = in1/counter;
	// averageGreen = in2/counter;
	// averageBlue = in3/counter;

	// redDif = 128 - averageRed;
	// greenDif = 128 - averageGreen;
	// blueDif = 128 - averageBlue;

	// in1 = (200/averageRed); //Calc Average Red value and weight
	// in2 = (200/averageGreen); //Calc Average Green value and weight
	// in3 = (200/averageBlue); //Calc Average Blue value and weight
	
	
	console.log('Reset')
	calculated = []
	console.log(calculated)

	lastCalledTime = performance.now()
}

snap.addEventListener('click', event =>{
	console.log(canvas.width); 
	console.log(canvas.height);
	var image = canvas.toDataURL('image/png')
	snap.download = "imagecapture " + String(val) + ".png";
	val+=1; 
	snap.href=image; // it will save locally

});

whiteBalance.addEventListener('click', function() {
	applyeffect = !applyeffect;
	if(!applyeffect){ 
		truLabel = false;
		in1 = 0; 
		in2 = 0; 
		in3 = 0; 
		counter = 0; 
		wbb.innerHTML = 'OFF';

	}
	else{ 
		truLabel = true;
		wbb.innerHTML = 'ON';
	}
});