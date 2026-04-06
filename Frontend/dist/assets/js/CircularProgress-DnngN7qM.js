var F=Object.defineProperty,I=Object.defineProperties;var K=Object.getOwnPropertyDescriptors;var l=Object.getOwnPropertySymbols;var w=Object.prototype.hasOwnProperty,R=Object.prototype.propertyIsEnumerable;var j=(r,e,s)=>e in r?F(r,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):r[e]=s,o=(r,e)=>{for(var s in e||(e={}))w.call(e,s)&&j(r,s,e[s]);if(l)for(var s of l(e))R.call(e,s)&&j(r,s,e[s]);return r},h=(r,e)=>I(r,K(e));var N=(r,e)=>{var s={};for(var t in r)w.call(r,t)&&e.indexOf(t)<0&&(s[t]=r[t]);if(r!=null&&l)for(var t of l(r))e.indexOf(t)<0&&R.call(r,t)&&(s[t]=r[t]);return s};import{m as O,n as V,r as W,o as B,j as p,t as G,v as u,w as Z,x as m,z as C,a7 as T,a8 as U,A as q}from"./index-C8BbTgJU.js";function H(r){return O("MuiCircularProgress",r)}V("MuiCircularProgress",["root","determinate","indeterminate","colorPrimary","colorSecondary","svg","track","circle","circleDeterminate","circleIndeterminate","circleDisableShrink"]);const a=44,v=T`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,x=T`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`,J=typeof v!="string"?U`
        animation: ${v} 1.4s linear infinite;
      `:null,L=typeof x!="string"?U`
        animation: ${x} 1.4s ease-in-out infinite;
      `:null,Q=r=>{const{classes:e,variant:s,color:t,disableShrink:d}=r,f={root:["root",s,`color${u(t)}`],svg:["svg"],track:["track"],circle:["circle",`circle${u(s)}`,d&&"circleDisableShrink"]};return Z(f,H,e)},X=m("span",{name:"MuiCircularProgress",slot:"Root",overridesResolver:(r,e)=>{const{ownerState:s}=r;return[e.root,e[s.variant],e[`color${u(s.color)}`]]}})(C(({theme:r})=>({display:"inline-block",variants:[{props:{variant:"determinate"},style:{transition:r.transitions.create("transform")}},{props:{variant:"indeterminate"},style:J||{animation:`${v} 1.4s linear infinite`}},...Object.entries(r.palette).filter(q()).map(([e])=>({props:{color:e},style:{color:(r.vars||r).palette[e].main}}))]}))),Y=m("svg",{name:"MuiCircularProgress",slot:"Svg"})({display:"block"}),_=m("circle",{name:"MuiCircularProgress",slot:"Circle",overridesResolver:(r,e)=>{const{ownerState:s}=r;return[e.circle,e[`circle${u(s.variant)}`],s.disableShrink&&e.circleDisableShrink]}})(C(({theme:r})=>({stroke:"currentColor",variants:[{props:{variant:"determinate"},style:{transition:r.transitions.create("stroke-dashoffset")}},{props:{variant:"indeterminate"},style:{strokeDasharray:"80px, 200px",strokeDashoffset:0}},{props:({ownerState:e})=>e.variant==="indeterminate"&&!e.disableShrink,style:L||{animation:`${x} 1.4s ease-in-out infinite`}}]}))),rr=m("circle",{name:"MuiCircularProgress",slot:"Track"})(C(({theme:r})=>({stroke:"currentColor",opacity:(r.vars||r).palette.action.activatedOpacity}))),tr=W.forwardRef(function(e,s){const t=B({props:e,name:"MuiCircularProgress"}),D=t,{className:d,color:f="primary",disableShrink:z=!1,enableTrackSlot:P=!1,size:k=40,style:A,thickness:i=3.6,value:y=0,variant:S="indeterminate"}=D,E=N(D,["className","color","disableShrink","enableTrackSlot","size","style","thickness","value","variant"]),n=h(o({},t),{color:f,disableShrink:z,size:k,thickness:i,value:y,variant:S,enableTrackSlot:P}),c=Q(n),g={},$={},b={};if(S==="determinate"){const M=2*Math.PI*((a-i)/2);g.strokeDasharray=M.toFixed(3),b["aria-valuenow"]=Math.round(y),g.strokeDashoffset=`${((100-y)/100*M).toFixed(3)}px`,$.transform="rotate(-90deg)"}return p.jsx(X,h(o(o({className:G(c.root,d),style:o(o({width:k,height:k},$),A),ownerState:n,ref:s,role:"progressbar"},b),E),{children:p.jsxs(Y,{className:c.svg,ownerState:n,viewBox:`${a/2} ${a/2} ${a} ${a}`,children:[P?p.jsx(rr,{className:c.track,ownerState:n,cx:a,cy:a,r:(a-i)/2,fill:"none",strokeWidth:i,"aria-hidden":"true"}):null,p.jsx(_,{className:c.circle,style:g,ownerState:n,cx:a,cy:a,r:(a-i)/2,fill:"none",strokeWidth:i})]})}))});export{tr as C};
