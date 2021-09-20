
<script>
import {client_id, client_secret, redirect_uri} from '../../secrets.js'

var scopes = 'user-read-private user-read-email user-library-read';
var url = 'https://accounts.spotify.com/authorize' +
  '?response_type=token' +
  '&client_id=' + client_id +
  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
  '&redirect_uri=' + encodeURIComponent(redirect_uri) + '&state=123';
// function handleClick(){
//     location.href = 'https://accounts.spotify.com/authorize' +
//   '?response_type=code' +
//   '&client_id=' + client_id +
//   (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
//   '&redirect_uri=' + encodeURIComponent(redirect_uri);
// }

</script>
<body>
<div class="container">
<h1 class="text">Welcome to the Soundsthetic Generator</h1>
<img src="../../resourcess/sounsthetic.png" alt="soundsthetic logo" class="logo">
<br><br><br>
<a class="glow-on-hover button" href={url}>Log in with Spotify</a>
</div>
</body>
<style>

    
.logo{
    left: 35%;
    position: relative; 
    top:55%;
    max-width: 33%;
    height: auto;
}
.container {

}
.text{
    
  color: white;
  -webkit-text-stroke: 2px black;
  font-family: monospace;
  
  text-align: center;
  font-size: 17 px;

}
.glow-on-hover {
    
    text-decoration: none;
    padding: 20px;
    font-family: monospace;
    width: 220px;
    height: 50px;
    
    color: white;
    background: green;
    cursor: pointer;
    position: relative;
    z-index: 0;
    border-radius: 10px;
    left: 29%;
    
}

.glow-on-hover:before {
    content: '';
    background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
    position: absolute;
    top: -2px;
    left:-2px;
    background-size: 400%;
    z-index: -1;
    filter: blur(5px);
    width: calc(100% + 4px);
    height: calc(100% + 4px);
    animation: glowing 20s linear infinite;
    opacity: 0;
    transition: opacity .3s ease-in-out;
    border-radius: 10px;
}

.glow-on-hover:active {
    color: #000
}

.glow-on-hover:active:after {
    background: transparent;
}

.glow-on-hover:hover:before {
    opacity: 1;
}

.glow-on-hover:after {
    z-index: -1;
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: #111;
    left: 0;
    top: 0;
    border-radius: 10px;
}

@keyframes glowing {
    0% { background-position: 0 0; }
    50% { background-position: 400% 0; }
    100% { background-position: 0 0; }
}
</style>