"use strict";var FeedbackFlow=(()=>{var U=Object.defineProperty;var he=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var ge=Object.prototype.hasOwnProperty;var me=(o,e)=>{for(var t in e)U(o,t,{get:e[t],enumerable:!0})},be=(o,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of ue(e))!ge.call(o,r)&&r!==t&&U(o,r,{get:()=>e[r],enumerable:!(i=he(e,r))||i.enumerable});return o};var ve=o=>be(U({},"__esModule",{value:!0}),o);var Be={};me(Be,{FeedbackFlow:()=>pe,FeedbackFlowWidget:()=>w});var C={position:"bottom-right",primaryColor:"#1a1a1a",backgroundColor:"#F7F5F0",textColor:"#1a1a1a",buttonText:"Feedback",apiUrl:""};function xe(o){switch(o){case"bottom-right":return"bottom: 20px; right: 20px;";case"bottom-left":return"bottom: 20px; left: 20px;";case"top-right":return"top: 20px; right: 20px;";case"top-left":return"top: 20px; left: 20px;";default:return"bottom: 20px; right: 20px;"}}function ye(o){let e=o.includes("bottom"),t=o.includes("right");return`
    .ff-button-container {
      transform: ${e?"translateY(60px)":"translateY(-60px)"};
    }

    .ff-button-container.ff-hover-peek {
      transform: translateY(0);
    }
  `}function O(o){let e=xe(o.position),t=ye(o.position);return`
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

    /* Button Container */
    .ff-button-container {
      position: fixed;
      ${e}
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .ff-button-container.ff-minimized {
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }

    /* Hover peek effect - slides up when mouse is near */
    ${t}

    /* Floating Button */
    .ff-trigger-button {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: ${o.primaryColor};
      color: white;
      border: 2px solid ${o.primaryColor};
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

    .ff-trigger-button > svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Minimize Button (inside trigger button) */
    .ff-minimize-button {
      position: absolute;
      top: -6px;
      right: -6px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      border: 2px solid ${o.primaryColor};
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.15s ease;
      z-index: 1;
    }

    .ff-minimize-button:hover {
      background-color: rgba(0, 0, 0, 1);
      transform: scale(1.1);
    }

    .ff-minimize-button svg {
      width: 10px;
      height: 10px;
    }

    /* Corner Indicators */
    .ff-corner-indicator {
      position: fixed;
      width: 40px;
      height: 40px;
      background-color: transparent;
      cursor: pointer;
      z-index: 2147483645;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, background-color 0.15s ease;
    }

    .ff-corner-indicator.ff-visible {
      opacity: 1;
      pointer-events: auto;
    }

    .ff-corner-indicator:hover {
      background-color: rgba(243, 201, 82, 0.1);
    }

    .ff-corner-indicator:active {
      background-color: rgba(243, 201, 82, 0.2);
    }

    .ff-corner-indicator.ff-corner-top-left {
      top: 0;
      left: 0;
      border-bottom-right-radius: 8px;
    }

    .ff-corner-indicator.ff-corner-top-right {
      top: 0;
      right: 0;
      border-bottom-left-radius: 8px;
    }

    .ff-corner-indicator.ff-corner-bottom-left {
      bottom: 0;
      left: 0;
      border-top-right-radius: 8px;
    }

    .ff-corner-indicator.ff-corner-bottom-right {
      bottom: 0;
      right: 0;
      border-top-left-radius: 8px;
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
      background-color: ${o.backgroundColor};
      border: 2px solid ${o.primaryColor};
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
      border-bottom: 2px solid ${o.primaryColor};
      background-color: #F3C952;
    }

    .ff-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: ${o.textColor};
      margin: 0;
    }

    .ff-close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${o.textColor};
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
      border: 2px solid ${o.primaryColor};
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

    /* Disabled state for unsupported options (e.g., recording on mobile) */
    .ff-capture-option-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    }

    .ff-capture-option-disabled:hover {
      transform: none;
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    }

    .ff-capture-option-disabled:active {
      transform: none;
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
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
      color: ${o.textColor};
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
      border-top: 2px solid ${o.primaryColor};
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

    /* Mobile-specific styles */
    @media (max-width: 480px) {
      .ff-button-container {
        flex-direction: column;
        gap: 2px;
      }

      .ff-trigger-button {
        padding: 10px 16px;
        font-size: 13px;
      }

      .ff-minimize-button {
        width: 18px;
        height: 18px;
        top: -5px;
        right: -5px;
      }

      .ff-minimize-button svg {
        width: 9px;
        height: 9px;
      }

      .ff-modal {
        width: 95%;
        max-width: none;
        margin: 10px;
      }

      .ff-modal-header {
        padding: 14px 16px;
      }

      .ff-modal-content {
        padding: 16px;
      }

      .ff-capture-option {
        padding: 14px;
        gap: 12px;
      }

      .ff-capture-icon {
        width: 40px;
        height: 40px;
      }

      .ff-capture-icon svg {
        width: 20px;
        height: 20px;
      }

      .ff-capture-title {
        font-size: 14px;
      }

      .ff-capture-description {
        font-size: 12px;
      }
    }

    /* Touch-friendly tap targets */
    @media (pointer: coarse) {
      .ff-capture-option {
        min-height: 70px;
      }

      .ff-close-button {
        padding: 8px;
        margin: -4px;
      }

      .ff-trigger-button {
        min-height: 48px;
      }
    }
  `}function n(o,e,t){let i=document.createElement(o);if(e)for(let[r,s]of Object.entries(e))r==="className"?i.className=s:i.setAttribute(r,s);if(t)for(let r of t)typeof r=="string"?i.appendChild(document.createTextNode(r)):i.appendChild(r);return i}function l(o){let e=document.createElement("template");return e.innerHTML=o.trim(),e.content.firstChild}function A(o,e){if(document.getElementById(e))return;let t=n("style",{id:e,type:"text/css"},[o]);document.head.appendChild(t)}function W(){let o=document.getElementById("ff-widget-root");if(o)return o;let e=n("div",{id:"ff-widget-root",className:"ff-widget-root"});return document.body.appendChild(e),e}var d={feedback:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  </svg>`,warning:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>`,info:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 16v-4"></path>
    <path d="M12 8h.01"></path>
  </svg>`,minimize:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
    <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
    <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
    <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
  </svg>`};var k=class{constructor(e){this.backgroundImage=null;this.isDrawing=!1;this.lastPoint=null;this.startPoint=null;this.history=[];this.historyIndex=-1;this.config={tool:"pen",color:"#E85D52",lineWidth:3};this.canvas=e;let t=e.getContext("2d");if(!t)throw new Error("Could not get canvas context");this.ctx=t,this.setupEventListeners()}setBackgroundImage(e){return new Promise((t,i)=>{let r=new Image;r.onload=()=>{this.backgroundImage=r,this.canvas.width=r.width,this.canvas.height=r.height,this.redraw(),this.saveToHistory(),t()},r.onerror=()=>i(new Error("Failed to load image")),r.src=e})}setTool(e){switch(this.config.tool=e,e){case"pen":this.config.color="#E85D52",this.config.lineWidth=3;break;case"highlighter":this.config.color="rgba(243, 201, 82, 0.4)",this.config.lineWidth=20;break;case"arrow":case"circle":this.config.color="#E85D52",this.config.lineWidth=3;break}}getTool(){return this.config.tool}setColor(e){this.config.color=e}clear(){this.redraw(),this.history=[],this.historyIndex=-1,this.saveToHistory()}undo(){if(this.historyIndex>0){this.historyIndex--;let e=this.history[this.historyIndex];this.ctx.putImageData(e,0,0)}}getDataUrl(e="image/png",t=.92){return this.canvas.toDataURL(e,t)}getBlob(e="image/png",t=.92){return new Promise((i,r)=>{this.canvas.toBlob(s=>{s?i(s):r(new Error("Failed to create blob"))},e,t)})}redraw(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.backgroundImage&&this.ctx.drawImage(this.backgroundImage,0,0)}saveToHistory(){this.history=this.history.slice(0,this.historyIndex+1);let e=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);this.history.push(e),this.historyIndex=this.history.length-1,this.history.length>50&&(this.history.shift(),this.historyIndex--)}setupEventListeners(){this.canvas.addEventListener("mousedown",this.handleStart.bind(this)),this.canvas.addEventListener("mousemove",this.handleMove.bind(this)),this.canvas.addEventListener("mouseup",this.handleEnd.bind(this)),this.canvas.addEventListener("mouseleave",this.handleEnd.bind(this)),this.canvas.addEventListener("touchstart",this.handleTouchStart.bind(this),{passive:!1}),this.canvas.addEventListener("touchmove",this.handleTouchMove.bind(this),{passive:!1}),this.canvas.addEventListener("touchend",this.handleEnd.bind(this)),this.canvas.addEventListener("touchcancel",this.handleEnd.bind(this))}getMousePoint(e){let t=this.canvas.getBoundingClientRect(),i=this.canvas.width/t.width,r=this.canvas.height/t.height;return{x:(e.clientX-t.left)*i,y:(e.clientY-t.top)*r}}getTouchPoint(e){let t=this.canvas.getBoundingClientRect(),i=e.touches[0],r=this.canvas.width/t.width,s=this.canvas.height/t.height;return{x:(i.clientX-t.left)*r,y:(i.clientY-t.top)*s}}handleStart(e){this.isDrawing=!0;let t=this.getMousePoint(e);this.lastPoint=t,this.startPoint=t,(this.config.tool==="pen"||this.config.tool==="highlighter")&&(this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y))}handleTouchStart(e){e.preventDefault(),this.isDrawing=!0;let t=this.getTouchPoint(e);this.lastPoint=t,this.startPoint=t,(this.config.tool==="pen"||this.config.tool==="highlighter")&&(this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y))}handleMove(e){if(!this.isDrawing||!this.lastPoint)return;let t=this.getMousePoint(e);this.config.tool==="pen"||this.config.tool==="highlighter"?(this.drawLine(this.lastPoint,t),this.lastPoint=t):this.startPoint&&(this.restoreFromHistory(),this.drawShape(this.startPoint,t))}handleTouchMove(e){if(e.preventDefault(),!this.isDrawing||!this.lastPoint)return;let t=this.getTouchPoint(e);this.config.tool==="pen"||this.config.tool==="highlighter"?(this.drawLine(this.lastPoint,t),this.lastPoint=t):this.startPoint&&(this.restoreFromHistory(),this.drawShape(this.startPoint,t))}handleEnd(){this.isDrawing&&(this.isDrawing=!1,(this.config.tool==="arrow"||this.config.tool==="circle")&&this.startPoint&&this.lastPoint,this.saveToHistory(),this.lastPoint=null,this.startPoint=null)}drawLine(e,t){this.ctx.strokeStyle=this.config.color,this.ctx.lineWidth=this.config.lineWidth,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.config.tool==="highlighter"?this.ctx.globalCompositeOperation="multiply":this.ctx.globalCompositeOperation="source-over",this.ctx.lineTo(t.x,t.y),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y)}drawShape(e,t){this.ctx.strokeStyle=this.config.color,this.ctx.lineWidth=this.config.lineWidth,this.ctx.lineCap="round",this.ctx.lineJoin="round",this.ctx.globalCompositeOperation="source-over",this.config.tool==="arrow"?this.drawArrow(e,t):this.config.tool==="circle"&&this.drawCircle(e,t)}drawArrow(e,t){let r=Math.atan2(t.y-e.y,t.x-e.x);this.ctx.beginPath(),this.ctx.moveTo(e.x,e.y),this.ctx.lineTo(t.x,t.y),this.ctx.stroke(),this.ctx.beginPath(),this.ctx.moveTo(t.x,t.y),this.ctx.lineTo(t.x-15*Math.cos(r-Math.PI/6),t.y-15*Math.sin(r-Math.PI/6)),this.ctx.moveTo(t.x,t.y),this.ctx.lineTo(t.x-15*Math.cos(r+Math.PI/6),t.y-15*Math.sin(r+Math.PI/6)),this.ctx.stroke()}drawCircle(e,t){let i=(e.x+t.x)/2,r=(e.y+t.y)/2,s=Math.abs(t.x-e.x)/2,a=Math.abs(t.y-e.y)/2;this.ctx.beginPath(),this.ctx.ellipse(i,r,s,a,0,0,2*Math.PI),this.ctx.stroke()}restoreFromHistory(){if(this.historyIndex>=0){let e=this.history[this.historyIndex];this.ctx.putImageData(e,0,0)}}destroy(){this.history=[],this.backgroundImage=null}};function u(){let o="ontouchstart"in window||navigator.maxTouchPoints>0,e=window.innerWidth<=768,i=[/Android/i,/webOS/i,/iPhone/i,/iPad/i,/iPod/i,/BlackBerry/i,/Windows Phone/i,/Opera Mini/i,/IEMobile/i,/Mobile/i].some(r=>r.test(navigator.userAgent));return o&&e||i}function D(){return typeof navigator<"u"&&"mediaDevices"in navigator&&"getDisplayMedia"in navigator.mediaDevices}function E(){return D()&&typeof MediaRecorder<"u"&&!u()}function B(){return D()&&!u()}async function j(){let o=document.getElementById("ff-widget-root");o&&(o.style.display="none");try{if(B())return await we();throw new Error("MOBILE_DEVICE")}finally{o&&(o.style.display="")}}async function we(){let o=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"browser"},audio:!1});try{let e=document.createElement("video");e.srcObject=o,e.muted=!0,await new Promise(a=>{e.onloadedmetadata=()=>{e.play(),a()}}),await new Promise(a=>requestAnimationFrame(a));let t=document.createElement("canvas");t.width=e.videoWidth,t.height=e.videoHeight;let i=t.getContext("2d");if(!i)throw new Error("Could not get canvas context");i.drawImage(e,0,0);let r=await new Promise((a,p)=>{t.toBlob(f=>{f?a(f):p(new Error("Failed to create blob"))},"image/png",.92)});return{dataUrl:t.toDataURL("image/png",.92),width:t.width,height:t.height,blob:r,source:"screen-capture"}}finally{o.getTracks().forEach(e=>e.stop())}}async function K(o){return new Promise((e,t)=>{if(!o.type.startsWith("image/")){t(new Error("Please select an image file"));return}let i=new FileReader;i.onload=()=>{let r=i.result,s=new Image;s.onload=()=>{e({dataUrl:r,width:s.width,height:s.height,blob:o,source:"file-upload"})},s.onerror=()=>t(new Error("Failed to load image")),s.src=r},i.onerror=()=>t(new Error("Failed to read file")),i.readAsDataURL(o)})}function Q(){return new Promise((o,e)=>{let t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=()=>{let r=t.files?.[0];r?o(r):e(new Error("No file selected"))},t.oncancel=()=>{e(new Error("File selection cancelled"))};let i=()=>{setTimeout(()=>{t.files?.length||e(new Error("File selection cancelled")),window.removeEventListener("focus",i)},300)};window.addEventListener("focus",i),t.click()})}function _(o,e=1920,t=.85){return new Promise((i,r)=>{let s=new Image;s.onload=()=>{let a=s.width,p=s.height;a>e&&(p=Math.round(p*e/a),a=e);let f=document.createElement("canvas");f.width=a,f.height=p;let h=f.getContext("2d");if(!h){r(new Error("Could not get canvas context"));return}h.drawImage(s,0,0,a,p);let m=f.toDataURL("image/jpeg",t);f.toBlob(v=>{v?i({dataUrl:m,width:a,height:p,blob:v}):r(new Error("Failed to create blob"))},"image/jpeg",t)},s.onerror=()=>r(new Error("Failed to load image")),s.src=o})}var c={log(...o){},warn(...o){},error(...o){}};var S=class{constructor(e,t){this.container=null;this.canvas=null;this.annotationCanvas=null;this.currentTool="pen";this.capturedImage=null;this.config=e,this.callbacks=t}async start(){try{if(u()||!B()){await this.startMobileCapture();return}this.capturedImage=await j(),this.showPreviewUI()}catch(e){if((e instanceof Error?e.message:"Unknown error")==="MOBILE_DEVICE"){await this.startMobileCapture();return}c.error("Screenshot capture failed",e),this.callbacks.onCancel()}}async startMobileCapture(){try{let e=await Q();this.capturedImage=await K(e),this.showPreviewUI()}catch(e){let t=e instanceof Error?e.message:"";t.includes("cancelled")||t.includes("canceled")?c.log("Screenshot selection cancelled"):c.error("Mobile screenshot capture failed",e),this.callbacks.onCancel()}}showPreviewUI(){if(!this.capturedImage)return;this.container=n("div",{className:"ff-screenshot-overlay"});let e=this.createUI();this.container.appendChild(e),document.body.appendChild(this.container),this.setupCanvas(),this.injectStyles()}createUI(){let e=n("div",{className:"ff-screenshot-wrapper"}),t=n("div",{className:"ff-screenshot-header"},[n("h3",{className:"ff-screenshot-title"},["Annotate Screenshot"]),this.createCloseButton()]),i=n("div",{className:"ff-screenshot-canvas-container"});this.canvas=n("canvas",{className:"ff-screenshot-canvas"}),i.appendChild(this.canvas);let r=this.createToolbar(),s=this.createActions();return e.appendChild(t),e.appendChild(r),e.appendChild(i),e.appendChild(s),e}createCloseButton(){let e=n("button",{className:"ff-screenshot-close",type:"button","aria-label":"Cancel"},[l(d.close)]);return e.addEventListener("click",()=>this.cancel()),e}createToolbar(){let e=n("div",{className:"ff-screenshot-toolbar"});[{tool:"pen",icon:"pen",label:"Pen"},{tool:"highlighter",icon:"highlighter",label:"Highlighter"},{tool:"arrow",icon:"arrow",label:"Arrow"},{tool:"circle",icon:"circle",label:"Circle"}].forEach(({tool:s,icon:a,label:p})=>{let f=n("button",{className:`ff-tool-button ${s===this.currentTool?"ff-active":""}`,type:"button","data-tool":s,title:p},[l(this.getToolIcon(a))]);f.addEventListener("click",()=>{this.setTool(s),e.querySelectorAll(".ff-tool-button").forEach(h=>{h.classList.remove("ff-active")}),f.classList.add("ff-active")}),e.appendChild(f)}),e.appendChild(n("div",{className:"ff-toolbar-separator"}));let i=n("button",{className:"ff-tool-button",type:"button",title:"Undo"},[l(this.getToolIcon("undo"))]);i.addEventListener("click",()=>this.annotationCanvas?.undo()),e.appendChild(i);let r=n("button",{className:"ff-tool-button",type:"button",title:"Clear all"},[l(this.getToolIcon("clear"))]);return r.addEventListener("click",()=>this.annotationCanvas?.clear()),e.appendChild(r),e}createActions(){let e=n("div",{className:"ff-screenshot-actions"}),t=n("button",{className:"ff-screenshot-btn ff-btn-secondary",type:"button"},["Retake"]);t.addEventListener("click",()=>this.retake());let i=n("button",{className:"ff-screenshot-btn ff-btn-primary",type:"button"},["Use Screenshot"]);return i.addEventListener("click",()=>this.confirm()),e.appendChild(t),e.appendChild(i),e}getToolIcon(e){return{pen:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      </svg>`}[e]||""}async setupCanvas(){!this.canvas||!this.capturedImage||(this.annotationCanvas=new k(this.canvas),await this.annotationCanvas.setBackgroundImage(this.capturedImage.dataUrl),this.annotationCanvas.setTool(this.currentTool))}setTool(e){this.currentTool=e,this.annotationCanvas?.setTool(e)}async retake(){this.destroy(),await this.start()}async confirm(){if(this.annotationCanvas)try{let e=this.annotationCanvas.getDataUrl("image/png"),t=await this.annotationCanvas.getBlob("image/png"),i=await _(e,1920,.85);this.destroy(),this.callbacks.onConfirm(i)}catch(e){c.error("Failed to process screenshot",e),this.callbacks.onCancel()}}cancel(){this.destroy(),this.callbacks.onCancel()}injectStyles(){let e="ff-screenshot-styles";if(document.getElementById(e))return;let t=`
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

      /* Mobile responsive styles */
      @media (max-width: 600px) {
        .ff-screenshot-wrapper {
          max-width: 100%;
          max-height: 100%;
          width: 100%;
          height: 100%;
          border: none;
          box-shadow: none;
        }

        .ff-screenshot-header {
          padding: 10px 12px;
        }

        .ff-screenshot-title {
          font-size: 14px;
        }

        .ff-screenshot-toolbar {
          padding: 6px 12px;
          gap: 2px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .ff-tool-button {
          padding: 10px;
          min-width: 44px;
          min-height: 44px;
        }

        .ff-screenshot-canvas-container {
          padding: 8px;
          min-height: 150px;
        }

        .ff-screenshot-canvas {
          max-height: 50vh;
        }

        .ff-screenshot-actions {
          padding: 10px 12px;
          gap: 8px;
        }

        .ff-screenshot-btn {
          padding: 12px 16px;
          flex: 1;
          text-align: center;
        }
      }

      /* Touch-friendly targets */
      @media (pointer: coarse) {
        .ff-tool-button {
          min-width: 48px;
          min-height: 48px;
        }

        .ff-screenshot-close {
          padding: 8px;
          margin: -4px;
        }
      }
    `,i=document.createElement("style");i.id=e,i.textContent=t,document.head.appendChild(i)}destroy(){this.annotationCanvas?.destroy(),this.annotationCanvas=null,this.container?.remove(),this.container=null,this.canvas=null,this.capturedImage=null}};var q=120*1e3,Ce=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"],x=class{constructor(e){this.mediaRecorder=null;this.screenStream=null;this.audioStream=null;this.combinedStream=null;this.chunks=[];this.startTime=0;this.timerInterval=null;this.mimeType="video/webm";this.callbacks=e}static isSupported(){return typeof navigator<"u"&&"mediaDevices"in navigator&&"getDisplayMedia"in navigator.mediaDevices&&typeof MediaRecorder<"u"}getSupportedMimeType(){for(let e of Ce)if(MediaRecorder.isTypeSupported(e))return e;return"video/webm"}async start(){if(this.mediaRecorder?.state==="recording")throw new Error("Recording already in progress");try{this.screenStream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:"browser",cursor:"always"},audio:!1});try{this.audioStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0},video:!1})}catch{c.log("Microphone not available, recording without audio")}let e=[...this.screenStream.getVideoTracks(),...this.audioStream?.getAudioTracks()||[]];this.combinedStream=new MediaStream(e),this.mimeType=this.getSupportedMimeType(),this.mediaRecorder=new MediaRecorder(this.combinedStream,{mimeType:this.mimeType,videoBitsPerSecond:25e5}),this.chunks=[],this.mediaRecorder.ondataavailable=t=>{t.data.size>0&&this.chunks.push(t.data)},this.mediaRecorder.onstop=()=>{this.handleStop()},this.mediaRecorder.onerror=t=>{let i=t,r=new Error(i.error?.message||"Recording failed");this.cleanup(),this.callbacks.onError(r)},this.screenStream.getVideoTracks()[0].onended=()=>{this.mediaRecorder?.state==="recording"&&this.stop()},this.mediaRecorder.start(1e3),this.startTime=Date.now(),this.callbacks.onStart(),this.startTimer()}catch(e){throw this.cleanup(),e}}stop(){this.mediaRecorder?.state==="recording"&&this.mediaRecorder.stop(),this.stopTimer()}handleStop(){let e=Date.now()-this.startTime,t=new Blob(this.chunks,{type:this.mimeType});this.cleanup(),this.callbacks.onStop({blob:t,duration:e,mimeType:this.mimeType})}startTimer(){this.timerInterval=setInterval(()=>{let e=Date.now()-this.startTime;this.callbacks.onTimeUpdate(e),e>=q&&this.stop()},100)}stopTimer(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}cleanup(){this.stopTimer(),this.screenStream?.getTracks().forEach(e=>e.stop()),this.audioStream?.getTracks().forEach(e=>e.stop()),this.combinedStream?.getTracks().forEach(e=>e.stop()),this.screenStream=null,this.audioStream=null,this.combinedStream=null,this.mediaRecorder=null,this.chunks=[]}isRecording(){return this.mediaRecorder?.state==="recording"}getElapsed(){return this.startTime?Date.now()-this.startTime:0}destroy(){this.stop(),this.cleanup()}};function T(o){let e=Math.floor(o/1e3),t=Math.floor(e/60),i=e%60;return`${t.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`}function Y(){return q}var M=class{constructor(e,t){this.recorder=null;this.recordingResult=null;this.state="idle";this.indicatorElement=null;this.previewElement=null;this.videoElement=null;this.timerElement=null;this.objectUrl=null;this.config=e,this.callbacks=t,this.injectStyles()}async start(){if(u()){this.showMobileUnsupportedMessage();return}if(!x.isSupported()||!E()){this.showUnsupportedMessage();return}try{this.state="recording",this.showRecordingIndicator(),this.recorder=new x({onStart:()=>{c.log("Recording started")},onStop:e=>{this.handleRecordingComplete(e)},onError:e=>{c.error("Recording error",e),this.hideRecordingIndicator(),this.callbacks.onCancel()},onTimeUpdate:e=>{this.updateTimer(e)}}),await this.recorder.start()}catch(e){c.error("Failed to start recording",e),this.hideRecordingIndicator(),this.callbacks.onCancel()}}showMobileUnsupportedMessage(){this.showMessageOverlay("Recording Not Available on Mobile","Screen recording requires a desktop browser. You can still take a screenshot to share feedback!",[{text:"Take Screenshot Instead",action:"screenshot",primary:!0},{text:"Cancel",action:"cancel",primary:!1}])}showUnsupportedMessage(){this.showMessageOverlay("Recording Not Supported","Your browser doesn't support screen recording. Try using Chrome, Edge, or Firefox on desktop.",[{text:"Take Screenshot Instead",action:"screenshot",primary:!0},{text:"Cancel",action:"cancel",primary:!1}])}showMessageOverlay(e,t,i){let r=n("div",{className:"ff-recording-preview-overlay"}),s=n("div",{className:"ff-recording-message-wrapper"}),a=n("div",{className:"ff-recording-message-content"},[n("div",{className:"ff-recording-message-icon"},[l(d.video)]),n("h3",{className:"ff-recording-message-title"},[e]),n("p",{className:"ff-recording-message-text"},[t])]),p=n("div",{className:"ff-recording-message-actions"});i.forEach(({text:f,action:h,primary:m})=>{let v=n("button",{className:`ff-recording-btn ff-btn-${m?"primary":"secondary"}`,type:"button"},[f]);v.addEventListener("click",()=>{if(r.remove(),h==="cancel")this.callbacks.onCancel();else if(h==="screenshot"){let fe=new CustomEvent("ff:switch-to-screenshot",{detail:{widgetKey:this.config.widgetKey}});window.dispatchEvent(fe),this.callbacks.onCancel()}}),p.appendChild(v)}),s.appendChild(a),s.appendChild(p),r.appendChild(s),document.body.appendChild(r)}showRecordingIndicator(){this.indicatorElement=n("div",{className:"ff-recording-indicator"});let e=n("div",{className:"ff-recording-content"},[n("div",{className:"ff-recording-dot"}),n("span",{className:"ff-recording-text"},["Recording"]),n("span",{className:"ff-recording-timer"},["00:00"]),n("span",{className:"ff-recording-separator"},[" / "]),n("span",{className:"ff-recording-max"},[T(Y())])]),t=n("button",{className:"ff-recording-stop",type:"button"},[l(d.stop||d.close),"Stop"]);t.addEventListener("click",()=>this.stopRecording()),this.indicatorElement.appendChild(e),this.indicatorElement.appendChild(t),document.body.appendChild(this.indicatorElement),this.timerElement=this.indicatorElement.querySelector(".ff-recording-timer")}updateTimer(e){this.timerElement&&(this.timerElement.textContent=T(e))}hideRecordingIndicator(){this.indicatorElement?.remove(),this.indicatorElement=null,this.timerElement=null}stopRecording(){this.recorder?.stop()}handleRecordingComplete(e){this.recordingResult=e,this.state="preview",this.hideRecordingIndicator(),this.showPreview()}showPreview(){if(!this.recordingResult)return;this.objectUrl=URL.createObjectURL(this.recordingResult.blob),this.previewElement=n("div",{className:"ff-recording-preview-overlay"});let e=n("div",{className:"ff-recording-preview-wrapper"}),t=n("div",{className:"ff-recording-preview-header"},[n("h3",{className:"ff-recording-preview-title"},["Preview Recording"]),this.createCloseButton()]),i=n("div",{className:"ff-recording-preview-video-container"});this.videoElement=n("video",{className:"ff-recording-preview-video"}),this.videoElement.src=this.objectUrl,this.videoElement.controls=!0,this.videoElement.playsInline=!0,i.appendChild(this.videoElement);let r=n("div",{className:"ff-recording-preview-info"},[n("span",{className:"ff-recording-info-item"},[`Duration: ${T(this.recordingResult.duration)}`]),n("span",{className:"ff-recording-info-item"},[`Size: ${(this.recordingResult.blob.size/(1024*1024)).toFixed(2)} MB`])]),s=n("div",{className:"ff-recording-preview-actions"},[this.createButton("Retake","secondary",()=>this.retake()),this.createButton("Use Recording","primary",()=>this.confirm())]);e.appendChild(t),e.appendChild(i),e.appendChild(r),e.appendChild(s),this.previewElement.appendChild(e),document.body.appendChild(this.previewElement)}createCloseButton(){let e=n("button",{className:"ff-recording-preview-close",type:"button","aria-label":"Cancel"},[l(d.close)]);return e.addEventListener("click",()=>this.cancel()),e}createButton(e,t,i){let r=n("button",{className:`ff-recording-btn ff-btn-${t}`,type:"button"},[e]);return r.addEventListener("click",i),r}hidePreview(){this.previewElement?.remove(),this.previewElement=null,this.videoElement=null,this.objectUrl&&(URL.revokeObjectURL(this.objectUrl),this.objectUrl=null)}async retake(){this.hidePreview(),this.recordingResult=null,await this.start()}confirm(){if(!this.recordingResult)return;let e=this.recordingResult;this.hidePreview(),this.callbacks.onConfirm(e)}cancel(){this.recorder?.destroy(),this.hideRecordingIndicator(),this.hidePreview(),this.recordingResult=null,this.callbacks.onCancel()}injectStyles(){let e="ff-recording-styles";if(document.getElementById(e))return;let t=`
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

      /* Message overlay for unsupported browsers */
      .ff-recording-message-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 400px;
        margin: 20px;
        overflow: hidden;
      }

      .ff-recording-message-content {
        padding: 24px;
        text-align: center;
      }

      .ff-recording-message-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        color: ${this.config.primaryColor};
        opacity: 0.6;
      }

      .ff-recording-message-icon svg {
        width: 100%;
        height: 100%;
      }

      .ff-recording-message-title {
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0 0 8px;
      }

      .ff-recording-message-text {
        font-size: 14px;
        color: #666;
        margin: 0;
        line-height: 1.5;
      }

      .ff-recording-message-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 24px 24px;
      }

      @media (min-width: 400px) {
        .ff-recording-message-actions {
          flex-direction: row;
          justify-content: center;
        }
      }
    `,i=document.createElement("style");i.id=e,i.textContent=t,document.head.appendChild(i)}destroy(){this.recorder?.destroy(),this.hideRecordingIndicator(),this.hidePreview(),this.recordingResult=null}};var G="ff_submission_queue",ke=5,Ee=1e3;function Se(){return`ff_${Date.now()}_${Math.random().toString(36).substring(2,9)}`}function Te(o){let e=Ee*Math.pow(2,o),t=e*.2*Math.random();return Date.now()+e+t}var y=class o{constructor(e=""){this.retryTimer=null;this.isProcessing=!1;this.apiUrl=e||this.getDefaultApiUrl(),this.setupConnectivityListener(),this.scheduleRetry()}getDefaultApiUrl(){if(typeof window>"u")return"";let e=document.querySelectorAll('script[src*="widget.js"]');for(let t of Array.from(e)){let i=t.src;if(i)try{return`${new URL(i).origin}/api/widget/submit`}catch{}}return"https://feedbackflow.cc/api/widget/submit"}setupConnectivityListener(){typeof window>"u"||window.addEventListener("online",()=>{c.log("Connection restored, processing queue..."),this.processQueue()})}getQueue(){try{let e=localStorage.getItem(G);return e?JSON.parse(e):[]}catch{return[]}}saveQueue(e){try{localStorage.setItem(G,JSON.stringify(e))}catch(t){c.error("Failed to save queue",t)}}addToQueue(e,t,i,r){let s=this.getQueue(),a={id:Se(),widgetKey:e,formData:t,screenshotDataUrl:i,recordingBlob:r?this.blobToBase64Sync(r):void 0,recordingMimeType:r?.type,timestamp:Date.now(),retryCount:0,nextRetryAt:Date.now()};return s.push(a),this.saveQueue(s),this.scheduleRetry(),a.id}blobToBase64Sync(e){return""}static blobToBase64(e){return new Promise((t,i)=>{let r=new FileReader;r.onload=()=>{let a=r.result.split(",")[1];t(a)},r.onerror=()=>i(new Error("Failed to convert blob to base64")),r.readAsDataURL(e)})}static base64ToBlob(e,t){let i=atob(e),r=new Uint8Array(i.length);for(let s=0;s<i.length;s++)r[s]=i.charCodeAt(s);return new Blob([r],{type:t})}removeFromQueue(e){let t=this.getQueue().filter(i=>i.id!==e);this.saveQueue(t)}scheduleRetry(){this.retryTimer&&clearTimeout(this.retryTimer);let e=this.getQueue();if(e.length===0)return;let t=Date.now(),i=Math.min(...e.map(s=>s.nextRetryAt)),r=Math.max(0,i-t);this.retryTimer=setTimeout(()=>{this.processQueue()},r)}async processQueue(){if(!this.isProcessing&&navigator.onLine){this.isProcessing=!0;try{let e=this.getQueue(),t=Date.now();for(let i of e)if(!(i.nextRetryAt>t)){if(i.retryCount>=ke){c.warn(`Max retries exceeded for submission ${i.id}, removing from queue`),this.removeFromQueue(i.id);continue}try{let r=await this.submitToApi(i);if(r.success)c.log(`Queued submission ${i.id} succeeded, feedback ID: ${r.feedbackId}`),this.removeFromQueue(i.id),window.dispatchEvent(new CustomEvent("ff:queue-submission-success",{detail:{id:i.id,feedbackId:r.feedbackId}}));else throw new Error(r.error||"Submission failed")}catch(r){c.warn(`Queue submission ${i.id} failed, scheduling retry`,r);let s=this.getQueue(),a=s.findIndex(p=>p.id===i.id);a!==-1&&(s[a].retryCount++,s[a].nextRetryAt=Te(s[a].retryCount),this.saveQueue(s))}}}finally{this.isProcessing=!1,this.scheduleRetry()}}}async submitToApi(e){let t=new FormData;if(t.append("widgetKey",e.widgetKey),t.append("title",e.formData.title),t.append("description",e.formData.description),t.append("type",e.formData.type),t.append("metadata",JSON.stringify(e.formData.metadata)),e.formData.email&&t.append("email",e.formData.email),e.formData.name&&t.append("name",e.formData.name),e.screenshotDataUrl){let a=await(await fetch(e.screenshotDataUrl)).blob();t.append("screenshot",a,"screenshot.jpg")}if(e.recordingBlob&&e.recordingMimeType){let s=o.base64ToBlob(e.recordingBlob,e.recordingMimeType),a=e.recordingMimeType.includes("webm")?"webm":"mp4";t.append("recording",s,`recording.${a}`)}let i=await fetch(this.apiUrl,{method:"POST",body:t});if(!i.ok){let s=await i.text().catch(()=>"Unknown error");return{success:!1,error:`HTTP ${i.status}: ${s}`}}let r=await i.json();return{success:!0,feedbackId:r.feedbackId||r.id}}getQueueSize(){return this.getQueue().length}clearQueue(){this.saveQueue([]),this.retryTimer&&(clearTimeout(this.retryTimer),this.retryTimer=null)}destroy(){this.retryTimer&&(clearTimeout(this.retryTimer),this.retryTimer=null)}},H=null;function I(o){return H||(H=new y(o)),H}function X(o){let e="ff-submit-styles";if(document.getElementById(e))return;let t=`
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
      background-color: ${o.backgroundColor};
      border: 2px solid ${o.primaryColor};
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
      border-bottom: 2px solid ${o.primaryColor};
    }

    .ff-submit-title {
      font-size: 16px;
      font-weight: 600;
      color: ${o.textColor};
      margin: 0;
    }

    .ff-submit-close {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${o.textColor};
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
      border: 1px solid ${o.primaryColor};
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
      border-color: ${o.primaryColor};
    }

    .ff-type-option.ff-selected {
      border-color: ${o.primaryColor};
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
      color: ${o.textColor};
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
      color: ${o.textColor};
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
      color: ${o.textColor};
      transition: border-color 0.15s ease;
      outline: none;
    }

    .ff-input:focus {
      border-color: ${o.primaryColor};
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
      color: ${o.textColor};
      min-height: 80px;
      resize: vertical;
      transition: border-color 0.15s ease;
      outline: none;
      font-family: inherit;
    }

    .ff-textarea:focus {
      border-color: ${o.primaryColor};
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
      border-top: 2px solid ${o.primaryColor};
    }

    .ff-submit-btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 2px solid ${o.primaryColor};
      transition: all 0.15s ease;
    }

    .ff-submit-btn.ff-btn-secondary {
      background-color: white;
      color: ${o.textColor};
    }

    .ff-submit-btn.ff-btn-secondary:hover {
      background-color: #f5f5f4;
    }

    .ff-submit-btn.ff-btn-primary {
      background-color: ${o.primaryColor};
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
      color: ${o.primaryColor};
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
      border: 2px solid ${o.primaryColor};
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
      color: ${o.textColor};
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
      border: 2px solid ${o.primaryColor};
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
      color: ${o.textColor};
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
      accent-color: ${o.primaryColor};
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

    /* Mobile responsive styles */
    @media (max-width: 480px) {
      .ff-submit-wrapper {
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border: none;
        box-shadow: none;
      }

      .ff-submit-header {
        padding: 14px 16px;
      }

      .ff-submit-content {
        padding: 14px;
      }

      .ff-type-selector {
        flex-direction: column;
        gap: 8px;
      }

      .ff-type-option {
        flex: none;
        padding: 14px;
      }

      .ff-input,
      .ff-textarea {
        font-size: 16px; /* Prevents zoom on iOS */
      }

      .ff-textarea {
        min-height: 100px;
      }

      .ff-submit-actions {
        flex-direction: column-reverse;
        gap: 8px;
        padding: 14px;
      }

      .ff-submit-btn {
        width: 100%;
        padding: 14px 20px;
        text-align: center;
      }

      .ff-success-icon,
      .ff-error-icon {
        width: 56px;
        height: 56px;
      }

      .ff-success-icon svg,
      .ff-error-icon svg {
        width: 28px;
        height: 28px;
      }
    }

    /* Touch-friendly tap targets */
    @media (pointer: coarse) {
      .ff-type-option {
        min-height: 56px;
      }

      .ff-consent-checkbox {
        width: 20px;
        height: 20px;
      }

      .ff-submit-close {
        padding: 8px;
        margin: -4px;
      }
    }
  `,i=document.createElement("style");i.id=e,i.textContent=t,document.head.appendChild(i)}function V(o,e){let t=n("div",{className:"ff-preview-thumbnail"});if(o){let i=n("img",{className:"ff-preview-img"});i.src=o.dataUrl,i.alt="Screenshot preview",t.appendChild(i),t.appendChild(n("span",{className:"ff-preview-label"},["Screenshot attached"]))}else if(e){let i=n("div",{className:"ff-preview-icon"},[l(d.video)]);t.appendChild(i);let r=Math.round(e.duration/1e3);t.appendChild(n("span",{className:"ff-preview-label"},[`Recording attached (${r}s)`]))}return t}var Me=[{type:"bug",label:"Bug Report",icon:d.bug,color:"#E85D52"},{type:"feature",label:"Feature Request",icon:d.lightbulb,color:"#6B9AC4"}];function J(o,e){let t=n("div",{className:"ff-type-selector"});return Me.forEach(i=>{let r=o===i.type,s=n("button",{className:`ff-type-option ${r?"ff-selected":""}`,type:"button","data-type":i.type},[n("div",{className:"ff-type-icon"},[l(i.icon)]),n("span",{className:"ff-type-label"},[i.label])]),a=s.querySelector(".ff-type-icon");a&&(a.style.color=i.color,r&&(a.style.backgroundColor=`${i.color}20`,a.style.borderColor=`${i.color}40`)),s.addEventListener("click",()=>e(i.type)),t.appendChild(s)}),t}function Z(o,e){let t=n("div",{className:"ff-form-group"},[n("label",{className:"ff-form-label"},["Title"]),n("input",{className:"ff-submit-title-input ff-input",type:"text",placeholder:"Brief summary of the issue or request"})]),i=t.querySelector("input");return i.value=o,i.addEventListener("input",r=>{e(r.target.value)}),t}function ee(o,e){let t=n("div",{className:"ff-form-group"},[n("label",{className:"ff-form-label"},["Description"]),n("textarea",{className:"ff-submit-description-input ff-textarea",placeholder:"Provide more details about what happened or what you'd like to see..."})]),i=t.querySelector("textarea");return i.value=o,i.addEventListener("input",r=>{e(r.target.value)}),t}function te(o,e,t,i){let r=n("div",{className:"ff-optional-section"}),s=n("div",{className:"ff-optional-header"},[n("span",{className:"ff-optional-label"},["Optional"])]);r.appendChild(s);let a=n("div",{className:"ff-form-group ff-form-group-sm"},[n("label",{className:"ff-form-label-sm"},[l(d.mail),"Email (for follow-up)"]),n("input",{className:"ff-input ff-input-sm",type:"email",placeholder:"your@email.com"})]),p=a.querySelector("input");p.value=o,p.addEventListener("input",m=>{t(m.target.value)}),r.appendChild(a);let f=n("div",{className:"ff-form-group ff-form-group-sm"},[n("label",{className:"ff-form-label-sm"},[l(d.user),"Name"]),n("input",{className:"ff-input ff-input-sm",type:"text",placeholder:"Your name"})]),h=f.querySelector("input");return h.value=e,h.addEventListener("input",m=>{i(m.target.value)}),r.appendChild(f),r}function ie(o,e,t){let i=n("div",{className:"ff-consent-section"}),r=n("input",{type:"checkbox",className:"ff-consent-checkbox",id:"ff-privacy-consent"});r.checked=e,r.addEventListener("change",a=>{t(a.target.checked)});let s=n("label",{className:"ff-consent-label",for:"ff-privacy-consent"},[r,n("span",{className:"ff-consent-text"},["I acknowledge that my feedback may include personal information and agree to the ",n("a",{href:o,target:"_blank",className:"ff-consent-link"},["privacy policy"]),"."])]);return i.appendChild(s),i}function oe(){let o=n("div",{className:"ff-submit-loading"}),e=n("div",{className:"ff-spinner"},[l(d.spinner)]),t=n("p",{className:"ff-loading-text"},["Submitting your feedback..."]);return o.appendChild(e),o.appendChild(t),o}function re(o,e,t){let i=n("div",{className:"ff-submit-success"}),r=n("div",{className:"ff-success-icon"},[l(d.check)]),s=n("h3",{className:"ff-success-title"},["Feedback Submitted!"]),a=n("p",{className:"ff-success-message"},["Thank you for your feedback. We'll review it shortly."]);if(e){let h=n("div",{className:"ff-success-warning"},[n("div",{className:"ff-warning-icon"},[l(d.warning||d.info)]),n("p",{className:"ff-warning-text"},[e])]);i.appendChild(r),i.appendChild(s),i.appendChild(h)}else i.appendChild(r),i.appendChild(s),i.appendChild(a);let p=n("div",{className:"ff-success-id"},[n("span",{className:"ff-id-label"},["Reference ID: "]),n("code",{className:"ff-id-value"},[o])]),f=z("Close","primary",t);return i.appendChild(p),i.appendChild(f),i}function ne(o,e,t){let i=n("div",{className:"ff-submit-error"}),r=n("div",{className:"ff-error-icon"},[l(d.close)]),s=n("h3",{className:"ff-error-title"},["Submission Failed"]),a=n("p",{className:"ff-error-message"},[o||"Something went wrong. Your feedback has been saved and will be submitted automatically when the connection is restored."]),p=n("div",{className:"ff-error-actions"},[z("Try Again","secondary",e),z("Close","primary",t)]);return i.appendChild(r),i.appendChild(s),i.appendChild(a),i.appendChild(p),i}function z(o,e,t){let i=n("button",{className:`ff-submit-btn ff-btn-${e}`,type:"button"},[o]);return i.addEventListener("click",t),i}var b=class{constructor(e,t,i,r){this.container=null;this.state="form";this.formState={title:"",description:"",type:"bug",email:"",name:"",privacyConsent:!1};this.feedbackId="";this.errorMessage="";this.warningMessage="";this.config=e,this.callbacks=t,this.screenshot=i,this.recording=r,this.offlineQueue=I(e.apiUrl)}show(){X(this.config),this.render()}render(){this.container?.remove(),this.container=n("div",{className:"ff-submit-overlay"});let e=n("div",{className:"ff-submit-wrapper"});switch(this.state){case"form":e.appendChild(this.renderForm());break;case"loading":e.appendChild(oe());break;case"success":e.appendChild(re(this.feedbackId,this.warningMessage,()=>{this.callbacks.onSuccess(this.feedbackId),this.destroy()}));break;case"error":e.appendChild(ne(this.errorMessage,()=>{this.state="form",this.render()},()=>{this.callbacks.onError(this.errorMessage),this.destroy()}));break}this.container.appendChild(e),document.body.appendChild(this.container),this.state==="form"&&this.container.querySelector(".ff-submit-title-input")?.focus()}renderForm(){let e=n("div",{className:"ff-submit-form"}),t=n("div",{className:"ff-submit-header"},[n("h3",{className:"ff-submit-title"},["Submit Feedback"]),this.createCloseButton()]),i=n("div",{className:"ff-submit-content"});(this.screenshot||this.recording)&&i.appendChild(V(this.screenshot,this.recording)),i.appendChild(J(this.formState.type,s=>{this.formState.type=s,this.render()})),i.appendChild(Z(this.formState.title,s=>{this.formState.title=s})),i.appendChild(ee(this.formState.description,s=>{this.formState.description=s})),i.appendChild(te(this.formState.email,this.formState.name,s=>{this.formState.email=s},s=>{this.formState.name=s})),this.config.privacyPolicyUrl&&i.appendChild(ie(this.config.privacyPolicyUrl,this.formState.privacyConsent,s=>{this.formState.privacyConsent=s}));let r=n("div",{className:"ff-submit-actions"},[this.createButton("Cancel","secondary",()=>this.cancel()),this.createButton("Submit Feedback","primary",()=>this.submit())]);return e.appendChild(t),e.appendChild(i),e.appendChild(r),e}createCloseButton(){let e=n("button",{className:"ff-submit-close",type:"button","aria-label":"Cancel"},[l(d.close)]);return e.addEventListener("click",()=>this.cancel()),e}createButton(e,t,i){let r=n("button",{className:`ff-submit-btn ff-btn-${t}`,type:"button"},[e]);return r.addEventListener("click",i),r}cancel(){this.destroy(),this.callbacks.onCancel()}async submit(){if(!this.formState.title.trim()){alert("Please enter a title for your feedback.");return}if(this.config.privacyPolicyUrl&&!this.formState.privacyConsent){alert("Please acknowledge the privacy policy to submit feedback.");return}this.state="loading",this.render();try{let e=await this.submitFeedback();if(e.success&&e.feedbackId)this.feedbackId=e.feedbackId,this.warningMessage=e.warning||"",this.state="success",this.render();else throw new Error(e.error||"Submission failed")}catch(e){c.error("Submission failed",e),await this.queueForRetry(),this.errorMessage=e instanceof Error?e.message:"Submission failed",this.state="error",this.render()}}async submitFeedback(){let e=this.getMetadata(),t=this.config.apiUrl||"https://feedbackflow.cc/api/widget/submit",i=new FormData;if(i.append("widgetKey",this.config.widgetKey),i.append("title",this.formState.title),i.append("description",this.formState.description),i.append("type",this.formState.type),i.append("metadata",JSON.stringify(e)),this.formState.email&&i.append("email",this.formState.email),this.formState.name&&i.append("name",this.formState.name),this.screenshot?.blob&&i.append("screenshot",this.screenshot.blob,"screenshot.jpg"),this.recording?.blob){let a=this.recording.mimeType.includes("webm")?"webm":"mp4";i.append("recording",this.recording.blob,`recording.${a}`),i.append("recordingDuration",(this.recording.duration/1e3).toString())}let r=await fetch(t,{method:"POST",body:i});if(!r.ok){let a=await r.text().catch(()=>"Unknown error");throw new Error(`HTTP ${r.status}: ${a}`)}let s=await r.json();return{success:!0,feedbackId:s.feedbackId||s.id,warning:s.warning}}async queueForRetry(){let e=this.getMetadata(),t={title:this.formState.title,description:this.formState.description,type:this.formState.type,email:this.formState.email||void 0,name:this.formState.name||void 0,metadata:e},i;this.recording?.blob&&(i=await y.blobToBase64(this.recording.blob));let r=this.offlineQueue.getQueue(),s={id:`ff_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,widgetKey:this.config.widgetKey,formData:t,screenshotDataUrl:this.screenshot?.dataUrl,recordingBlob:i,recordingMimeType:this.recording?.mimeType,timestamp:Date.now(),retryCount:0,nextRetryAt:Date.now()};r.push(s),localStorage.setItem("ff_submission_queue",JSON.stringify(r)),c.log("Feedback queued for retry")}getMetadata(){return{url:window.location.href,userAgent:navigator.userAgent,timestamp:new Date().toISOString(),screenWidth:window.screen.width,screenHeight:window.screen.height}}destroy(){this.container?.remove(),this.container=null}};var R=class{constructor(e,t,i){this.config=e;this.onOpen=t;this.onMinimize=i;this.buttonContainer=null;this.triggerButton=null;this.minimizeButton=null}create(){return this.buttonContainer=n("div",{className:"ff-button-container"}),this.minimizeButton=n("button",{className:"ff-minimize-button","aria-label":"Minimize feedback widget",type:"button",title:"Hide feedback button (click any corner to show again)"},[l(d.close)]),this.triggerButton=n("button",{className:"ff-trigger-button","aria-label":"Open feedback widget",type:"button"},[l(d.feedback),this.config.buttonText,this.minimizeButton]),this.buttonContainer.appendChild(this.triggerButton),this.buttonContainer}setupEventListeners(){this.triggerButton?.addEventListener("click",()=>{this.onOpen()}),this.minimizeButton?.addEventListener("click",e=>{e.stopPropagation(),this.onMinimize()})}getElement(){return this.buttonContainer}getTriggerButton(){return this.triggerButton}};var L=class{constructor(e){this.onRestore=e;this.indicators=[]}create(){let e=["top-left","top-right","bottom-left","bottom-right"];return this.indicators=e.map(t=>n("div",{className:`ff-corner-indicator ff-corner-${t}`,"aria-label":"Show feedback widget",role:"button",tabindex:"0"})),this.indicators}setupEventListeners(){this.indicators.forEach(e=>{e.addEventListener("click",()=>{this.onRestore()}),e.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),this.onRestore())})})}getElements(){return this.indicators}};var P=class{constructor(e,t,i){this.config=e;this.onClose=t;this.onCaptureStart=i;this.modalOverlay=null}create(){this.modalOverlay=n("div",{className:"ff-modal-overlay",role:"dialog","aria-modal":"true","aria-labelledby":"ff-modal-title"});let e=n("div",{className:"ff-modal"}),t=this.createHeader(),i=n("div",{className:"ff-modal-content"},[this.createCaptureOptions()]),r=this.createFooter();return e.appendChild(t),e.appendChild(i),e.appendChild(r),this.modalOverlay.appendChild(e),this.modalOverlay}createHeader(){let e=n("button",{className:"ff-close-button","aria-label":"Close feedback widget",type:"button"},[l(d.close)]);return n("div",{className:"ff-modal-header"},[n("h2",{className:"ff-modal-title",id:"ff-modal-title"},["Share Feedback"]),e])}createCaptureOptions(){let e=n("div",{className:"ff-capture-options"}),t=u(),i=E()&&!t,r=t?"Take a photo or select from gallery":"Capture and annotate your screen",s=n("button",{className:"ff-capture-option","data-capture-type":"screenshot",type:"button"},[n("div",{className:"ff-capture-icon ff-screenshot"},[l(d.camera)]),n("div",{className:"ff-capture-text"},[n("p",{className:"ff-capture-title"},[t?"Add a Photo":"Take a Screenshot"]),n("p",{className:"ff-capture-description"},[r])])]),a=i?"ff-capture-option":"ff-capture-option ff-capture-option-disabled",p=i?"Record with voice narration (up to 2 min)":"Desktop only",f=n("button",{className:a,"data-capture-type":"record",type:"button"},[n("div",{className:"ff-capture-icon ff-record"},[l(d.video)]),n("div",{className:"ff-capture-text"},[n("p",{className:"ff-capture-title"},["Record Your Screen"]),n("p",{className:"ff-capture-description"},[p])])]);return e.appendChild(s),e.appendChild(f),e}createFooter(){let e=["Powered by ",n("a",{href:"https://feedbackflow.cc",target:"_blank"},["FeedbackFlow"])];return this.config.privacyPolicyUrl&&e.push(" · ",n("a",{href:this.config.privacyPolicyUrl,target:"_blank"},["Privacy Policy"])),n("div",{className:"ff-modal-footer"},[n("div",{className:"ff-powered-by"},e)])}setupEventListeners(){this.modalOverlay?.querySelector(".ff-close-button")?.addEventListener("click",()=>{this.onClose()}),this.modalOverlay?.addEventListener("click",e=>{e.target===this.modalOverlay&&this.onClose()}),this.modalOverlay?.querySelectorAll(".ff-capture-option").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-capture-type");t&&this.onCaptureStart(t)})})}getElement(){return this.modalOverlay}show(){this.modalOverlay?.classList.add("ff-visible")}hide(){this.modalOverlay?.classList.remove("ff-visible")}};var F=class{constructor(e,t,i,r){this.config=e;this.buttonContainer=t;this.isMinimized=i;this.isModalOpen=r;this.hoverTimeout=null;this.hoverZoneSize=150}setup(){document.addEventListener("mousemove",e=>{this.handleMouseMove(e)})}handleMouseMove(e){if(this.isMinimized()||this.isModalOpen()||!this.buttonContainer)return;let t=this.config.position.includes("bottom"),r=this.config.position.includes("right")?window.innerWidth-e.clientX:e.clientX,s=t?window.innerHeight-e.clientY:e.clientY;r<this.hoverZoneSize&&s<this.hoverZoneSize?this.showButton():this.hideButton()}showButton(){this.hoverTimeout&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=null),this.buttonContainer?.classList.add("ff-hover-peek")}hideButton(){this.hoverTimeout||(this.hoverTimeout=window.setTimeout(()=>{this.buttonContainer?.classList.remove("ff-hover-peek"),this.hoverTimeout=null},300))}destroy(){this.hoverTimeout&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=null)}};var N=class{constructor(e,t){this.buttonContainer=e;this.cornerIndicators=t;this.isMinimized=!1;this.STORAGE_KEY="ff-widget-minimized";this.isMinimized=localStorage.getItem(this.STORAGE_KEY)==="true"}getIsMinimized(){return this.isMinimized}minimize(){this.isMinimized=!0,localStorage.setItem(this.STORAGE_KEY,"true"),this.applyMinimizedState()}restore(){this.isMinimized=!1,localStorage.setItem(this.STORAGE_KEY,"false"),this.applyRestoredState()}applyMinimizedState(){this.buttonContainer&&this.buttonContainer.classList.add("ff-minimized"),this.cornerIndicators.forEach(e=>{e.classList.add("ff-visible")})}applyRestoredState(){this.buttonContainer&&this.buttonContainer.classList.remove("ff-minimized"),this.cornerIndicators.forEach(e=>{e.classList.remove("ff-visible")})}applyInitialState(){this.isMinimized&&this.applyMinimizedState()}};var w=class{constructor(e){this.root=null;this.hoverDetection=null;this.stateManager=null;this.screenshotUI=null;this.recordUI=null;this.submitUI=null;this.capturedScreenshot=null;this.capturedRecording=null;this.config={...C,...e},this.state={isOpen:!1,isCapturing:!1,captureMode:null},this.triggerButton=new R(this.config,()=>this.open(),()=>this.minimize()),this.cornerIndicators=new L(()=>this.restore()),this.modal=new P(this.config,()=>this.close(),t=>this.startCapture(t)),this.init()}init(){A(O(this.config),"ff-widget-styles"),this.root=W();let e=this.triggerButton.create();this.root.appendChild(e),this.cornerIndicators.create().forEach(r=>this.root?.appendChild(r));let i=this.modal.create();this.root.appendChild(i),this.stateManager=new N(this.triggerButton.getElement(),this.cornerIndicators.getElements()),this.hoverDetection=new F(this.config,this.triggerButton.getElement(),()=>this.stateManager?.getIsMinimized()??!1,()=>this.state.isOpen),this.setupEventListeners(),this.stateManager.applyInitialState(),I(this.config.apiUrl)}setupEventListeners(){this.triggerButton.setupEventListeners(),this.cornerIndicators.setupEventListeners(),this.modal.setupEventListeners(),this.hoverDetection?.setup(),document.addEventListener("keydown",e=>{e.key==="Escape"&&this.state.isOpen&&this.close()}),window.addEventListener("ff:switch-to-screenshot",()=>{this.startCapture("screenshot")})}open(){if(this.state.isOpen)return;this.state.isOpen=!0,this.modal.show(),this.triggerButton.getTriggerButton()?.setAttribute("aria-expanded","true"),this.modal.getElement()?.querySelector("button, [href], input, select, textarea")?.focus()}close(){this.state.isOpen&&(this.state.isOpen=!1,this.modal.hide(),this.triggerButton.getTriggerButton()?.setAttribute("aria-expanded","false"),this.triggerButton.getTriggerButton()?.focus())}minimize(){this.stateManager?.minimize()}restore(){this.stateManager?.restore()}startCapture(e){this.state.captureMode=e,this.state.isCapturing=!0,this.close();let t=new CustomEvent("ff:capture-start",{detail:{mode:e,widgetKey:this.config.widgetKey}});window.dispatchEvent(t),e==="screenshot"?this.startScreenshotCapture():e==="record"&&this.startRecordingCapture()}startScreenshotCapture(){this.screenshotUI=new S(this.config,{onConfirm:e=>{this.handleScreenshotConfirm(e)},onCancel:()=>{this.handleScreenshotCancel()}}),this.screenshotUI.start()}handleScreenshotConfirm(e){this.capturedScreenshot=e,this.state.isCapturing=!1;let t=new CustomEvent("ff:screenshot-captured",{detail:{widgetKey:this.config.widgetKey,screenshot:e}});window.dispatchEvent(t),c.log("Screenshot captured",{width:e.width,height:e.height,size:e.blob?`${(e.blob.size/1024).toFixed(2)}KB`:"unknown"}),this.screenshotUI?.destroy(),this.screenshotUI=null,this.showSubmitForm()}handleScreenshotCancel(){this.state.isCapturing=!1,this.state.captureMode=null,this.capturedScreenshot=null,this.screenshotUI?.destroy(),this.screenshotUI=null}startRecordingCapture(){this.recordUI=new M(this.config,{onConfirm:e=>{this.handleRecordingConfirm(e)},onCancel:()=>{this.handleRecordingCancel()}}),this.recordUI.start()}handleRecordingConfirm(e){this.capturedRecording=e,this.state.isCapturing=!1;let t=new CustomEvent("ff:recording-captured",{detail:{widgetKey:this.config.widgetKey,recording:{duration:e.duration,mimeType:e.mimeType,size:e.blob.size}}});window.dispatchEvent(t),c.log("Recording captured",{duration:`${(e.duration/1e3).toFixed(1)}s`,size:`${(e.blob.size/(1024*1024)).toFixed(2)}MB`,mimeType:e.mimeType}),this.recordUI?.destroy(),this.recordUI=null,this.showSubmitForm()}handleRecordingCancel(){this.state.isCapturing=!1,this.state.captureMode=null,this.capturedRecording=null,this.recordUI?.destroy(),this.recordUI=null}showSubmitForm(){this.submitUI=new b(this.config,{onSuccess:e=>{this.handleSubmissionSuccess(e)},onCancel:()=>{this.handleSubmissionCancel()},onError:e=>{this.handleSubmissionError(e)}},this.capturedScreenshot,this.capturedRecording),this.submitUI.show()}handleSubmissionSuccess(e){let t=new CustomEvent("ff:submission-success",{detail:{widgetKey:this.config.widgetKey,feedbackId:e}});window.dispatchEvent(t),c.log("Feedback submitted successfully",{feedbackId:e}),this.cleanupAfterSubmission()}handleSubmissionCancel(){c.log("Submission cancelled"),this.cleanupAfterSubmission()}handleSubmissionError(e){let t=new CustomEvent("ff:submission-error",{detail:{widgetKey:this.config.widgetKey,error:e}});window.dispatchEvent(t),c.warn("Submission error",{error:e}),this.cleanupAfterSubmission()}cleanupAfterSubmission(){this.submitUI?.destroy(),this.submitUI=null,this.capturedScreenshot=null,this.capturedRecording=null,this.state.captureMode=null}getCapturedScreenshot(){return this.capturedScreenshot}getCapturedRecording(){return this.capturedRecording}getConfig(){return{...this.config}}getState(){return{...this.state}}destroy(){this.screenshotUI?.destroy(),this.screenshotUI=null,this.recordUI?.destroy(),this.recordUI=null,this.submitUI?.destroy(),this.submitUI=null,this.hoverDetection?.destroy(),this.hoverDetection=null,this.root?.remove(),document.getElementById("ff-widget-styles")?.remove(),document.getElementById("ff-screenshot-styles")?.remove(),document.getElementById("ff-recording-styles")?.remove(),document.getElementById("ff-submit-styles")?.remove()}};var Ie=3e3,Re="ff-widget-config:",Le=["position","buttonText","primaryColor","backgroundColor","textColor","logoUrl","displayMode"];function Pe(o){if(!o)return null;try{return`${new URL(o).origin}/api/widget/config`}catch{return null}}function ae(o){return`${Re}${o}`}function Fe(o){try{let e=sessionStorage.getItem(ae(o));return e?JSON.parse(e):null}catch{return null}}function Ne(o,e){try{sessionStorage.setItem(ae(o),JSON.stringify(e))}catch{}}async function Ue(o,e){let t=await fetch(`${o}?key=${encodeURIComponent(e)}`);if(!t.ok)return null;let i=await t.json();if(!i||typeof i.config!="object"||i.config===null)return null;let r={};for(let s of Le){let a=i.config[s];a!=null&&(r[s]=a)}return r}function se(o,e){return Ue(o,e).then(t=>(t&&Ne(e,t),t))}async function ce(o){let{widgetKey:e,dataAttrConfig:t,timeoutMs:i=Ie}=o,r={...C,...t,widgetKey:e},s=Pe(r.apiUrl);if(!s)return c.warn("No API URL — skipping Widget Config fetch"),r;let a=Fe(e);if(a)return se(s,e).catch(()=>{}),{...r,...a};try{let p=await Promise.race([se(s,e),new Promise(f=>{setTimeout(()=>f(null),i)})]);if(p)return{...r,...p};c.warn("Widget Config fetch timed out or empty — using fallback")}catch(p){c.warn("Widget Config fetch failed — using fallback",p)}return r}var g=null,$=!1;async function de(o){if(g||$){c.warn("Widget already initialized");return}$=!0;try{let e=await ce({widgetKey:o.widgetKey,dataAttrConfig:o});if(g){c.warn("Widget already initialized");return}g=new w(e),c.log("Widget initialized")}catch(e){c.error("Failed to initialize widget",e)}finally{$=!1}}function De(){let o=document.querySelectorAll("script[data-widget-key]"),e=o[o.length-1];if(!e)return c.error("No script tag with data-widget-key found"),null;let t=e.dataset.widgetKey;if(!t)return c.error("data-widget-key is required"),null;let i={widgetKey:t},r=e.dataset.position;return r&&["bottom-right","bottom-left","top-right","top-left"].includes(r)&&(i.position=r),e.dataset.primaryColor&&(i.primaryColor=e.dataset.primaryColor),e.dataset.backgroundColor&&(i.backgroundColor=e.dataset.backgroundColor),e.dataset.textColor&&(i.textColor=e.dataset.textColor),e.dataset.buttonText&&(i.buttonText=e.dataset.buttonText),e.dataset.apiUrl&&(i.apiUrl=e.dataset.apiUrl),e.dataset.privacyPolicyUrl&&(i.privacyPolicyUrl=e.dataset.privacyPolicyUrl),i}function le(){let o=De();!o||!o.widgetKey||de(o)}var pe={init(o){return de(o)},open(){g?.open()},close(){g?.close()},getInstance(){return g},destroy(){g?.destroy(),g=null}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",le):le();typeof window<"u"&&(window.FeedbackFlow=pe);return ve(Be);})();
