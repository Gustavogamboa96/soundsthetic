import{S as s,i as t,s as a,e,c as o,J as l,b as n,f as i,d as c,k as r,t as h,a as u,n as m,g as p,K as f,H as g,h as d,I as v,L as y,A as b}from"../chunks/vendor-09e7e79c.js";function j(s,t,a){const e=s.slice();return e[8]=t[a].url,e}function w(s){let t,a;return{c(){t=e("img"),this.h()},l(s){t=o(s,"IMG",{src:!0,alt:!0,class:!0}),this.h()},h(){l(t.src,a=s[8])||n(t,"src",a),n(t,"alt","arts"),n(t,"class","svelte-cho086")},m(s,a){i(s,t,a)},p(s,e){2&e&&!l(t.src,a=s[8])&&n(t,"src",a)},d(s){s&&c(t)}}}function I(s){let t,a,b,I,A,x,E,S,k,H,z,B,C,D=s[1],G=[];for(let e=0;e<D.length;e+=1)G[e]=w(j(s,D,e));return{c(){t=e("div");for(let s=0;s<G.length;s+=1)G[s].c();a=r(),b=e("div"),I=e("h1"),A=h("I'm "),x=h(s[0]),E=h(" and this is my"),S=r(),k=e("h1"),H=h("Soundsthetic"),z=r(),B=e("img"),this.h()},l(e){t=o(e,"DIV",{id:!0,style:!0,class:!0});var l=u(t);for(let s=0;s<G.length;s+=1)G[s].l(l);a=m(l),b=o(l,"DIV",{class:!0});var n=u(b);I=o(n,"H1",{});var i=u(I);A=p(i,"I'm "),x=p(i,s[0]),E=p(i," and this is my"),i.forEach(c),S=m(n),k=o(n,"H1",{class:!0});var r=u(k);H=p(r,"Soundsthetic"),r.forEach(c),n.forEach(c),z=m(l),B=o(l,"IMG",{src:!0,alt:!0,class:!0}),l.forEach(c),this.h()},h(){n(k,"class","rainbow svelte-cho086"),n(b,"class","text svelte-cho086"),l(B.src,C="../../assets/sounsthetic.png")||n(B,"src","../../assets/sounsthetic.png"),n(B,"alt","soundsthetic logo"),n(B,"class","logo svelte-cho086"),n(t,"id","photos"),f(t,"position","relative"),n(t,"class","svelte-cho086")},m(s,e){i(s,t,e);for(let a=0;a<G.length;a+=1)G[a].m(t,null);g(t,a),g(t,b),g(b,I),g(I,A),g(I,x),g(I,E),g(b,S),g(b,k),g(k,H),g(t,z),g(t,B)},p(s,[e]){if(2&e){let o;for(D=s[1],o=0;o<D.length;o+=1){const l=j(s,D,o);G[o]?G[o].p(l,e):(G[o]=w(l),G[o].c(),G[o].m(t,a))}for(;o<G.length;o+=1)G[o].d(1);G.length=D.length}1&e&&d(x,s[0])},i:v,o:v,d(s){s&&c(t),y(G,s)}}}function A(s,t,a){let e,o,l,n=null,i=null,c=null,r=[];return b((async()=>{var s=window.location.hash.substring(1),t=s.indexOf("&");n=s.substring(13,t);const h=await fetch("https://api.spotify.com/v1/me/albums?limit=24&offset=5&market=US",{headers:{Accept:"application/json",Authorization:"Bearer "+n,"Content-Type":"application/json"}}),u=await fetch("https://api.spotify.com/v1/me",{headers:{Accept:"application/json",Authorization:"Bearer "+n,"Content-Type":"application/json"}});i=await h.json(),c=await u.json(),a(0,l=c.display_name),i.items[0].album.name,e=i.items[0].album.images[0].url,console.log("here it is: "+i.items[0]),console.log(e),o=i.items;for(let a of o)r.push({url:a.album.images[0].url});a(1,r),console.log(r)})),[l,r]}class x extends s{constructor(s){super(),t(this,s,A,I,a,{})}}export{x as default};
