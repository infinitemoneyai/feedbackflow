"use strict";var FeedbackFlow=(()=>{var M=Object.defineProperty;var Q=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var K=Object.prototype.hasOwnProperty;var _=(n,e)=>{for(var t in e)M(n,t,{get:e[t],enumerable:!0})},Y=(n,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of q(e))!K.call(n,r)&&r!==t&&M(n,r,{get:()=>e[r],enumerable:!(i=Q(e,r))||i.enumerable});return n};var X=n=>Y(M({},"__esModule",{value:!0}),n);var oe={};_(oe,{FeedbackFlow:()=>j,FeedbackFlowWidget:()=>g});var P={position:"bottom-right",primaryColor:"#1a1a1a",backgroundColor:"#F7F5F0",textColor:"#1a1a1a",buttonText:"Feedback",apiUrl:""};function G(n){switch(n){case"bottom-right":return"bottom: 20px; right: 20px;";case"bottom-left":return"bottom: 20px; left: 20px;";case"top-right":return"top: 20px; right: 20px;";case"top-left":return"top: 20px; left: 20px;";default:return"bottom: 20px; right: 20px;"}}function N(n){return`
    /* FeedbackFlow Widget Styles */
    .ff-widget-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      box-sizing: border-box;
    }

    .ff-widget-root *,
    .ff-widget-root *::before,
    .ff-widget-root *::after {
      box-sizing: inherit;
    }

    /* Floating Button */
    .ff-trigger-button {
      position: fixed;
      ${G(n.position)}
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: ${n.primaryColor};
      color: white;
      border: 2px solid ${n.primaryColor};
      border-radius: 0;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.2);
      transition: all 0.15s ease;
    }

    .ff-trigger-button:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.2);
    }

    .ff-trigger-button:active {
      transform: translate(3px, 3px);
      box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 0.2);
    }

    .ff-trigger-button svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Modal Overlay */
    .ff-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .ff-modal-overlay.ff-visible {
      opacity: 1;
      visibility: visible;
    }

    /* Modal Container */
    .ff-modal {
      background-color: ${n.backgroundColor};
      border: 2px solid ${n.primaryColor};
      box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
      max-width: 420px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: scale(0.95) translateY(10px);
      transition: transform 0.2s ease;
    }

    .ff-modal-overlay.ff-visible .ff-modal {
      transform: scale(1) translateY(0);
    }

    /* Modal Header */
    .ff-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 2px solid ${n.primaryColor};
      background-color: #F3C952;
    }

    .ff-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: ${n.textColor};
      margin: 0;
    }

    .ff-close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${n.textColor};
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.15s ease;
    }

    .ff-close-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .ff-close-button svg {
      width: 20px;
      height: 20px;
    }

    /* Modal Content */
    .ff-modal-content {
      padding: 24px 20px;
      overflow-y: auto;
    }

    /* Capture Options */
    .ff-capture-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ff-capture-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: white;
      border: 2px solid ${n.primaryColor};
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
    }

    .ff-capture-option:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
    }

    .ff-capture-option:active {
      transform: translate(3px, 3px);
      box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 1);
    }

    .ff-capture-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .ff-capture-icon.ff-screenshot {
      background-color: rgba(107, 154, 196, 0.2);
      color: #6B9AC4;
      border: 1px solid rgba(107, 154, 196, 0.3);
    }

    .ff-capture-icon.ff-record {
      background-color: rgba(232, 93, 82, 0.2);
      color: #E85D52;
      border: 1px solid rgba(232, 93, 82, 0.3);
    }

    .ff-capture-icon svg {
      width: 24px;
      height: 24px;
    }

    .ff-capture-text {
      flex: 1;
    }

    .ff-capture-title {
      font-size: 15px;
      font-weight: 600;
      color: ${n.textColor};
      margin: 0 0 4px 0;
    }

    .ff-capture-description {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    /* Modal Footer */
    .ff-modal-footer {
      padding: 12px 20px;
      border-top: 2px solid ${n.primaryColor};
      background-color: rgba(0, 0, 0, 0.03);
    }

    .ff-powered-by {
      font-size: 11px;
      color: #888;
      text-align: center;
    }

    .ff-powered-by a {
      color: #666;
      text-decoration: none;
    }

    .ff-powered-by a:hover {
      text-decoration: underline;
    }
  `}var l={feedback:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>`,close:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`,camera:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>`,video:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>`,arrowRight:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>`,stop:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
  </svg>`,bug:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m8 2 1.88 1.88"></path>
    <path d="M14.12 3.88 16 2"></path>
    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path>
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path>
    <path d="M12 20v-9"></path>
    <path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path>
    <path d="M6 13H2"></path>
    <path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path>
    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path>
    <path d="M22 13h-4"></path>
    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path>
  </svg>`,lightbulb:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
  </svg>`,check:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`,spinner:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>`,mail:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>`,user:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8" r="5"></circle>
    <path d="M20 21a8 8 0 1 0-16 0"></path>
  </svg>`};function o(n,e,t){let i=document.createElement(n);if(e)for(let[r,s]of Object.entries(e))r==="className"?i.className=s:i.setAttribute(r,s);if(t)for(let r of t)typeof r=="string"?i.appendChild(document.createTextNode(r)):i.appendChild(r);return i}function d(n){let e=document.createElement("template");return e.innerHTML=n.trim(),e.content.firstChild}function U(n,e){if(document.getElementById(e))return;let t=o("style",{id:e,type:"text/css"},[n]);document.head.appendChild(t)}function B(){let n=document.getElementById("ff-widget-root");if(n)return n;let e=o("div",{id:"ff-widget-root",className:"ff-widget-root"});return document.body.appendChild(e),e}var y=class{constructor(e){this.backgroundImage=null;this.isDrawing=!1;this.lastPoint=null;this.startPoint=null;this.history=[];this.historyIndex=-1;this.config={tool:"pen",color:"#E85D52",lineWidth:3};this.canvas=e;let t=e.getContext("2d");if(!t)throw new Error("Could not get canvas context");this.ctx=t,this.setupEventListeners()}setBackgroundImage(e){return new Promise((t,i)=>{let r=new Image;r.onload=()=>{this.backgroundImage=r,this.canvas.width=r.width,this.canvas.height=r.height,this.redraw(),this.saveToHistory(),t()},r.onerror=()=>i(new Error("Failed to load image")),r.src=e})}setTool(e){switch(this.config.tool=e,e){case"pen":this.config.color="#E85D52",this.config.lineWidth=3;break;case"highlighter":this.config.color="rgba(243, 201, 82, 0.4)",this.config.lineWidth=20;break;case"arrow":case"circle":this.config.color="#E85D52",this.config.lineWidth=3;break}}getTool(){return this.config.tool}setColor(e){this.config.color=e}clear(){this.redraw(),this.history=[],this.historyIndex=-1,this.saveToHistory()}undo(){if(this.historyIndex>0){this.historyIndex--;let e=this.history[this.historyIndex];this.ctx.putImageData(e,0,0)}}getDataUrl(e="image/png",t=.92){return this.canvas.toDataURL(e,t)}getBlob(e="image/png",t=.92){return new Promise((i,r)=>{this.canvas.toBlob(s=>{s?i(s):r(new Error("Failed to create blob"))},e,t)})}redraw(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.backgroundImage&&this.ctx.drawImage(this.backgroundImage,0,0)}saveToHistory(){this.history=this.history.slice(0,this.historyIndex+1);let e=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);this.history.push(e),this.historyIndex=this.history.length-1,this.history.length>50&&(this.history.shift(),this.historyIndex--)}setupEventListeners(){this.canvas.addEventListener("mousedown",this.handleStart.bind(this)),this.canvas.addEventListener("mousemove",this.handleMove.bind(this)),this.canvas.addEventListener("mouseup",this.handleEnd.bind(this)),this.canvas.addEventListener("mouseleave",this.handleEnd.bind(this)),this.canvas.addEventListener("touchstart",this.handleTouchStart.bind(this),{passive:!1}),this.canvas.addEventListener("touchmove",this.handleTouchMove.bind(this),{passive:!1}),this.canvas.addEventListener("touchend",this.handleEnd.bind(this)),this.canvas.addEventListener("touchcancel",this.handleEnd.bind(this))}getMousePoint(e){let t=this.canvas.getBoundingClientRect(),i=this.canvas.width/t.width,r=this.canvas.height/t.height;return{x:(e.clientX-t.left)*i,y:(e.clientY-t.top)*r}}getTouchPoint(e){let t=this.canvas.getBoundingClientRect(),i=e.touches[0],r=this.canvas.width/t.width,s=this.canvas.height/t.height;return{x:(i.clientX-t.left)*r,y:(i.clientY-t.top)*s}}handleStart(e){this.isDrawing=!0;let t=this.getMousePoint(e);this.lastPoint=t,this.startPoint=t,(this.config.tool==="pen"||this.config.tool==="highlighter")&&(this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y))}handleTouchStart(e){e.preventDefault(),this.isDrawing=!0;let t=this.getTouchPoint(e);this.lastPoint=t,this.startPoint=t,(this.config.tool==="pen"||this.config.tool==="highlighter")&&(this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y))}handleMove(e){if(!this.isDrawing||!this.lastPoint)return;let t=this.getMousePoint(e);this.config.tool==="pen"||this.config.tool==="highlighter"?(this.drawLine(this.lastPoint,t),this.lastPoint=t):this.startPoint&&(this.restoreFromHistory(),this.drawShape(this.startPoint,t))}handleTouchMove(e){if(e.preventDefault(),!this.isDrawing||!this.lastPoint)return;let t=this.getTouchPoint(e);this.config.tool==="pen"||this.config.tool==="highlighter"?(this.drawLine(this.lastPoint,t),this.lastPoint=t):this.startPoint&&(this.restoreFromHistory(),this.drawShape(this.startPoint,t))}handleEnd(){this.isDrawing&&(this.isDrawing=!1,(this.config.tool==="arrow"||this.config.tool==="circle")&&this.startPoint&&this.lastPoint,this.saveToHistory(),this.lastPoint=null,this.startPoint=null)}drawLine(e,t){this.ctx.strokeStyle=this.config.color,this.ctx.lineWidth=this.config.lineWidth,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.config.tool==="highlighter"?this.ctx.globalCompositeOperation="multiply":this.ctx.globalCompositeOperation="source-over",this.ctx.lineTo(t.x,t.y),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y)}drawShape(e,t){this.ctx.strokeStyle=this.config.color,this.ctx.lineWidth=this.config.lineWidth,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.ctx.globalCompositeOperation="source-over",this.config.tool==="arrow"?this.drawArrow(e,t):this.config.tool==="circle"&&this.drawCircle(e,t)}drawArrow(e,t){let r=Math.atan2(t.y-e.y,t.x-e.x);this.ctx.beginPath(),this.ctx.moveTo(e.x,e.y),this.ctx.lineTo(t.x,t.y),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y),this.ctx.lineTo(t.x-15*Math.cos(r-Math.PI/6),t.y-15*Math.sin(r-Math.PI/6)),this.ctx.moveTo(t.x,t.y),this.ctx.lineTo(t.x-15*Math.cos(r+Math.PI/6),t.y-15*Math.sin(r+Math.PI/6)),this.ctx.stroke()}drawCircle(e,t){let i=(e.x+t.x)/2,r=(e.y+t.y)/2,s=Math.abs(t.x-e.x)/2,a=Math.abs(t.y-e.y)/2;this.ctx.beginPath(),this.ctx.ellipse(i,r,s,a,0,0,2*Math.PI),this.ctx.stroke()}restoreFromHistory(){if(this.historyIndex>=0){let e=this.history[this.historyIndex];this.ctx.putImageData(e,0,0)}}destroy(){this.history=[],this.backgroundImage=null}};async function R(){let n=document.getElementById("ff-widget-root");n&&(n.style.display="none");try{return"mediaDevices"in navigator&&"getDisplayMedia"in navigator.mediaDevices?await V():await J()}finally{n&&(n.style.display="")}}async function V(){let n=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"browser"},audio:!1});try{let e=document.createElement("video");e.srcObject=n,e.muted=!0,await new Promise(a=>{e.onloadedmetadata=()=>{e.play(),a()}}),await new Promise(a=>requestAnimationFrame(a));let t=document.createElement("canvas");t.width=e.videoWidth,t.height=e.videoHeight;let i=t.getContext("2d");if(!i)throw new Error("Could not get canvas context");i.drawImage(e,0,0);let r=await new Promise((a,c)=>{t.toBlob(p=>{p?a(p):c(new Error("Failed to create blob"))},"image/png",.92)});return{dataUrl:t.toDataURL("image/png",.92),width:t.width,height:t.height,blob:r}}finally{n.getTracks().forEach(e=>e.stop())}}async function J(){let n=document.createElement("canvas"),e=window.innerWidth,t=window.innerHeight;n.width=e,n.height=t;let i=n.getContext("2d");if(!i)throw new Error("Could not get canvas context");i.fillStyle="#ffffff",i.fillRect(0,0,e,t),i.fillStyle="#666666",i.font="16px sans-serif",i.textAlign="center",i.fillText("Screenshot capture requires screen sharing permission",e/2,t/2);let r=n.toDataURL("image/png"),s=await new Promise((a,c)=>{n.toBlob(p=>{p?a(p):c(new Error("Failed to create blob"))},"image/png")});return{dataUrl:r,width:e,height:t,blob:s}}function D(n,e=1920,t=.85){return new Promise((i,r)=>{let s=new Image;s.onload=()=>{let a=s.width,c=s.height;a>e&&(c=Math.round(c*e/a),a=e);let p=document.createElement("canvas");p.width=a,p.height=c;let u=p.getContext("2d");if(!u){r(new Error("Could not get canvas context"));return}u.drawImage(s,0,0,a,c);let x=p.toDataURL("image/jpeg",t);p.toBlob(m=>{m?i({dataUrl:x,width:a,height:c,blob:m}):r(new Error("Failed to create blob"))},"image/jpeg",t)},s.onerror=()=>r(new Error("Failed to load image")),s.src=n})}var w=class{constructor(e,t){this.container=null;this.canvas=null;this.annotationCanvas=null;this.currentTool="pen";this.capturedImage=null;this.config=e,this.callbacks=t}async start(){try{this.capturedImage=await R(),this.showPreviewUI()}catch{this.callbacks.onCancel()}}showPreviewUI(){if(!this.capturedImage)return;this.container=o("div",{className:"ff-screenshot-overlay"});let e=this.createUI();this.container.appendChild(e),document.body.appendChild(this.container),this.setupCanvas(),this.injectStyles()}createUI(){let e=o("div",{className:"ff-screenshot-wrapper"}),t=o("div",{className:"ff-screenshot-header"},[o("h3",{className:"ff-screenshot-title"},["Annotate Screenshot"]),this.createCloseButton()]),i=o("div",{className:"ff-screenshot-canvas-container"});this.canvas=o("canvas",{className:"ff-screenshot-canvas"}),i.appendChild(this.canvas);let r=this.createToolbar(),s=this.createActions();return e.appendChild(t),e.appendChild(r),e.appendChild(i),e.appendChild(s),e}createCloseButton(){let e=o("button",{className:"ff-screenshot-close",type:"button","aria-label":"Cancel"},[d(l.close)]);return e.addEventListener("click",()=>this.cancel()),e}createToolbar(){let e=o("div",{className:"ff-screenshot-toolbar"});[{tool:"pen",icon:"pen",label:"Pen"},{tool:"highlighter",icon:"highlighter",label:"Highlighter"},{tool:"arrow",icon:"arrow",label:"Arrow"},{tool:"circle",icon:"circle",label:"Circle"}].forEach(({tool:s,icon:a,label:c})=>{let p=o("button",{className:`ff-tool-button ${s===this.currentTool?"ff-active":""}`,type:"button","data-tool":s,title:c},[d(this.getToolIcon(a))]);p.addEventListener("click",()=>{this.setTool(s),e.querySelectorAll(".ff-tool-button").forEach(u=>{u.classList.remove("ff-active")}),p.classList.add("ff-active")}),e.appendChild(p)}),e.appendChild(o("div",{className:"ff-toolbar-separator"}));let i=o("button",{className:"ff-tool-button",type:"button",title:"Undo"},[d(this.getToolIcon("undo"))]);i.addEventListener("click",()=>this.annotationCanvas?.undo()),e.appendChild(i);let r=o("button",{className:"ff-tool-button",type:"button",title:"Clear all"},[d(this.getToolIcon("clear"))]);return r.addEventListener("click",()=>this.annotationCanvas?.clear()),e.appendChild(r),e}createActions(){let e=o("div",{className:"ff-screenshot-actions"}),t=o("button",{className:"ff-screenshot-btn ff-btn-secondary",type:"button"},["Retake"]);t.addEventListener("click",()=>this.retake());let i=o("button",{className:"ff-screenshot-btn ff-btn-primary",type:"button"},["Use Screenshot"]);return i.addEventListener("click",()=>this.confirm()),e.appendChild(t),e.appendChild(i),e}getToolIcon(e){return{pen:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
        <path d="M2 2l7.586 7.586"></path>
        <circle cx="11" cy="11" r="2"></circle>
      </svg>`,highlighter:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11-6 6v3h9l3-3"></path>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>
      </svg>`,arrow:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>`,circle:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>`,undo:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7v6h6"></path>
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
      </svg>`,clear:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      </svg>`}[e]||""}async setupCanvas(){!this.canvas||!this.capturedImage||(this.annotationCanvas=new y(this.canvas),await this.annotationCanvas.setBackgroundImage(this.capturedImage.dataUrl),this.annotationCanvas.setTool(this.currentTool))}setTool(e){this.currentTool=e,this.annotationCanvas?.setTool(e)}async retake(){this.destroy();try{this.capturedImage=await R(),this.showPreviewUI()}catch{this.callbacks.onCancel()}}async confirm(){if(this.annotationCanvas)try{let e=this.annotationCanvas.getDataUrl("image/png"),t=await this.annotationCanvas.getBlob("image/png"),i=await D(e,1920,.85);this.destroy(),this.callbacks.onConfirm(i)}catch{this.callbacks.onCancel()}}cancel(){this.destroy(),this.callbacks.onCancel()}injectStyles(){let e="ff-screenshot-styles";if(document.getElementById(e))return;let t=`
      .ff-screenshot-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ff-screenshot-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ff-screenshot-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: #F3C952;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-screenshot-title {
        font-size: 16px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0;
      }

      .ff-screenshot-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: ${this.config.textColor};
        display: flex;
        border-radius: 4px;
      }

      .ff-screenshot-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .ff-screenshot-close svg {
        width: 20px;
        height: 20px;
      }

      .ff-screenshot-toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        background-color: #f5f5f4;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-tool-button {
        background: white;
        border: 2px solid transparent;
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }

      .ff-tool-button:hover {
        background-color: #e7e5e4;
      }

      .ff-tool-button.ff-active {
        border-color: ${this.config.primaryColor};
        background-color: white;
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-tool-button svg {
        width: 20px;
        height: 20px;
        color: ${this.config.textColor};
      }

      .ff-toolbar-separator {
        width: 1px;
        height: 24px;
        background-color: #d6d3d1;
        margin: 0 8px;
      }

      .ff-screenshot-canvas-container {
        flex: 1;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background-color: #e8e6e1;
        min-height: 200px;
      }

      .ff-screenshot-canvas {
        max-width: 100%;
        max-height: 60vh;
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5);
        cursor: crosshair;
      }

      .ff-screenshot-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 12px 16px;
        background-color: rgba(0, 0, 0, 0.03);
        border-top: 2px solid ${this.config.primaryColor};
      }

      .ff-screenshot-btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 2px solid ${this.config.primaryColor};
        transition: all 0.15s ease;
      }

      .ff-btn-secondary {
        background-color: white;
        color: ${this.config.textColor};
      }

      .ff-btn-secondary:hover {
        background-color: #f5f5f4;
      }

      .ff-btn-primary {
        background-color: ${this.config.primaryColor};
        color: white;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
      }

      .ff-btn-primary:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
      }
    `,i=document.createElement("style");i.id=e,i.textContent=t,document.head.appendChild(i)}destroy(){this.annotationCanvas?.destroy(),this.annotationCanvas=null,this.container?.remove(),this.container=null,this.canvas=null,this.capturedImage=null}};var Z=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"],b=class{constructor(e){this.mediaRecorder=null;this.screenStream=null;this.audioStream=null;this.combinedStream=null;this.chunks=[];this.startTime=0;this.timerInterval=null;this.mimeType="video/webm";this.callbacks=e}static isSupported(){return typeof navigator<"u"&&"mediaDevices"in navigator&&"getDisplayMedia"in navigator.mediaDevices&&typeof MediaRecorder<"u"}getSupportedMimeType(){for(let e of Z)if(MediaRecorder.isTypeSupported(e))return e;return"video/webm"}async start(){if(this.mediaRecorder?.state==="recording")throw new Error("Recording already in progress");try{this.screenStream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"browser",cursor:"always"},audio:!1});try{this.audioStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0},video:!1})}catch{}let e=[...this.screenStream.getVideoTracks(),...this.audioStream?.getAudioTracks()||[]];this.combinedStream=new MediaStream(e),this.mimeType=this.getSupportedMimeType(),this.mediaRecorder=new MediaRecorder(this.combinedStream,{mimeType:this.mimeType,videoBitsPerSecond:25e5}),this.chunks=[],this.mediaRecorder.ondataavailable=t=>{t.data.size>0&&this.chunks.push(t.data)},this.mediaRecorder.onstop=()=>{this.handleStop()},this.mediaRecorder.onerror=t=>{let i=t,r=new Error(i.error?.message||"Recording failed");this.cleanup(),this.callbacks.onError(r)},this.screenStream.getVideoTracks()[0].onended=()=>{this.mediaRecorder?.state==="recording"&&this.stop()},this.mediaRecorder.start(1e3),this.startTime=Date.now(),this.callbacks.onStart(),this.startTimer()}catch(e){throw this.cleanup(),e}}stop(){this.mediaRecorder?.state==="recording"&&this.mediaRecorder.stop(),this.stopTimer()}handleStop(){let e=Date.now()-this.startTime,t=new Blob(this.chunks,{type:this.mimeType});this.cleanup(),this.callbacks.onStop({blob:t,duration:e,mimeType:this.mimeType})}startTimer(){this.timerInterval=setInterval(()=>{let e=Date.now()-this.startTime;this.callbacks.onTimeUpdate(e),e>=12e4&&this.stop()},100)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}cleanup(){this.stopTimer(),this.screenStream?.getTracks().forEach(e=>e.stop()),this.audioStream?.getTracks().forEach(e=>e.stop()),this.combinedStream?.getTracks().forEach(e=>e.stop()),this.screenStream=null,this.audioStream=null,this.combinedStream=null,this.mediaRecorder=null,this.chunks=[]}isRecording(){return this.mediaRecorder?.state==="recording"}getElapsed(){return this.startTime?Date.now()-this.startTime:0}destroy(){this.stop(),this.cleanup()}};function C(n){let e=Math.floor(n/1e3),t=Math.floor(e/60),i=e%60;return`${t.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`}function $(){return 12e4}var k=class{constructor(e,t){this.recorder=null;this.recordingResult=null;this.state="idle";this.indicatorElement=null;this.previewElement=null;this.videoElement=null;this.timerElement=null;this.objectUrl=null;this.config=e,this.callbacks=t,this.injectStyles()}async start(){if(!b.isSupported()){alert("Screen recording is not supported in this browser."),this.callbacks.onCancel();return}try{this.state="recording",this.showRecordingIndicator(),this.recorder=new b({onStart:()=>{},onStop:e=>{this.handleRecordingComplete(e)},onError:e=>{this.hideRecordingIndicator(),this.callbacks.onCancel()},onTimeUpdate:e=>{this.updateTimer(e)}}),await this.recorder.start()}catch{this.hideRecordingIndicator(),this.callbacks.onCancel()}}showRecordingIndicator(){this.indicatorElement=o("div",{className:"ff-recording-indicator"});let e=o("div",{className:"ff-recording-content"},[o("div",{className:"ff-recording-dot"}),o("span",{className:"ff-recording-text"},["Recording"]),o("span",{className:"ff-recording-timer"},["00:00"]),o("span",{className:"ff-recording-separator"},[" / "]),o("span",{className:"ff-recording-max"},[C($())])]),t=o("button",{className:"ff-recording-stop",type:"button"},[d(l.stop||l.close),"Stop"]);t.addEventListener("click",()=>this.stopRecording()),this.indicatorElement.appendChild(e),this.indicatorElement.appendChild(t),document.body.appendChild(this.indicatorElement),this.timerElement=this.indicatorElement.querySelector(".ff-recording-timer")}updateTimer(e){this.timerElement&&(this.timerElement.textContent=C(e))}hideRecordingIndicator(){this.indicatorElement?.remove(),this.indicatorElement=null,this.timerElement=null}stopRecording(){this.recorder?.stop()}handleRecordingComplete(e){this.recordingResult=e,this.state="preview",this.hideRecordingIndicator(),this.showPreview()}showPreview(){if(!this.recordingResult)return;this.objectUrl=URL.createObjectURL(this.recordingResult.blob),this.previewElement=o("div",{className:"ff-recording-preview-overlay"});let e=o("div",{className:"ff-recording-preview-wrapper"}),t=o("div",{className:"ff-recording-preview-header"},[o("h3",{className:"ff-recording-preview-title"},["Preview Recording"]),this.createCloseButton()]),i=o("div",{className:"ff-recording-preview-video-container"});this.videoElement=o("video",{className:"ff-recording-preview-video"}),this.videoElement.src=this.objectUrl,this.videoElement.controls=!0,this.videoElement.playsInline=!0,i.appendChild(this.videoElement);let r=o("div",{className:"ff-recording-preview-info"},[o("span",{className:"ff-recording-info-item"},[`Duration: ${C(this.recordingResult.duration)}`]),o("span",{className:"ff-recording-info-item"},[`Size: ${(this.recordingResult.blob.size/(1024*1024)).toFixed(2)} MB`])]),s=o("div",{className:"ff-recording-preview-actions"},[this.createButton("Retake","secondary",()=>this.retake()),this.createButton("Use Recording","primary",()=>this.confirm())]);e.appendChild(t),e.appendChild(i),e.appendChild(r),e.appendChild(s),this.previewElement.appendChild(e),document.body.appendChild(this.previewElement)}createCloseButton(){let e=o("button",{className:"ff-recording-preview-close",type:"button","aria-label":"Cancel"},[d(l.close)]);return e.addEventListener("click",()=>this.cancel()),e}createButton(e,t,i){let r=o("button",{className:`ff-recording-btn ff-btn-${t}`,type:"button"},[e]);return r.addEventListener("click",i),r}hidePreview(){this.previewElement?.remove(),this.previewElement=null,this.videoElement=null,this.objectUrl&&(URL.revokeObjectURL(this.objectUrl),this.objectUrl=null)}async retake(){this.hidePreview(),this.recordingResult=null,await this.start()}confirm(){if(!this.recordingResult)return;let e=this.recordingResult;this.hidePreview(),this.callbacks.onConfirm(e)}cancel(){this.recorder?.destroy(),this.hideRecordingIndicator(),this.hidePreview(),this.recordingResult=null,this.callbacks.onCancel()}injectStyles(){let e="ff-recording-styles";if(document.getElementById(e))return;let t=`
      .ff-recording-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }

      .ff-recording-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ff-recording-dot {
        width: 12px;
        height: 12px;
        background-color: #E85D52;
        border-radius: 50%;
        animation: ff-pulse 1s ease-in-out infinite;
      }

      @keyframes ff-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.9); }
      }

      .ff-recording-text {
        font-weight: 600;
        color: #E85D52;
      }

      .ff-recording-timer {
        font-family: monospace;
        font-weight: 600;
        color: ${this.config.textColor};
      }

      .ff-recording-separator {
        color: #888;
      }

      .ff-recording-max {
        font-family: monospace;
        color: #888;
      }

      .ff-recording-stop {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background-color: #E85D52;
        color: white;
        border: 2px solid ${this.config.primaryColor};
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
        transition: all 0.15s ease;
      }

      .ff-recording-stop:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-recording-stop svg {
        width: 16px;
        height: 16px;
      }

      /* Preview */
      .ff-recording-preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ff-recording-preview-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ff-recording-preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: #F3C952;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-recording-preview-title {
        font-size: 16px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0;
      }

      .ff-recording-preview-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: ${this.config.textColor};
        display: flex;
        border-radius: 4px;
      }

      .ff-recording-preview-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .ff-recording-preview-close svg {
        width: 20px;
        height: 20px;
      }

      .ff-recording-preview-video-container {
        padding: 16px;
        background-color: #e8e6e1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ff-recording-preview-video {
        max-width: 100%;
        max-height: 50vh;
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-recording-preview-info {
        display: flex;
        gap: 16px;
        padding: 12px 16px;
        background-color: #f5f5f4;
        border-top: 1px solid #d6d3d1;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-recording-info-item {
        font-size: 13px;
        color: #666;
      }

      .ff-recording-preview-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 12px 16px;
        background-color: rgba(0, 0, 0, 0.03);
      }

      .ff-recording-btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 2px solid ${this.config.primaryColor};
        transition: all 0.15s ease;
      }

      .ff-recording-btn.ff-btn-secondary {
        background-color: white;
        color: ${this.config.textColor};
      }

      .ff-recording-btn.ff-btn-secondary:hover {
        background-color: #f5f5f4;
      }

      .ff-recording-btn.ff-btn-primary {
        background-color: ${this.config.primaryColor};
        color: white;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
      }

      .ff-recording-btn.ff-btn-primary:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
      }
    `,i=document.createElement("style");i.id=e,i.textContent=t,document.head.appendChild(i)}destroy(){this.recorder?.destroy(),this.hideRecordingIndicator(),this.hidePreview(),this.recordingResult=null}};var H="ff_submission_queue";function ee(){return`ff_${Date.now()}_${Math.random().toString(36).substring(2,9)}`}function te(n){let e=1e3*Math.pow(2,n),t=e*.2*Math.random();return Date.now()+e+t}var v=class n{constructor(e=""){this.retryTimer=null;this.isProcessing=!1;this.apiUrl=e||this.getDefaultApiUrl(),this.setupConnectivityListener(),this.scheduleRetry()}getDefaultApiUrl(){if(typeof window>"u")return"";let e=document.querySelectorAll('script[src*="widget.js"]');for(let t of Array.from(e)){let i=t.src;if(i)try{return`${new URL(i).origin}/api/widget/submit`}catch{}}return"https://feedbackflow.dev/api/widget/submit"}setupConnectivityListener(){typeof window>"u"||window.addEventListener("online",()=>{this.processQueue()})}getQueue(){try{let e=localStorage.getItem(H);return e?JSON.parse(e):[]}catch{return[]}}saveQueue(e){try{localStorage.setItem(H,JSON.stringify(e))}catch{}}addToQueue(e,t,i,r){let s=this.getQueue(),a={id:ee(),widgetKey:e,formData:t,screenshotDataUrl:i,recordingBlob:r?this.blobToBase64Sync(r):void 0,recordingMimeType:r?.type,timestamp:Date.now(),retryCount:0,nextRetryAt:Date.now()};return s.push(a),this.saveQueue(s),this.scheduleRetry(),a.id}blobToBase64Sync(e){return""}static blobToBase64(e){return new Promise((t,i)=>{let r=new FileReader;r.onload=()=>{let a=r.result.split(",")[1];t(a)},r.onerror=()=>i(new Error("Failed to convert blob to base64")),r.readAsDataURL(e)})}static base64ToBlob(e,t){let i=atob(e),r=new Uint8Array(i.length);for(let s=0;s<i.length;s++)r[s]=i.charCodeAt(s);return new Blob([r],{type:t})}removeFromQueue(e){let t=this.getQueue().filter(i=>i.id!==e);this.saveQueue(t)}scheduleRetry(){this.retryTimer&&clearTimeout(this.retryTimer);let e=this.getQueue();if(e.length===0)return;let t=Date.now(),i=Math.min(...e.map(s=>s.nextRetryAt)),r=Math.max(0,i-t);this.retryTimer=setTimeout(()=>{this.processQueue()},r)}async processQueue(){if(!this.isProcessing&&navigator.onLine){this.isProcessing=!0;try{let e=this.getQueue(),t=Date.now();for(let i of e)if(!(i.nextRetryAt>t)){if(i.retryCount>=5){this.removeFromQueue(i.id);continue}try{let r=await this.submitToApi(i);if(r.success)this.removeFromQueue(i.id),window.dispatchEvent(new CustomEvent("ff:queue-submission-success",{detail:{id:i.id,feedbackId:r.feedbackId}}));else throw new Error(r.error||"Submission failed")}catch{let s=this.getQueue(),a=s.findIndex(c=>c.id===i.id);a!==-1&&(s[a].retryCount++,s[a].nextRetryAt=te(s[a].retryCount),this.saveQueue(s))}}}finally{this.isProcessing=!1,this.scheduleRetry()}}}async submitToApi(e){let t=new FormData;if(t.append("widgetKey",e.widgetKey),t.append("title",e.formData.title),t.append("description",e.formData.description),t.append("type",e.formData.type),t.append("metadata",JSON.stringify(e.formData.metadata)),e.formData.email&&t.append("email",e.formData.email),e.formData.name&&t.append("name",e.formData.name),e.screenshotDataUrl){let a=await(await fetch(e.screenshotDataUrl)).blob();t.append("screenshot",a,"screenshot.jpg")}if(e.recordingBlob&&e.recordingMimeType){let s=n.base64ToBlob(e.recordingBlob,e.recordingMimeType),a=e.recordingMimeType.includes("webm")?"webm":"mp4";t.append("recording",s,`recording.${a}`)}let i=await fetch(this.apiUrl,{method:"POST",body:t});if(!i.ok){let s=await i.text().catch(()=>"Unknown error");return{success:!1,error:`HTTP ${i.status}: ${s}`}}let r=await i.json();return{success:!0,feedbackId:r.feedbackId||r.id}}getQueueSize(){return this.getQueue().length}clearQueue(){this.saveQueue([]),this.retryTimer&&(clearTimeout(this.retryTimer),this.retryTimer=null)}destroy(){this.retryTimer&&(clearTimeout(this.retryTimer),this.retryTimer=null)}},I=null;function S(n){return I||(I=new v(n)),I}var E=class{constructor(e,t,i,r){this.container=null;this.state="form";this.formState={title:"",description:"",type:"bug",email:"",name:"",privacyConsent:!1};this.feedbackId="";this.errorMessage="";this.warningMessage="";this.config=e,this.callbacks=t,this.screenshot=i,this.recording=r,this.offlineQueue=S(e.apiUrl)}show(){this.injectStyles(),this.render()}render(){this.container?.remove(),this.container=o("div",{className:"ff-submit-overlay"});let e=o("div",{className:"ff-submit-wrapper"});switch(this.state){case"form":e.appendChild(this.renderForm());break;case"loading":e.appendChild(this.renderLoading());break;case"success":e.appendChild(this.renderSuccess());break;case"error":e.appendChild(this.renderError());break}this.container.appendChild(e),document.body.appendChild(this.container),this.state==="form"&&this.container.querySelector(".ff-submit-title-input")?.focus()}renderForm(){let e=o("div",{className:"ff-submit-form"}),t=o("div",{className:"ff-submit-header"},[o("h3",{className:"ff-submit-title"},["Submit Feedback"]),this.createCloseButton()]),i=o("div",{className:"ff-submit-content"});(this.screenshot||this.recording)&&i.appendChild(this.renderPreviewThumbnail()),i.appendChild(this.renderTypeSelector());let r=o("div",{className:"ff-form-group"},[o("label",{className:"ff-form-label"},["Title"]),o("input",{className:"ff-submit-title-input ff-input",type:"text",placeholder:"Brief summary of the issue or request"})]),s=r.querySelector("input");s.value=this.formState.title,s.addEventListener("input",h=>{this.formState.title=h.target.value}),i.appendChild(r);let a=o("div",{className:"ff-form-group"},[o("label",{className:"ff-form-label"},["Description"]),o("textarea",{className:"ff-submit-description-input ff-textarea",placeholder:"Provide more details about what happened or what you'd like to see..."})]),c=a.querySelector("textarea");c.value=this.formState.description,c.addEventListener("input",h=>{this.formState.description=h.target.value}),i.appendChild(a);let p=o("div",{className:"ff-optional-section"}),u=o("div",{className:"ff-optional-header"},[o("span",{className:"ff-optional-label"},["Optional"])]);p.appendChild(u);let x=o("div",{className:"ff-form-group ff-form-group-sm"},[o("label",{className:"ff-form-label-sm"},[d(l.mail),"Email (for follow-up)"]),o("input",{className:"ff-input ff-input-sm",type:"email",placeholder:"your@email.com"})]),m=x.querySelector("input");m.value=this.formState.email,m.addEventListener("input",h=>{this.formState.email=h.target.value}),p.appendChild(x);let F=o("div",{className:"ff-form-group ff-form-group-sm"},[o("label",{className:"ff-form-label-sm"},[d(l.user),"Name"]),o("input",{className:"ff-input ff-input-sm",type:"text",placeholder:"Your name"})]),L=F.querySelector("input");if(L.value=this.formState.name,L.addEventListener("input",h=>{this.formState.name=h.target.value}),p.appendChild(F),i.appendChild(p),this.config.privacyPolicyUrl){let h=o("div",{className:"ff-consent-section"}),T=o("input",{type:"checkbox",className:"ff-consent-checkbox",id:"ff-privacy-consent"});T.checked=this.formState.privacyConsent,T.addEventListener("change",W=>{this.formState.privacyConsent=W.target.checked});let z=o("label",{className:"ff-consent-label",for:"ff-privacy-consent"},[T,o("span",{className:"ff-consent-text"},["I acknowledge that my feedback may include personal information and agree to the ",o("a",{href:this.config.privacyPolicyUrl,target:"_blank",className:"ff-consent-link"},["privacy policy"]),"."])]);h.appendChild(z),i.appendChild(h)}let O=o("div",{className:"ff-submit-actions"},[this.createButton("Cancel","secondary",()=>this.cancel()),this.createButton("Submit Feedback","primary",()=>this.submit())]);return e.appendChild(t),e.appendChild(i),e.appendChild(O),e}renderPreviewThumbnail(){let e=o("div",{className:"ff-preview-thumbnail"});if(this.screenshot){let t=o("img",{className:"ff-preview-img"});t.src=this.screenshot.dataUrl,t.alt="Screenshot preview",e.appendChild(t),e.appendChild(o("span",{className:"ff-preview-label"},["Screenshot attached"]))}else if(this.recording){let t=o("div",{className:"ff-preview-icon"},[d(l.video)]);e.appendChild(t);let i=Math.round(this.recording.duration/1e3);e.appendChild(o("span",{className:"ff-preview-label"},[`Recording attached (${i}s)`]))}return e}renderTypeSelector(){let e=o("div",{className:"ff-type-selector"}),t=this.createTypeOption("bug","Bug Report",l.bug,"#E85D52"),i=this.createTypeOption("feature","Feature Request",l.lightbulb,"#6B9AC4");return e.appendChild(t),e.appendChild(i),e}createTypeOption(e,t,i,r){let s=this.formState.type===e,a=o("button",{className:`ff-type-option ${s?"ff-selected":""}`,type:"button","data-type":e},[o("div",{className:"ff-type-icon"},[d(i)]),o("span",{className:"ff-type-label"},[t])]),c=a.querySelector(".ff-type-icon");return c&&(c.style.color=r,s&&(c.style.backgroundColor=`${r}20`,c.style.borderColor=`${r}40`)),a.addEventListener("click",()=>{this.formState.type=e,this.render()}),a}renderLoading(){let e=o("div",{className:"ff-submit-loading"}),t=o("div",{className:"ff-spinner"},[d(l.spinner)]),i=o("p",{className:"ff-loading-text"},["Submitting your feedback..."]);return e.appendChild(t),e.appendChild(i),e}renderSuccess(){let e=o("div",{className:"ff-submit-success"}),t=o("div",{className:"ff-success-icon"},[d(l.check)]),i=o("h3",{className:"ff-success-title"},["Feedback Submitted!"]),r=o("p",{className:"ff-success-message"},["Thank you for your feedback. We'll review it shortly."]);if(this.warningMessage){let c=o("div",{className:"ff-success-warning"},[o("div",{className:"ff-warning-icon"},[d(l.warning||l.info)]),o("p",{className:"ff-warning-text"},[this.warningMessage])]);e.appendChild(t),e.appendChild(i),e.appendChild(c)}else e.appendChild(t),e.appendChild(i),e.appendChild(r);let s=o("div",{className:"ff-success-id"},[o("span",{className:"ff-id-label"},["Reference ID: "]),o("code",{className:"ff-id-value"},[this.feedbackId])]),a=this.createButton("Close","primary",()=>{this.callbacks.onSuccess(this.feedbackId),this.destroy()});return e.appendChild(s),e.appendChild(a),e}renderError(){let e=o("div",{className:"ff-submit-error"}),t=o("div",{className:"ff-error-icon"},[d(l.close)]),i=o("h3",{className:"ff-error-title"},["Submission Failed"]),r=o("p",{className:"ff-error-message"},[this.errorMessage||"Something went wrong. Your feedback has been saved and will be submitted automatically when the connection is restored."]),s=o("div",{className:"ff-error-actions"},[this.createButton("Try Again","secondary",()=>{this.state="form",this.render()}),this.createButton("Close","primary",()=>{this.callbacks.onError(this.errorMessage),this.destroy()})]);return e.appendChild(t),e.appendChild(i),e.appendChild(r),e.appendChild(s),e}createCloseButton(){let e=o("button",{className:"ff-submit-close",type:"button","aria-label":"Cancel"},[d(l.close)]);return e.addEventListener("click",()=>this.cancel()),e}createButton(e,t,i){let r=o("button",{className:`ff-submit-btn ff-btn-${t}`,type:"button"},[e]);return r.addEventListener("click",i),r}cancel(){this.destroy(),this.callbacks.onCancel()}async submit(){if(!this.formState.title.trim()){alert("Please enter a title for your feedback.");return}if(this.config.privacyPolicyUrl&&!this.formState.privacyConsent){alert("Please acknowledge the privacy policy to submit feedback.");return}this.state="loading",this.render();try{let e=await this.submitFeedback();if(e.success&&e.feedbackId)this.feedbackId=e.feedbackId,this.warningMessage=e.warning||"",this.state="success",this.render();else throw new Error(e.error||"Submission failed")}catch(e){await this.queueForRetry(),this.errorMessage=e instanceof Error?e.message:"Submission failed",this.state="error",this.render()}}async submitFeedback(){let e=this.getMetadata(),t=this.config.apiUrl||"https://feedbackflow.dev/api/widget/submit",i=new FormData;if(i.append("widgetKey",this.config.widgetKey),i.append("title",this.formState.title),i.append("description",this.formState.description),i.append("type",this.formState.type),i.append("metadata",JSON.stringify(e)),this.formState.email&&i.append("email",this.formState.email),this.formState.name&&i.append("name",this.formState.name),this.screenshot?.blob&&i.append("screenshot",this.screenshot.blob,"screenshot.jpg"),this.recording?.blob){let a=this.recording.mimeType.includes("webm")?"webm":"mp4";i.append("recording",this.recording.blob,`recording.${a}`)}let r=await fetch(t,{method:"POST",body:i});if(!r.ok){let a=await r.text().catch(()=>"Unknown error");throw new Error(`HTTP ${r.status}: ${a}`)}let s=await r.json();return{success:!0,feedbackId:s.feedbackId||s.id,warning:s.warning}}async queueForRetry(){let e=this.getMetadata(),t={title:this.formState.title,description:this.formState.description,type:this.formState.type,email:this.formState.email||void 0,name:this.formState.name||void 0,metadata:e},i;this.recording?.blob&&(i=await v.blobToBase64(this.recording.blob));let r=this.offlineQueue.getQueue(),s={id:`ff_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,widgetKey:this.config.widgetKey,formData:t,screenshotDataUrl:this.screenshot?.dataUrl,recordingBlob:i,recordingMimeType:this.recording?.mimeType,timestamp:Date.now(),retryCount:0,nextRetryAt:Date.now()};r.push(s),localStorage.setItem("ff_submission_queue",JSON.stringify(r))}getMetadata(){return{url:window.location.href,userAgent:navigator.userAgent,timestamp:new Date().toISOString(),screenWidth:window.screen.width,screenHeight:window.screen.height}}injectStyles(){let e="ff-submit-styles";if(document.getElementById(e))return;let t=`
      .ff-submit-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ff-submit-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 480px;
        width: 90%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ff-submit-form {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .ff-submit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: #F3C952;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-submit-title {
        font-size: 16px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0;
      }

      .ff-submit-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: ${this.config.textColor};
        display: flex;
        border-radius: 4px;
      }

      .ff-submit-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .ff-submit-close svg {
        width: 20px;
        height: 20px;
      }

      .ff-submit-content {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }

      /* Preview Thumbnail */
      .ff-preview-thumbnail {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background-color: #f5f5f4;
        border: 1px solid #d6d3d1;
        margin-bottom: 16px;
      }

      .ff-preview-img {
        width: 60px;
        height: 45px;
        object-fit: cover;
        border: 1px solid ${this.config.primaryColor};
      }

      .ff-preview-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(232, 93, 82, 0.1);
        border: 1px solid rgba(232, 93, 82, 0.3);
        border-radius: 50%;
        color: #E85D52;
      }

      .ff-preview-icon svg {
        width: 24px;
        height: 24px;
      }

      .ff-preview-label {
        font-size: 13px;
        color: #666;
      }

      /* Type Selector */
      .ff-type-selector {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .ff-type-option {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: white;
        border: 2px solid #d6d3d1;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .ff-type-option:hover {
        border-color: ${this.config.primaryColor};
      }

      .ff-type-option.ff-selected {
        border-color: ${this.config.primaryColor};
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-type-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1px solid transparent;
      }

      .ff-type-icon svg {
        width: 18px;
        height: 18px;
      }

      .ff-type-label {
        font-size: 13px;
        font-weight: 500;
        color: ${this.config.textColor};
      }

      /* Form Groups */
      .ff-form-group {
        margin-bottom: 16px;
      }

      .ff-form-group-sm {
        margin-bottom: 12px;
      }

      .ff-form-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin-bottom: 6px;
      }

      .ff-form-label-sm {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        color: #666;
        margin-bottom: 4px;
      }

      .ff-form-label-sm svg {
        width: 14px;
        height: 14px;
      }

      .ff-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #d6d3d1;
        background-color: white;
        font-size: 14px;
        color: ${this.config.textColor};
        transition: border-color 0.15s ease;
        outline: none;
      }

      .ff-input:focus {
        border-color: ${this.config.primaryColor};
      }

      .ff-input::placeholder {
        color: #999;
      }

      .ff-input-sm {
        padding: 8px 10px;
        font-size: 13px;
      }

      .ff-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #d6d3d1;
        background-color: white;
        font-size: 14px;
        color: ${this.config.textColor};
        min-height: 80px;
        resize: vertical;
        transition: border-color 0.15s ease;
        outline: none;
        font-family: inherit;
      }

      .ff-textarea:focus {
        border-color: ${this.config.primaryColor};
      }

      .ff-textarea::placeholder {
        color: #999;
      }

      /* Optional Section */
      .ff-optional-section {
        border-top: 1px solid #e5e5e5;
        padding-top: 12px;
        margin-top: 8px;
      }

      .ff-optional-header {
        margin-bottom: 12px;
      }

      .ff-optional-label {
        font-size: 11px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Actions */
      .ff-submit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 12px 16px;
        background-color: rgba(0, 0, 0, 0.03);
        border-top: 2px solid ${this.config.primaryColor};
      }

      .ff-submit-btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 2px solid ${this.config.primaryColor};
        transition: all 0.15s ease;
      }

      .ff-submit-btn.ff-btn-secondary {
        background-color: white;
        color: ${this.config.textColor};
      }

      .ff-submit-btn.ff-btn-secondary:hover {
        background-color: #f5f5f4;
      }

      .ff-submit-btn.ff-btn-primary {
        background-color: ${this.config.primaryColor};
        color: white;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
      }

      .ff-submit-btn.ff-btn-primary:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
      }

      /* Loading State */
      .ff-submit-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
      }

      .ff-spinner {
        width: 48px;
        height: 48px;
        color: ${this.config.primaryColor};
        animation: ff-spin 1s linear infinite;
        margin-bottom: 16px;
      }

      .ff-spinner svg {
        width: 100%;
        height: 100%;
      }

      @keyframes ff-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .ff-loading-text {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      /* Success State */
      .ff-submit-success {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px;
        text-align: center;
      }

      .ff-success-icon {
        width: 64px;
        height: 64px;
        background-color: #6B9AC4;
        border: 2px solid ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 16px;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.2);
      }

      .ff-success-icon svg {
        width: 32px;
        height: 32px;
      }

      .ff-success-title {
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0 0 8px 0;
      }

      .ff-success-message {
        font-size: 14px;
        color: #666;
        margin: 0 0 16px 0;
      }

      .ff-success-warning {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background-color: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 6px;
        margin-bottom: 16px;
        text-align: left;
      }

      .ff-warning-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        color: #f59e0b;
      }

      .ff-warning-icon svg {
        width: 100%;
        height: 100%;
      }

      .ff-warning-text {
        font-size: 13px;
        color: #92400e;
        margin: 0;
        line-height: 1.5;
      }

      .ff-success-id {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        margin-bottom: 24px;
      }

      .ff-id-label {
        color: #888;
      }

      .ff-id-value {
        font-family: monospace;
        background-color: #f5f5f4;
        padding: 2px 6px;
        border: 1px solid #d6d3d1;
      }

      /* Error State */
      .ff-submit-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px;
        text-align: center;
      }

      .ff-error-icon {
        width: 64px;
        height: 64px;
        background-color: #E85D52;
        border: 2px solid ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 16px;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.2);
      }

      .ff-error-icon svg {
        width: 32px;
        height: 32px;
      }

      .ff-error-title {
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0 0 8px 0;
      }

      .ff-error-message {
        font-size: 14px;
        color: #666;
        margin: 0 0 24px 0;
        max-width: 320px;
      }

      .ff-error-actions {
        display: flex;
        gap: 12px;
      }

      /* Privacy Consent Section */
      .ff-consent-section {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e5e5e5;
      }

      .ff-consent-label {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        font-size: 12px;
        line-height: 1.5;
      }

      .ff-consent-checkbox {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        margin-top: 2px;
        cursor: pointer;
        accent-color: ${this.config.primaryColor};
      }

      .ff-consent-text {
        color: #666;
      }

      .ff-consent-link {
        color: #6B9AC4;
        text-decoration: underline;
      }

      .ff-consent-link:hover {
        color: #4a7ba0;
      }
    `,i=document.createElement("style");i.id=e,i.textContent=t,document.head.appendChild(i)}destroy(){this.container?.remove(),this.container=null}};var g=class{constructor(e){this.root=null;this.triggerButton=null;this.modalOverlay=null;this.screenshotUI=null;this.recordUI=null;this.submitUI=null;this.capturedScreenshot=null;this.capturedRecording=null;this.config={...P,...e},this.state={isOpen:!1,isCapturing:!1,captureMode:null},this.init()}init(){U(N(this.config),"ff-widget-styles"),this.root=B(),this.createTriggerButton(),this.createModal(),this.setupEventListeners(),S(this.config.apiUrl)}createTriggerButton(){this.triggerButton=o("button",{className:"ff-trigger-button","aria-label":"Open feedback widget",type:"button"},[d(l.feedback),this.config.buttonText]),this.root?.appendChild(this.triggerButton)}createModal(){this.modalOverlay=o("div",{className:"ff-modal-overlay",role:"dialog","aria-modal":"true","aria-labelledby":"ff-modal-title"});let e=o("div",{className:"ff-modal"}),t=o("div",{className:"ff-modal-header"},[o("h2",{className:"ff-modal-title",id:"ff-modal-title"},["Share Feedback"]),this.createCloseButton()]),i=o("div",{className:"ff-modal-content"},[this.createCaptureOptions()]),r=["Powered by ",o("a",{href:"https://feedbackflow.cc",target:"_blank"},["FeedbackFlow"])];this.config.privacyPolicyUrl&&r.push(" · ",o("a",{href:this.config.privacyPolicyUrl,target:"_blank"},["Privacy Policy"]));let s=o("div",{className:"ff-modal-footer"},[o("div",{className:"ff-powered-by"},r)]);e.appendChild(t),e.appendChild(i),e.appendChild(s),this.modalOverlay.appendChild(e),this.root?.appendChild(this.modalOverlay)}createCloseButton(){return o("button",{className:"ff-close-button","aria-label":"Close feedback widget",type:"button"},[d(l.close)])}createCaptureOptions(){let e=o("div",{className:"ff-capture-options"}),t=o("button",{className:"ff-capture-option","data-capture-type":"screenshot",type:"button"},[o("div",{className:"ff-capture-icon ff-screenshot"},[d(l.camera)]),o("div",{className:"ff-capture-text"},[o("p",{className:"ff-capture-title"},["Take a Screenshot"]),o("p",{className:"ff-capture-description"},["Capture and annotate your screen"])])]),i=o("button",{className:"ff-capture-option","data-capture-type":"record",type:"button"},[o("div",{className:"ff-capture-icon ff-record"},[d(l.video)]),o("div",{className:"ff-capture-text"},[o("p",{className:"ff-capture-title"},["Record Your Screen"]),o("p",{className:"ff-capture-description"},["Record with voice narration (up to 2 min)"])])]);return e.appendChild(t),e.appendChild(i),e}setupEventListeners(){this.triggerButton?.addEventListener("click",()=>{this.open()}),this.modalOverlay?.querySelector(".ff-close-button")?.addEventListener("click",()=>{this.close()}),this.modalOverlay?.addEventListener("click",e=>{e.target===this.modalOverlay&&this.close()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&this.state.isOpen&&this.close()}),this.modalOverlay?.querySelectorAll(".ff-capture-option").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-capture-type");t&&this.startCapture(t)})})}open(){if(this.state.isOpen)return;this.state.isOpen=!0,this.modalOverlay?.classList.add("ff-visible"),this.triggerButton?.setAttribute("aria-expanded","true"),this.modalOverlay?.querySelector("button, [href], input, select, textarea")?.focus()}close(){this.state.isOpen&&(this.state.isOpen=!1,this.modalOverlay?.classList.remove("ff-visible"),this.triggerButton?.setAttribute("aria-expanded","false"),this.triggerButton?.focus())}startCapture(e){this.state.captureMode=e,this.state.isCapturing=!0,this.close();let t=new CustomEvent("ff:capture-start",{detail:{mode:e,widgetKey:this.config.widgetKey}});window.dispatchEvent(t),e==="screenshot"?this.startScreenshotCapture():e==="record"&&this.startRecordingCapture()}startScreenshotCapture(){this.screenshotUI=new w(this.config,{onConfirm:e=>{this.handleScreenshotConfirm(e)},onCancel:()=>{this.handleScreenshotCancel()}}),this.screenshotUI.start()}handleScreenshotConfirm(e){this.capturedScreenshot=e,this.state.isCapturing=!1;let t=new CustomEvent("ff:screenshot-captured",{detail:{widgetKey:this.config.widgetKey,screenshot:e}});window.dispatchEvent(t),this.screenshotUI?.destroy(),this.screenshotUI=null,this.showSubmitForm()}handleScreenshotCancel(){this.state.isCapturing=!1,this.state.captureMode=null,this.capturedScreenshot=null,this.screenshotUI?.destroy(),this.screenshotUI=null}startRecordingCapture(){this.recordUI=new k(this.config,{onConfirm:e=>{this.handleRecordingConfirm(e)},onCancel:()=>{this.handleRecordingCancel()}}),this.recordUI.start()}handleRecordingConfirm(e){this.capturedRecording=e,this.state.isCapturing=!1;let t=new CustomEvent("ff:recording-captured",{detail:{widgetKey:this.config.widgetKey,recording:{duration:e.duration,mimeType:e.mimeType,size:e.blob.size}}});window.dispatchEvent(t),this.recordUI?.destroy(),this.recordUI=null,this.showSubmitForm()}handleRecordingCancel(){this.state.isCapturing=!1,this.state.captureMode=null,this.capturedRecording=null,this.recordUI?.destroy(),this.recordUI=null}showSubmitForm(){this.submitUI=new E(this.config,{onSuccess:e=>{this.handleSubmissionSuccess(e)},onCancel:()=>{this.handleSubmissionCancel()},onError:e=>{this.handleSubmissionError(e)}},this.capturedScreenshot,this.capturedRecording),this.submitUI.show()}handleSubmissionSuccess(e){let t=new CustomEvent("ff:submission-success",{detail:{widgetKey:this.config.widgetKey,feedbackId:e}});window.dispatchEvent(t),this.cleanupAfterSubmission()}handleSubmissionCancel(){this.cleanupAfterSubmission()}handleSubmissionError(e){let t=new CustomEvent("ff:submission-error",{detail:{widgetKey:this.config.widgetKey,error:e}});window.dispatchEvent(t),this.cleanupAfterSubmission()}cleanupAfterSubmission(){this.submitUI?.destroy(),this.submitUI=null,this.capturedScreenshot=null,this.capturedRecording=null,this.state.captureMode=null}getCapturedScreenshot(){return this.capturedScreenshot}getCapturedRecording(){return this.capturedRecording}getConfig(){return{...this.config}}getState(){return{...this.state}}destroy(){this.screenshotUI?.destroy(),this.screenshotUI=null,this.recordUI?.destroy(),this.recordUI=null,this.submitUI?.destroy(),this.submitUI=null,this.root?.remove(),document.getElementById("ff-widget-styles")?.remove(),document.getElementById("ff-screenshot-styles")?.remove(),document.getElementById("ff-recording-styles")?.remove(),document.getElementById("ff-submit-styles")?.remove()}};var f=null;function ie(){let n=document.querySelectorAll("script[data-widget-key]"),e=n[n.length-1];if(!e)return null;let t=e.dataset.widgetKey;if(!t)return null;let i={widgetKey:t},r=e.dataset.position;return r&&["bottom-right","bottom-left","top-right","top-left"].includes(r)&&(i.position=r),e.dataset.primaryColor&&(i.primaryColor=e.dataset.primaryColor),e.dataset.backgroundColor&&(i.backgroundColor=e.dataset.backgroundColor),e.dataset.textColor&&(i.textColor=e.dataset.textColor),e.dataset.buttonText&&(i.buttonText=e.dataset.buttonText),e.dataset.apiUrl&&(i.apiUrl=e.dataset.apiUrl),e.dataset.privacyPolicyUrl&&(i.privacyPolicyUrl=e.dataset.privacyPolicyUrl),i}function A(){if(f)return;let n=ie();if(!(!n||!n.widgetKey))try{f=new g(n)}catch{}}var j={init(n){if(!f)try{f=new g(n)}catch{}},open(){f?.open()},close(){f?.close()},getInstance(){return f},destroy(){f?.destroy(),f=null}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",A):A();typeof window<"u"&&(window.FeedbackFlow=j);return X(oe);})();
