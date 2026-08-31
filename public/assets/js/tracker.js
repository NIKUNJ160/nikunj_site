(function(w,d){
  'use strict';
  var EP='/api/analytics/track',SK='analytics_session_id',CT='application/json',memId=null;
  function uuid(){
    try{if(crypto)return crypto.randomUUID();}catch(e){}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:r&3|8).toString(16);});
  }
  function sid(){
    try{
      var s=w.sessionStorage,id=s&&s.getItem(SK);
      if(!id||id.length<10){id=memId||uuid();if(s)s.setItem(SK,id);}
      return(memId=id);
    }catch(e){return(memId=memId||uuid());}
  }
  function send(pl){
    var s=JSON.stringify(pl),n=navigator;
    if(n&&n.sendBeacon){try{if(n.sendBeacon(EP,new Blob([s],{type:CT})))return;}catch(e){}}
    if(typeof fetch==='function')try{fetch(EP,{method:'POST',headers:{'Content-Type':CT},body:s,keepalive:true}).catch(function(){});}catch(e){}
  }
  function a(el,k){return el.getAttribute(k);}
  function dt(el,k){return a(el,'data-track-'+k);}
  function emit(t,pl){
    pl.type=t;pl.session_id=sid();pl.url_path=pl.url_path||w.location.pathname+(w.location.search||'');pl.timestamp=new Date().toISOString();send(pl);
  }
  function trackPageView(p){
    try{
      var n=navigator||{},s=w.screen||{};
      emit('pageview',{url_path:p,referrer:d.referrer||'',user_agent:n.userAgent||'',screen_resolution:s.width?s.width+'x'+s.height:'',viewport_size:w.innerWidth+'x'+w.innerHeight,language:n.language||''});
    }catch(e){}
  }
  function trackEvent(n,d,c){
    if(!n)return;
    try{
      var cat=(typeof c==='string'&&c.trim())||(typeof d==='string'&&d)||(d&&(d.category||d.event_category))||'interaction';
      emit('event',{event_name:n,event_category:cat,event_data:typeof d==='string'?{label:d}:(d&&typeof d==='object'?d:{})});
    }catch(e){}
  }
  w.trackPageView=trackPageView;w.trackEvent=trackEvent;
  if(d.readyState==='complete'||d.readyState==='interactive')trackPageView();
  else d.addEventListener('DOMContentLoaded',function(){trackPageView();},{once:true});
  function prep(el,defCat,sub){
    var n=dt(el,'event');if(!n)return null;
    var v=dt(el,'value'),p={label:dt(el,'label')||(sub?a(el,'id')||a(el,'action')||'form_submit':(el.innerText||'').slice(0,50)||a(el,'aria-label')||'')};
    if(v)p.value=isNaN(v)?v:Number(v);
    return{name:n,cat:dt(el,'category')||defCat,data:p};
  }
  function h(e,sub){
    var t=e.target,el=sub?(t&&(dt(t,'event')?t:(t.closest&&t.closest('[data-track-event]')))):(t&&t.closest&&t.closest('[data-track-event]'));
    if(!el)return;
    var tag=(el.tagName||'').toLowerCase();
    if(!sub&&(tag==='form'||(t.closest&&t.closest('form[data-track-event]'))))return;
    var r=prep(el,sub?'conversion':'interaction',sub);if(!r)return;
    if(!sub){r.data.tag=tag||undefined;var hf=a(el,'href');if(hf)r.data.href=hf;}
    else{var id=a(el,'id'),ac=a(el,'action');if(id)r.data.form_id=id;if(ac)r.data.action=ac;}
    trackEvent(r.name,r.data,r.cat);
  }
  function on(ev,s){d.addEventListener(ev,function(e){h(e,s);},{passive:true});}
  on('click',0);on('submit',1);
})(window,document);
