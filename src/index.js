import React from 'react';
import ReactDOM, { render } from 'react-dom';
import './index.css';

class Canvas extends React.Component {  
    constructor(props) {
        super(props);
        this.state = {
          value: null,
        };
      }
    
    componentDidMount() { 
        const context = this.refs.canvas.getContext('2d');
        // #var context = canvas.getContext('2d');
        console.log(this.props.value);
        if(this.props.value != null){ 
            context.drawImage(this.props.value, 0, 0, 1280, 720);
        }
    }
    
    render() { 
        return(
            <canvas ref="canvas" video></canvas>
        )
    }
}

class Camera extends React.Component { 
    gotDevices(mediaDevices) {
        document.getElementById("select").innerHTML = '';
        document.getElementById("select").appendChild(document.createElement('option'));
        let count = 1;
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = mediaDevice.deviceId;
                const label = mediaDevice.label || `Camera ${count++}`;
                const textNode = document.createTextNode(label);
                option.appendChild(textNode);
                document.getElementById("select").appendChild(option);
            }
        });
    }

    getCamera() { 
        const videoConstraints = {};
        var video = document.getElementById('video'), vendorUrl = window.URL || window.webkitURL;
        const canvas = document.getElementById('canvas');
        canvas.height = 720; 
        canvas.width = 1280; 
        var context = canvas.getContext('2d');

        video.addEventListener('canplay', function () {
            // Set the canvas the same width and height of the video  
            video.play();    
        });

        if (document.getElementById("select") === '') { 
            videoConstraints.facingMode = 'environment';
        }
        else {
            videoConstraints.deviceId = document.getElementById("select").value ;
      
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

        })

        video.addEventListener('play', function(){
            draw(this,context,1280,720);
        },false);
    
        function draw(v,c,w,h) {
            if(v.paused || v.ended) return false;
            c.drawImage(v,0,0,w,h);
            setTimeout(draw,20,v,c,w,h);
    }       
    }
    
    render() { 
        return (
            navigator.mediaDevices.enumerateDevices().then(this.gotDevices),
            <div className="app">
            <div className="controls">
                <button onClick={() => this.getCamera()} id="button">Get camera</button>
                <select id="select">
                    <option></option>
                    </select>
            </div>
            <video id = "video"></video>
            <canvas id = "canvas"></canvas>
            </div>
        )
    }
}

class App extends React.Component { 
    render() { 
        return  (
        <div className="app">
            <div className="getCamera">
                <Camera />
            </div>
        </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);