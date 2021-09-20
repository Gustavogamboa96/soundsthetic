<script>
    import { page } from '$app/stores'
    import {client_id, client_secret, redirect_uri} from '../../secrets.js'
   
    // const access_token = $page.query.get('access_token')
    import {onMount} from 'svelte'
import { text } from 'svelte/internal';
    let access_token =null;
    let ret = null;
    let user = null;
    let albumArt, albumName, albumsdata, user_name;
    let albums = []

    function saveAlbumInfo(data, response){
        response = data;
       // return response;
    }

    onMount(async ()=>{
        var hash = window.location.hash.substring(1);
    var accessString = hash.indexOf("&");

    /* 13 because that bypasses 'access_token' string */
    access_token = hash.substring(13, accessString);


    const res = await fetch("https://api.spotify.com/v1/me/albums?limit=24&offset=5&market=US", {
    headers: {
    Accept: "application/json",
    Authorization: "Bearer " + access_token,
    "Content-Type": "application/json"
  }
    })
    const userdata = await fetch("https://api.spotify.com/v1/me", {
    headers: {
    Accept: "application/json",
    Authorization: "Bearer " + access_token,
    "Content-Type": "application/json"
  }
    })

    ret = await res.json();
    user = await userdata.json();
    user_name = user.display_name;
    
    
    albumName = ret.items[0].album.name;
   albumArt = ret.items[0].album.images[0].url;
   //saveAlbumInfo(ret, ret);
console.log("here it is: "+ret.items[0])
console.log(albumArt)

albumsdata = ret.items

for(let album of albumsdata){
    //console.log(album.album.images[0].url)
    albums.push({'url':album.album.images[0].url})
}
    albums = albums
console.log(albums)
   
    // console.log("Access Token: " + access_token);
})
   
  
   



</script>




<div id="photos" style="position: relative;">
{#each albums as {url}}
<img src={url} alt="arts">
{/each}

<div class="text">
    
    <h1>I'm {user_name} and this is my</h1>
    <h1 class="rainbow">Soundsthetic</h1>
    
</div>
<img src="../../assets/sounsthetic.png" alt="soundsthetic logo" class="logo">
</div>

<style>
.logo{

    left: 50%;
    position: absolute; 
    top:55%;
    max-width: 33%;
    height: auto;
    transform: translate(-50%, -50%);
}

.text{
    inline-size: auto;
    line-height: normal !important;
  color: white;
  -webkit-text-stroke: 2px black;
  
  font-family: monospace;
  position: absolute; 
  text-align: center;
  font-size: 17 px;
  top: 32%;
  left: 50%;
  transform: translate(-50%, -50%);
}
@import url(https://fonts.googleapis.com/css?family=Pacifico);
@import url('https://fonts.googleapis.com/css?family=Anton');


.rainbow {
  margin-top:0;
   /* Font options */
  font-family: monospace;
  text-shadow: 2px 2px 4px #000000;
  font-size:40px;
  
   /* Chrome, Safari, Opera */
  -webkit-animation: rainbow 5s infinite; 
  
  /* Internet Explorer */
  -ms-animation: rainbow 5s infinite;
  
  /* Standar Syntax */
  animation: rainbow 5s infinite; 
}

/* Chrome, Safari, Opera */
@-webkit-keyframes rainbow{
  0%{color: orange;}	
  10%{color: purple;}	
	20%{color: red;}
  30%{color: CadetBlue;}
	40%{color: yellow;}
  50%{color: coral;}
	60%{color: green;}
  70%{color: cyan;}
  80%{color: DeepPink;}
  90%{color: DodgerBlue;}
	100%{color: orange;}
}

/* Internet Explorer */
@-ms-keyframes rainbow{
   0%{color: orange;}	
  10%{color: purple;}	
	20%{color: red;}
  30%{color: CadetBlue;}
	40%{color: yellow;}
  50%{color: coral;}
	60%{color: green;}
  70%{color: cyan;}
  80%{color: DeepPink;}
  90%{color: DodgerBlue;}
	100%{color: orange;}
}

/* Standar Syntax */
@keyframes rainbow{
    0%{color: orange;}	
  10%{color: purple;}	
	20%{color: red;}
  30%{color: CadetBlue;}
	40%{color: yellow;}
  50%{color: coral;}
	60%{color: green;}
  70%{color: cyan;}
  80%{color: DeepPink;}
  90%{color: DodgerBlue;}
	100%{color: orange;}
}
#photos {
  /* Prevent vertical gaps */
  padding:0;
  margin-top: -2%;
  margin-right: -2%;
  margin-left: -2%;
  line-height: 0;
  -webkit-column-count: 4;
  -webkit-column-gap:   0px;
  -moz-column-count:    4;
  -moz-column-gap:      0px;
  column-count:         4;
  column-gap:           0px;  
}

#photos img {
  /* Just in case there are inline attributes */
  
  width: 100% !important;
  height: auto !important;
  
}
    
</style>