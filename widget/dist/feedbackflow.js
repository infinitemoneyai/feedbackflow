"use strict";var FeedbackFlow=(()=>{var p=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var y=Object.getOwnPropertyNames;var w=Object.prototype.hasOwnProperty;var v=(e,t)=>{for(var i in t)p(e,i,{get:t[i],enumerable:!0})},C=(e,t,i,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of y(t))!w.call(e,a)&&a!==i&&p(e,a,{get:()=>t[a],enumerable:!(r=b(t,a))||r.enumerable});return e};var k=e=>C(p({},"__esModule",{value:!0}),e);var W={};v(W,{FeedbackFlow:()=>h,FeedbackFlowWidget:()=>s});var f={position:"bottom-right",primaryColor:"#1a1a1a",backgroundColor:"#F7F5F0",textColor:"#1a1a1a",buttonText:"Feedback",apiUrl:""};function F(e){switch(e){case"bottom-right":return"bottom: 20px; right: 20px;";case"bottom-left":return"bottom: 20px; left: 20px;";case"top-right":return"top: 20px; right: 20px;";case"top-left":return"top: 20px; left: 20px;";default:return"bottom: 20px; right: 20px;"}}function g(e){return`
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
      ${F(e.position)}
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: ${e.primaryColor};
      color: white;
      border: 2px solid ${e.primaryColor};
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
      background-color: ${e.backgroundColor};
      border: 2px solid ${e.primaryColor};
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
      border-bottom: 2px solid ${e.primaryColor};
      background-color: #F3C952;
    }

    .ff-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: ${e.textColor};
      margin: 0;
    }

    .ff-close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${e.textColor};
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
      border: 2px solid ${e.primaryColor};
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
      color: ${e.textColor};
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
      border-top: 2px solid ${e.primaryColor};
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
  </svg>`};function o(e,t,i){let r=document.createElement(e);if(t)for(let[a,c]of Object.entries(t))a==="className"?r.className=c:r.setAttribute(a,c);if(i)for(let a of i)typeof a=="string"?r.appendChild(document.createTextNode(a)):r.appendChild(a);return r}function d(e){let t=document.createElement("template");return t.innerHTML=e.trim(),t.content.firstChild}function u(e,t){if(document.getElementById(t))return;let i=o("style",{id:t,type:"text/css"},[e]);document.head.appendChild(i)}function x(){let e=document.getElementById("ff-widget-root");if(e)return e;let t=o("div",{id:"ff-widget-root",className:"ff-widget-root"});return document.body.appendChild(t),t}var s=class{constructor(t){this.root=null;this.triggerButton=null;this.modalOverlay=null;this.config={...f,...t},this.state={isOpen:!1,isCapturing:!1,captureMode:null},this.init()}init(){u(g(this.config),"ff-widget-styles"),this.root=x(),this.createTriggerButton(),this.createModal(),this.setupEventListeners()}createTriggerButton(){this.triggerButton=o("button",{className:"ff-trigger-button","aria-label":"Open feedback widget",type:"button"},[d(l.feedback),this.config.buttonText]),this.root?.appendChild(this.triggerButton)}createModal(){this.modalOverlay=o("div",{className:"ff-modal-overlay",role:"dialog","aria-modal":"true","aria-labelledby":"ff-modal-title"});let t=o("div",{className:"ff-modal"}),i=o("div",{className:"ff-modal-header"},[o("h2",{className:"ff-modal-title",id:"ff-modal-title"},["Share Feedback"]),this.createCloseButton()]),r=o("div",{className:"ff-modal-content"},[this.createCaptureOptions()]),a=o("div",{className:"ff-modal-footer"},[o("div",{className:"ff-powered-by"},["Powered by ",o("a",{href:"https://feedbackflow.dev",target:"_blank"},["FeedbackFlow"])])]);t.appendChild(i),t.appendChild(r),t.appendChild(a),this.modalOverlay.appendChild(t),this.root?.appendChild(this.modalOverlay)}createCloseButton(){return o("button",{className:"ff-close-button","aria-label":"Close feedback widget",type:"button"},[d(l.close)])}createCaptureOptions(){let t=o("div",{className:"ff-capture-options"}),i=o("button",{className:"ff-capture-option","data-capture-type":"screenshot",type:"button"},[o("div",{className:"ff-capture-icon ff-screenshot"},[d(l.camera)]),o("div",{className:"ff-capture-text"},[o("p",{className:"ff-capture-title"},["Take a Screenshot"]),o("p",{className:"ff-capture-description"},["Capture and annotate your screen"])])]),r=o("button",{className:"ff-capture-option","data-capture-type":"record",type:"button"},[o("div",{className:"ff-capture-icon ff-record"},[d(l.video)]),o("div",{className:"ff-capture-text"},[o("p",{className:"ff-capture-title"},["Record Your Screen"]),o("p",{className:"ff-capture-description"},["Record with voice narration (up to 2 min)"])])]);return t.appendChild(i),t.appendChild(r),t}setupEventListeners(){this.triggerButton?.addEventListener("click",()=>{this.open()}),this.modalOverlay?.querySelector(".ff-close-button")?.addEventListener("click",()=>{this.close()}),this.modalOverlay?.addEventListener("click",t=>{t.target===this.modalOverlay&&this.close()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&this.state.isOpen&&this.close()}),this.modalOverlay?.querySelectorAll(".ff-capture-option").forEach(t=>{t.addEventListener("click",()=>{let i=t.getAttribute("data-capture-type");i&&this.startCapture(i)})})}open(){if(this.state.isOpen)return;this.state.isOpen=!0,this.modalOverlay?.classList.add("ff-visible"),this.triggerButton?.setAttribute("aria-expanded","true"),this.modalOverlay?.querySelector("button, [href], input, select, textarea")?.focus()}close(){this.state.isOpen&&(this.state.isOpen=!1,this.modalOverlay?.classList.remove("ff-visible"),this.triggerButton?.setAttribute("aria-expanded","false"),this.triggerButton?.focus())}startCapture(t){this.state.captureMode=t,this.state.isCapturing=!0,this.close();let i=new CustomEvent("ff:capture-start",{detail:{mode:t,widgetKey:this.config.widgetKey}});window.dispatchEvent(i),console.log(`FeedbackFlow: Starting ${t} capture...`)}getConfig(){return{...this.config}}getState(){return{...this.state}}destroy(){this.root?.remove(),document.getElementById("ff-widget-styles")?.remove()}};var n=null;function E(){let e=document.querySelectorAll("script[data-widget-key]"),t=e[e.length-1];if(!t)return console.error("FeedbackFlow: No script tag with data-widget-key found"),null;let i=t.dataset.widgetKey;if(!i)return console.error("FeedbackFlow: data-widget-key is required"),null;let r={widgetKey:i},a=t.dataset.position;return a&&["bottom-right","bottom-left","top-right","top-left"].includes(a)&&(r.position=a),t.dataset.primaryColor&&(r.primaryColor=t.dataset.primaryColor),t.dataset.backgroundColor&&(r.backgroundColor=t.dataset.backgroundColor),t.dataset.textColor&&(r.textColor=t.dataset.textColor),t.dataset.buttonText&&(r.buttonText=t.dataset.buttonText),t.dataset.apiUrl&&(r.apiUrl=t.dataset.apiUrl),r}function m(){if(n){console.warn("FeedbackFlow: Widget already initialized");return}let e=E();if(!(!e||!e.widgetKey))try{n=new s(e),console.log("FeedbackFlow: Widget initialized")}catch(t){console.error("FeedbackFlow: Failed to initialize widget",t)}}var h={init(e){if(n){console.warn("FeedbackFlow: Widget already initialized");return}try{n=new s(e)}catch(t){console.error("FeedbackFlow: Failed to initialize widget",t)}},open(){n?.open()},close(){n?.close()},getInstance(){return n},destroy(){n?.destroy(),n=null}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",m):m();typeof window<"u"&&(window.FeedbackFlow=h);return k(W);})();
