var u=(m,w,l)=>new Promise((h,a)=>{var g=r=>{try{o(l.next(r))}catch(i){a(i)}},x=r=>{try{o(l.throw(r))}catch(i){a(i)}},o=r=>r.done?h(r.value):Promise.resolve(r.value).then(g,x);o((l=l.apply(m,w)).next())});import{c as f,d as $,r as n,j as e,B as A}from"./index-C8BbTgJU.js";import{S as B}from"./shopping-bag-B5hTS6gL.js";import{L as H}from"./loader-circle-Naj3vNk1.js";import{S as L}from"./send-CgVGFAQx.js";import{W as M}from"./wallet-BrRW7eiA.js";import{C as N}from"./credit-card-PYReIPvA.js";import{P as p}from"./package-B8n3VsaO.js";import{C as D}from"./circle-alert-DON3vjAt.js";/**
 * @license lucide-react v0.518.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],R=f("arrow-left",Q);/**
 * @license lucide-react v0.518.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",key:"1xhozi"}]],K=f("headphones",z);/**
 * @license lucide-react v0.518.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y=[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]],U=f("message-circle",Y);/**
 * @license lucide-react v0.518.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],V=f("rotate-ccw",F);function Z({onClose:m}){var S;const w=$(),l=n.useRef(null),[h,a]=n.useState([{sender:"bot",text:"👋 Hi! I'm your shopping assistant. How can I help you today?"}]),[g,x]=n.useState(!1),[o,r]=n.useState(""),[i,b]=n.useState(!1),[k,y]=n.useState([]),[j,v]=n.useState("main"),_=typeof window!="undefined"&&((S=window.localStorage)==null?void 0:S.getItem("userId"))||null;n.useEffect(()=>{var s;(s=l.current)==null||s.scrollIntoView({behavior:"smooth"})},[h]);const O={"Where is my order?":e.jsx(p,{className:"w-4 h-4"}),"Payment issues":e.jsx(N,{className:"w-4 h-4"}),"Return or refund policy":e.jsx(V,{className:"w-4 h-4"}),"Wallet & Escrow help":e.jsx(M,{className:"w-4 h-4"}),"Report an ad or seller":e.jsx(D,{className:"w-4 h-4"}),"Contact customer support":e.jsx(K,{className:"w-4 h-4"}),"Show all my orders":e.jsx(p,{className:"w-4 h-4"}),"Track a specific order":e.jsx(p,{className:"w-4 h-4"}),"Cancel an order":e.jsx(p,{className:"w-4 h-4"}),"Payment failed":e.jsx(N,{className:"w-4 h-4"}),"Refund not received":e.jsx(N,{className:"w-4 h-4"}),"Add funds to wallet":e.jsx(M,{className:"w-4 h-4"}),Back:e.jsx(R,{className:"w-4 h-4"})},P={main:["Where is my order?","Payment issues","Return or refund policy","Wallet & Escrow help","Report an ad or seller","Contact customer support"],order:["Show all my orders","Track a specific order","Cancel an order","Back"],payment:["Payment failed","Refund not received","Add funds to wallet","Back"]},E=s=>u(null,null,function*(){if(a(t=>[...t,{sender:"user",text:s}]),s==="Where is my order?"){y(t=>[...t,j]),v("order"),a(t=>[...t,{sender:"bot",text:"📦 How can I help with your orders?"}]);return}if(s==="Payment issues"){y(t=>[...t,j]),v("payment"),a(t=>[...t,{sender:"bot",text:"💳 What payment issue are you facing?"}]);return}if(s==="Back"){const t=k.pop();y([...k]),v(t||"main"),a(d=>[...d,{sender:"bot",text:"How else can I assist you?"}]);return}if(s==="Track a specific order"){b(!0),a(t=>[...t,{sender:"bot",text:"Please enter your Order ID below:"}]);return}yield I(s)}),C=s=>u(null,null,function*(){s&&s.preventDefault(),o.trim()&&(a(t=>[...t,{sender:"user",text:`Order ID: ${o}`}]),b(!1),yield I("Track a specific order",o),r(""))}),I=(s,t=null)=>u(null,null,function*(){x(!0);try{const{data:d}=yield A.post("https://api.satgo.az/chatbot/ask",{question:s,orderId:t,userId:_});d.success&&(a(c=>[...c,{sender:"bot",text:d.answer}]),d.redirectTo==="raiseQuery"&&setTimeout(()=>{a(c=>[...c,{sender:"bot",text:"👉 Click the button below to raise a query:",action:"raiseQuery"}])},1e3))}catch(d){a(c=>[...c,{sender:"bot",text:"⚠️ Sorry, something went wrong. Please try again later."}])}finally{x(!1)}}),T=()=>{w("/raise-query")},W=s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),C())};return e.jsxs("div",{className:"relative w-full sm:w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%] mx-auto h-[calc(100vh-120px)] min-h-[500px] max-h-[800px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300",children:[e.jsxs("div",{className:"relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-4 sm:p-6 text-white overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"}),e.jsx("div",{className:"absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"}),e.jsx("div",{className:"absolute top-1/2 right-1/4 w-24 h-24 bg-white opacity-5 rounded-full"}),m&&e.jsx("button",{onClick:m,className:"absolute top-3 right-3 bg-white text-gray-700 hover:bg-gray-100 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-105 z-20 cursor-pointer","aria-label":"Close Chatbot",children:"✕"}),e.jsxs("div",{className:"relative flex items-center gap-3 justify-start",children:[e.jsx("div",{className:"w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg",children:e.jsx(B,{className:"w-5 h-5 sm:w-6 sm:h-6"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-lg sm:text-xl font-bold text-white",children:"Your Shop Assistant"}),e.jsxs("p",{className:"text-emerald-50 text-xs sm:text-sm flex items-center gap-1.5",children:[e.jsx("div",{className:"w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300/50"}),"Online • Ready to help"]})]})]})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto bg-gradient-to-b from-emerald-50/30 to-white p-3 sm:p-4 space-y-3 sm:space-y-4",children:[h.map((s,t)=>e.jsxs("div",{children:[e.jsx("div",{className:`flex ${s.sender==="user"?"justify-end":"justify-start"} animate-fadeIn`,children:e.jsx("div",{className:`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-md ${s.sender==="user"?"bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-tr-sm":"bg-white text-gray-800 rounded-tl-sm border border-emerald-100"}`,children:e.jsx("p",{className:"text-xs sm:text-sm leading-relaxed whitespace-pre-wrap",children:s.text})})}),s.action==="raiseQuery"&&e.jsx("div",{className:"flex justify-start mt-3 animate-fadeIn",children:e.jsxs("button",{onClick:T,className:"bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2",children:[e.jsx(U,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4"}),"Raise a Query"]})})]},t)),g&&e.jsx("div",{className:"flex justify-start animate-fadeIn",children:e.jsxs("div",{className:"bg-white text-gray-600 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-md border border-emerald-100 flex items-center gap-2",children:[e.jsx(H,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-600"}),e.jsx("span",{className:"text-xs sm:text-sm",children:"Typing..."})]})}),e.jsx("div",{ref:l})]}),e.jsx("div",{className:"border-t border-emerald-100 bg-gradient-to-b from-white to-emerald-50/20 p-3 sm:p-4",children:i?e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",onClick:()=>b(!1),className:"w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-100 hover:bg-emerald-200 transition-colors flex-shrink-0",children:e.jsx(R,{className:"w-4 h-4 sm:w-5 sm:h-5 text-emerald-700"})}),e.jsx("input",{type:"text",placeholder:"Enter Order ID (e.g., ORD12345)",value:o,onChange:s=>r(s.target.value),onKeyPress:W,className:"flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs sm:text-sm transition-all",autoFocus:!0}),e.jsx("button",{type:"button",onClick:C,className:"w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex-shrink-0",children:e.jsx(L,{className:"w-4 h-4 sm:w-5 sm:h-5 text-white"})})]}):e.jsx("div",{className:"grid grid-cols-2 gap-2",children:(P[j]||[]).map((s,t)=>e.jsxs("button",{onClick:()=>E(s),className:`p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 justify-center ${s==="Back"?"col-span-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 shadow-sm":"bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:shadow-md"}`,children:[O[s],e.jsx("span",{className:"leading-tight",children:s})]},t))})}),e.jsx("style",{children:`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #a7f3d0;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #6ee7b7;
        }
      `})]})}const oe=Object.freeze(Object.defineProperty({__proto__:null,default:Z},Symbol.toStringTag,{value:"Module"}));export{R as A,Z as C,U as M,oe as c};
