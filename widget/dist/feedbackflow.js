"use strict";var FeedbackFlow=(()=>{var v=Object.defineProperty;var I=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var L=Object.prototype.hasOwnProperty;var S=(i,t)=>{for(var e in t)v(i,e,{get:t[e],enumerable:!0})},B=(i,t,e,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of F(t))!L.call(i,n)&&n!==e&&v(i,n,{get:()=>t[n],enumerable:!(o=I(t,n))||o.enumerable});return i};var W=i=>B(v({},"__esModule",{value:!0}),i);var O={};S(O,{FeedbackFlow:()=>P,FeedbackFlowWidget:()=>g});var w={position:"bottom-right",primaryColor:"#1a1a1a",backgroundColor:"#F7F5F0",textColor:"#1a1a1a",buttonText:"Feedback",apiUrl:""};function N(i){switch(i){case"bottom-right":return"bottom: 20px; right: 20px;";case"bottom-left":return"bottom: 20px; left: 20px;";case"top-right":return"top: 20px; right: 20px;";case"top-left":return"top: 20px; left: 20px;";default:return"bottom: 20px; right: 20px;"}}function y(i){return`
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
      ${N(i.position)}
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: ${i.primaryColor};
      color: white;
      border: 2px solid ${i.primaryColor};
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
      background-color: ${i.backgroundColor};
      border: 2px solid ${i.primaryColor};
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
      border-bottom: 2px solid ${i.primaryColor};
      background-color: #F3C952;
    }

    .ff-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: ${i.textColor};
      margin: 0;
    }

    .ff-close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${i.textColor};
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
      border: 2px solid ${i.primaryColor};
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
      color: ${i.textColor};
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
      border-top: 2px solid ${i.primaryColor};
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
  `}var p={feedback:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  </svg>`};function r(i,t,e){let o=document.createElement(i);if(t)for(let[n,a]of Object.entries(t))n==="className"?o.className=a:o.setAttribute(n,a);if(e)for(let n of e)typeof n=="string"?o.appendChild(document.createTextNode(n)):o.appendChild(n);return o}function d(i){let t=document.createElement("template");return t.innerHTML=i.trim(),t.content.firstChild}function C(i,t){if(document.getElementById(t))return;let e=r("style",{id:t,type:"text/css"},[i]);document.head.appendChild(e)}function k(){let i=document.getElementById("ff-widget-root");if(i)return i;let t=r("div",{id:"ff-widget-root",className:"ff-widget-root"});return document.body.appendChild(t),t}var u=class{constructor(t){this.backgroundImage=null;this.isDrawing=!1;this.lastPoint=null;this.startPoint=null;this.history=[];this.historyIndex=-1;this.config={tool:"pen",color:"#E85D52",lineWidth:3};this.canvas=t;let e=t.getContext("2d");if(!e)throw new Error("Could not get canvas context");this.ctx=e,this.setupEventListeners()}setBackgroundImage(t){return new Promise((e,o)=>{let n=new Image;n.onload=()=>{this.backgroundImage=n,this.canvas.width=n.width,this.canvas.height=n.height,this.redraw(),this.saveToHistory(),e()},n.onerror=()=>o(new Error("Failed to load image")),n.src=t})}setTool(t){switch(this.config.tool=t,t){case"pen":this.config.color="#E85D52",this.config.lineWidth=3;break;case"highlighter":this.config.color="rgba(243, 201, 82, 0.4)",this.config.lineWidth=20;break;case"arrow":case"circle":this.config.color="#E85D52",this.config.lineWidth=3;break}}getTool(){return this.config.tool}setColor(t){this.config.color=t}clear(){this.redraw(),this.history=[],this.historyIndex=-1,this.saveToHistory()}undo(){if(this.historyIndex>0){this.historyIndex--;let t=this.history[this.historyIndex];this.ctx.putImageData(t,0,0)}}getDataUrl(t="image/png",e=.92){return this.canvas.toDataURL(t,e)}getBlob(t="image/png",e=.92){return new Promise((o,n)=>{this.canvas.toBlob(a=>{a?o(a):n(new Error("Failed to create blob"))},t,e)})}redraw(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.backgroundImage&&this.ctx.drawImage(this.backgroundImage,0,0)}saveToHistory(){this.history=this.history.slice(0,this.historyIndex+1);let t=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);this.history.push(t),this.historyIndex=this.history.length-1,this.history.length>50&&(this.history.shift(),this.historyIndex--)}setupEventListeners(){this.canvas.addEventListener("mousedown",this.handleStart.bind(this)),this.canvas.addEventListener("mousemove",this.handleMove.bind(this)),this.canvas.addEventListener("mouseup",this.handleEnd.bind(this)),this.canvas.addEventListener("mouseleave",this.handleEnd.bind(this)),this.canvas.addEventListener("touchstart",this.handleTouchStart.bind(this),{passive:!1}),this.canvas.addEventListener("touchmove",this.handleTouchMove.bind(this),{passive:!1}),this.canvas.addEventListener("touchend",this.handleEnd.bind(this)),this.canvas.addEventListener("touchcancel",this.handleEnd.bind(this))}getMousePoint(t){let e=this.canvas.getBoundingClientRect(),o=this.canvas.width/e.width,n=this.canvas.height/e.height;return{x:(t.clientX-e.left)*o,y:(t.clientY-e.top)*n}}getTouchPoint(t){let e=this.canvas.getBoundingClientRect(),o=t.touches[0],n=this.canvas.width/e.width,a=this.canvas.height/e.height;return{x:(o.clientX-e.left)*n,y:(o.clientY-e.top)*a}}handleStart(t){this.isDrawing=!0;let e=this.getMousePoint(t);this.lastPoint=e,this.startPoint=e,(this.config.tool==="pen"||this.config.tool==="highlighter")&&(this.ctx.beginPath(),this.ctx.moveTo(e.x,e.y))}handleTouchStart(t){t.preventDefault(),this.isDrawing=!0;let e=this.getTouchPoint(t);this.lastPoint=e,this.startPoint=e,(this.config.tool==="pen"||this.config.tool==="highlighter")&&(this.ctx.beginPath(),this.ctx.moveTo(e.x,e.y))}handleMove(t){if(!this.isDrawing||!this.lastPoint)return;let e=this.getMousePoint(t);this.config.tool==="pen"||this.config.tool==="highlighter"?(this.drawLine(this.lastPoint,e),this.lastPoint=e):this.startPoint&&(this.restoreFromHistory(),this.drawShape(this.startPoint,e))}handleTouchMove(t){if(t.preventDefault(),!this.isDrawing||!this.lastPoint)return;let e=this.getTouchPoint(t);this.config.tool==="pen"||this.config.tool==="highlighter"?(this.drawLine(this.lastPoint,e),this.lastPoint=e):this.startPoint&&(this.restoreFromHistory(),this.drawShape(this.startPoint,e))}handleEnd(){this.isDrawing&&(this.isDrawing=!1,(this.config.tool==="arrow"||this.config.tool==="circle")&&this.startPoint&&this.lastPoint,this.saveToHistory(),this.lastPoint=null,this.startPoint=null)}drawLine(t,e){this.ctx.strokeStyle=this.config.color,this.ctx.lineWidth=this.config.lineWidth,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.config.tool==="highlighter"?this.ctx.globalCompositeOperation="multiply":this.ctx.globalCompositeOperation="source-over",this.ctx.lineTo(e.x,e.y),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(e.x,e.y)}drawShape(t,e){this.ctx.strokeStyle=this.config.color,this.ctx.lineWidth=this.config.lineWidth,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.ctx.globalCompositeOperation="source-over",this.config.tool==="arrow"?this.drawArrow(t,e):this.config.tool==="circle"&&this.drawCircle(t,e)}drawArrow(t,e){let n=Math.atan2(e.y-t.y,e.x-t.x);this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y),this.ctx.lineTo(e.x,e.y),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(e.x,e.y),this.ctx.lineTo(e.x-15*Math.cos(n-Math.PI/6),e.y-15*Math.sin(n-Math.PI/6)),this.ctx.moveTo(e.x,e.y),this.ctx.lineTo(e.x-15*Math.cos(n+Math.PI/6),e.y-15*Math.sin(n+Math.PI/6)),this.ctx.stroke()}drawCircle(t,e){let o=(t.x+e.x)/2,n=(t.y+e.y)/2,a=Math.abs(e.x-t.x)/2,s=Math.abs(e.y-t.y)/2;this.ctx.beginPath(),this.ctx.ellipse(o,n,a,s,0,0,2*Math.PI),this.ctx.stroke()}restoreFromHistory(){if(this.historyIndex>=0){let t=this.history[this.historyIndex];this.ctx.putImageData(t,0,0)}}destroy(){this.history=[],this.backgroundImage=null}};async function x(){let i=document.getElementById("ff-widget-root");i&&(i.style.display="none");try{return"mediaDevices"in navigator&&"getDisplayMedia"in navigator.mediaDevices?await U():await H()}finally{i&&(i.style.display="")}}async function U(){let i=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"browser"},audio:!1});try{let t=document.createElement("video");t.srcObject=i,t.muted=!0,await new Promise(s=>{t.onloadedmetadata=()=>{t.play(),s()}}),await new Promise(s=>requestAnimationFrame(s));let e=document.createElement("canvas");e.width=t.videoWidth,e.height=t.videoHeight;let o=e.getContext("2d");if(!o)throw new Error("Could not get canvas context");o.drawImage(t,0,0);let n=await new Promise((s,c)=>{e.toBlob(l=>{l?s(l):c(new Error("Failed to create blob"))},"image/png",.92)});return{dataUrl:e.toDataURL("image/png",.92),width:e.width,height:e.height,blob:n}}finally{i.getTracks().forEach(t=>t.stop())}}async function H(){let i=document.createElement("canvas"),t=window.innerWidth,e=window.innerHeight;i.width=t,i.height=e;let o=i.getContext("2d");if(!o)throw new Error("Could not get canvas context");o.fillStyle="#ffffff",o.fillRect(0,0,t,e),o.fillStyle="#666666",o.font="16px sans-serif",o.textAlign="center",o.fillText("Screenshot capture requires screen sharing permission",t/2,e/2);let n=i.toDataURL("image/png"),a=await new Promise((s,c)=>{i.toBlob(l=>{l?s(l):c(new Error("Failed to create blob"))},"image/png")});return{dataUrl:n,width:t,height:e,blob:a}}function E(i,t=1920,e=.85){return new Promise((o,n)=>{let a=new Image;a.onload=()=>{let s=a.width,c=a.height;s>t&&(c=Math.round(c*t/s),s=t);let l=document.createElement("canvas");l.width=s,l.height=c;let f=l.getContext("2d");if(!f){n(new Error("Could not get canvas context"));return}f.drawImage(a,0,0,s,c);let M=l.toDataURL("image/jpeg",e);l.toBlob(b=>{b?o({dataUrl:M,width:s,height:c,blob:b}):n(new Error("Failed to create blob"))},"image/jpeg",e)},a.onerror=()=>n(new Error("Failed to load image")),a.src=i})}var m=class{constructor(t,e){this.container=null;this.canvas=null;this.annotationCanvas=null;this.currentTool="pen";this.capturedImage=null;this.config=t,this.callbacks=e}async start(){try{this.capturedImage=await x(),this.showPreviewUI()}catch(t){console.error("FeedbackFlow: Screenshot capture failed",t),this.callbacks.onCancel()}}showPreviewUI(){if(!this.capturedImage)return;this.container=r("div",{className:"ff-screenshot-overlay"});let t=this.createUI();this.container.appendChild(t),document.body.appendChild(this.container),this.setupCanvas(),this.injectStyles()}createUI(){let t=r("div",{className:"ff-screenshot-wrapper"}),e=r("div",{className:"ff-screenshot-header"},[r("h3",{className:"ff-screenshot-title"},["Annotate Screenshot"]),this.createCloseButton()]),o=r("div",{className:"ff-screenshot-canvas-container"});this.canvas=r("canvas",{className:"ff-screenshot-canvas"}),o.appendChild(this.canvas);let n=this.createToolbar(),a=this.createActions();return t.appendChild(e),t.appendChild(n),t.appendChild(o),t.appendChild(a),t}createCloseButton(){let t=r("button",{className:"ff-screenshot-close",type:"button","aria-label":"Cancel"},[d(p.close)]);return t.addEventListener("click",()=>this.cancel()),t}createToolbar(){let t=r("div",{className:"ff-screenshot-toolbar"});[{tool:"pen",icon:"pen",label:"Pen"},{tool:"highlighter",icon:"highlighter",label:"Highlighter"},{tool:"arrow",icon:"arrow",label:"Arrow"},{tool:"circle",icon:"circle",label:"Circle"}].forEach(({tool:a,icon:s,label:c})=>{let l=r("button",{className:`ff-tool-button ${a===this.currentTool?"ff-active":""}`,type:"button","data-tool":a,title:c},[d(this.getToolIcon(s))]);l.addEventListener("click",()=>{this.setTool(a),t.querySelectorAll(".ff-tool-button").forEach(f=>{f.classList.remove("ff-active")}),l.classList.add("ff-active")}),t.appendChild(l)}),t.appendChild(r("div",{className:"ff-toolbar-separator"}));let o=r("button",{className:"ff-tool-button",type:"button",title:"Undo"},[d(this.getToolIcon("undo"))]);o.addEventListener("click",()=>this.annotationCanvas?.undo()),t.appendChild(o);let n=r("button",{className:"ff-tool-button",type:"button",title:"Clear all"},[d(this.getToolIcon("clear"))]);return n.addEventListener("click",()=>this.annotationCanvas?.clear()),t.appendChild(n),t}createActions(){let t=r("div",{className:"ff-screenshot-actions"}),e=r("button",{className:"ff-screenshot-btn ff-btn-secondary",type:"button"},["Retake"]);e.addEventListener("click",()=>this.retake());let o=r("button",{className:"ff-screenshot-btn ff-btn-primary",type:"button"},["Use Screenshot"]);return o.addEventListener("click",()=>this.confirm()),t.appendChild(e),t.appendChild(o),t}getToolIcon(t){return{pen:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      </svg>`}[t]||""}async setupCanvas(){!this.canvas||!this.capturedImage||(this.annotationCanvas=new u(this.canvas),await this.annotationCanvas.setBackgroundImage(this.capturedImage.dataUrl),this.annotationCanvas.setTool(this.currentTool))}setTool(t){this.currentTool=t,this.annotationCanvas?.setTool(t)}async retake(){this.destroy();try{this.capturedImage=await x(),this.showPreviewUI()}catch(t){console.error("FeedbackFlow: Screenshot retake failed",t),this.callbacks.onCancel()}}async confirm(){if(this.annotationCanvas)try{let t=this.annotationCanvas.getDataUrl("image/png"),e=await this.annotationCanvas.getBlob("image/png"),o=await E(t,1920,.85);this.destroy(),this.callbacks.onConfirm(o)}catch(t){console.error("FeedbackFlow: Failed to process screenshot",t),this.callbacks.onCancel()}}cancel(){this.destroy(),this.callbacks.onCancel()}injectStyles(){let t="ff-screenshot-styles";if(document.getElementById(t))return;let e=`
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
    `,o=document.createElement("style");o.id=t,o.textContent=e,document.head.appendChild(o)}destroy(){this.annotationCanvas?.destroy(),this.annotationCanvas=null,this.container?.remove(),this.container=null,this.canvas=null,this.capturedImage=null}};var g=class{constructor(t){this.root=null;this.triggerButton=null;this.modalOverlay=null;this.screenshotUI=null;this.capturedScreenshot=null;this.config={...w,...t},this.state={isOpen:!1,isCapturing:!1,captureMode:null},this.init()}init(){C(y(this.config),"ff-widget-styles"),this.root=k(),this.createTriggerButton(),this.createModal(),this.setupEventListeners()}createTriggerButton(){this.triggerButton=r("button",{className:"ff-trigger-button","aria-label":"Open feedback widget",type:"button"},[d(p.feedback),this.config.buttonText]),this.root?.appendChild(this.triggerButton)}createModal(){this.modalOverlay=r("div",{className:"ff-modal-overlay",role:"dialog","aria-modal":"true","aria-labelledby":"ff-modal-title"});let t=r("div",{className:"ff-modal"}),e=r("div",{className:"ff-modal-header"},[r("h2",{className:"ff-modal-title",id:"ff-modal-title"},["Share Feedback"]),this.createCloseButton()]),o=r("div",{className:"ff-modal-content"},[this.createCaptureOptions()]),n=r("div",{className:"ff-modal-footer"},[r("div",{className:"ff-powered-by"},["Powered by ",r("a",{href:"https://feedbackflow.dev",target:"_blank"},["FeedbackFlow"])])]);t.appendChild(e),t.appendChild(o),t.appendChild(n),this.modalOverlay.appendChild(t),this.root?.appendChild(this.modalOverlay)}createCloseButton(){return r("button",{className:"ff-close-button","aria-label":"Close feedback widget",type:"button"},[d(p.close)])}createCaptureOptions(){let t=r("div",{className:"ff-capture-options"}),e=r("button",{className:"ff-capture-option","data-capture-type":"screenshot",type:"button"},[r("div",{className:"ff-capture-icon ff-screenshot"},[d(p.camera)]),r("div",{className:"ff-capture-text"},[r("p",{className:"ff-capture-title"},["Take a Screenshot"]),r("p",{className:"ff-capture-description"},["Capture and annotate your screen"])])]),o=r("button",{className:"ff-capture-option","data-capture-type":"record",type:"button"},[r("div",{className:"ff-capture-icon ff-record"},[d(p.video)]),r("div",{className:"ff-capture-text"},[r("p",{className:"ff-capture-title"},["Record Your Screen"]),r("p",{className:"ff-capture-description"},["Record with voice narration (up to 2 min)"])])]);return t.appendChild(e),t.appendChild(o),t}setupEventListeners(){this.triggerButton?.addEventListener("click",()=>{this.open()}),this.modalOverlay?.querySelector(".ff-close-button")?.addEventListener("click",()=>{this.close()}),this.modalOverlay?.addEventListener("click",t=>{t.target===this.modalOverlay&&this.close()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&this.state.isOpen&&this.close()}),this.modalOverlay?.querySelectorAll(".ff-capture-option").forEach(t=>{t.addEventListener("click",()=>{let e=t.getAttribute("data-capture-type");e&&this.startCapture(e)})})}open(){if(this.state.isOpen)return;this.state.isOpen=!0,this.modalOverlay?.classList.add("ff-visible"),this.triggerButton?.setAttribute("aria-expanded","true"),this.modalOverlay?.querySelector("button, [href], input, select, textarea")?.focus()}close(){this.state.isOpen&&(this.state.isOpen=!1,this.modalOverlay?.classList.remove("ff-visible"),this.triggerButton?.setAttribute("aria-expanded","false"),this.triggerButton?.focus())}startCapture(t){this.state.captureMode=t,this.state.isCapturing=!0,this.close();let e=new CustomEvent("ff:capture-start",{detail:{mode:t,widgetKey:this.config.widgetKey}});window.dispatchEvent(e),t==="screenshot"?this.startScreenshotCapture():t==="record"&&(console.log("FeedbackFlow: Screen recording - coming soon"),this.state.isCapturing=!1,this.state.captureMode=null)}startScreenshotCapture(){this.screenshotUI=new m(this.config,{onConfirm:t=>{this.handleScreenshotConfirm(t)},onCancel:()=>{this.handleScreenshotCancel()}}),this.screenshotUI.start()}handleScreenshotConfirm(t){this.capturedScreenshot=t,this.state.isCapturing=!1;let e=new CustomEvent("ff:screenshot-captured",{detail:{widgetKey:this.config.widgetKey,screenshot:t}});window.dispatchEvent(e),console.log("FeedbackFlow: Screenshot captured",{width:t.width,height:t.height,size:t.blob?`${(t.blob.size/1024).toFixed(2)}KB`:"unknown"}),this.screenshotUI?.destroy(),this.screenshotUI=null}handleScreenshotCancel(){this.state.isCapturing=!1,this.state.captureMode=null,this.capturedScreenshot=null,this.screenshotUI?.destroy(),this.screenshotUI=null}getCapturedScreenshot(){return this.capturedScreenshot}getConfig(){return{...this.config}}getState(){return{...this.state}}destroy(){this.screenshotUI?.destroy(),this.screenshotUI=null,this.root?.remove(),document.getElementById("ff-widget-styles")?.remove(),document.getElementById("ff-screenshot-styles")?.remove()}};var h=null;function D(){let i=document.querySelectorAll("script[data-widget-key]"),t=i[i.length-1];if(!t)return console.error("FeedbackFlow: No script tag with data-widget-key found"),null;let e=t.dataset.widgetKey;if(!e)return console.error("FeedbackFlow: data-widget-key is required"),null;let o={widgetKey:e},n=t.dataset.position;return n&&["bottom-right","bottom-left","top-right","top-left"].includes(n)&&(o.position=n),t.dataset.primaryColor&&(o.primaryColor=t.dataset.primaryColor),t.dataset.backgroundColor&&(o.backgroundColor=t.dataset.backgroundColor),t.dataset.textColor&&(o.textColor=t.dataset.textColor),t.dataset.buttonText&&(o.buttonText=t.dataset.buttonText),t.dataset.apiUrl&&(o.apiUrl=t.dataset.apiUrl),o}function T(){if(h){console.warn("FeedbackFlow: Widget already initialized");return}let i=D();if(!(!i||!i.widgetKey))try{h=new g(i),console.log("FeedbackFlow: Widget initialized")}catch(t){console.error("FeedbackFlow: Failed to initialize widget",t)}}var P={init(i){if(h){console.warn("FeedbackFlow: Widget already initialized");return}try{h=new g(i)}catch(t){console.error("FeedbackFlow: Failed to initialize widget",t)}},open(){h?.open()},close(){h?.close()},getInstance(){return h},destroy(){h?.destroy(),h=null}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",T):T();typeof window<"u"&&(window.FeedbackFlow=P);return W(O);})();
