// browser support required: WebSockets (binary data), ArrayBuffer, requestAnimationFrame, canvas, KeyboardEvent, classList, flexbox
// supported browsers: IE 11, Edge latest, Firefox latest, Chrome latest, Safari latest, Opera latest, iOS Safari latest, Chrome android latest, Firefox android latest, IE Mobile 11
// TODO: need a fallback for globalCompositionOperation='difference', which is not supported in IE11
// TODO: add help
// TODO: blur for title
// TODO: simple mobile support

var fontsloaded=false;
var fontsloadedcallbacks=[];


var hasGlobalCompositeOperationDifference=true;


window.addEventListener("load",function(){
    var canvas=document.getElementById("main-canvas");
    var death_callback=function(){
        game_started=false;
        document.getElementById("welcome-panel").classList.remove("hidden");
        name_textbox.focus();
    };
    var dom_game;
    var game_started=false;
    //var game_is_running=false;
    var name_textbox=document.getElementById("name-textbox");
    var chosen_endpoint;
    var found_best=function(){};
    var xhr=new XMLHttpRequest();
    xhr.addEventListener("load",function(e){
        var remote_endpoint_list=JSON.parse(xhr.responseText);
        var endpoint_count;
        var remote_endpoint_list_with_latency=[];
        var ended_wait=false;
        var too_long=false;
        var remote_endpoint_callback=function(){
            if(!ended_wait){
                if(too_long||remote_endpoint_list_with_latency.length==endpoint_count){
                    ended_wait=true;
                    var best_endpoint;
                    var best_val=10000;
                    remote_endpoint_list_with_latency.forEach(function(li){
                        if(li.latency<best_val){
                            best_val=li.latency;
                            best_endpoint=li.endpoint;
                        }
                    });
                    if(best_endpoint){
                        chosen_endpoint=best_endpoint;
                        found_best();
                    }
                    // TODO.
                }
            }
        };
        endpoint_count=Object.keys(remote_endpoint_list).length;
        Object.keys(remote_endpoint_list).forEach(function(geographical_location){
            var remote_endpoint=remote_endpoint_list[geographical_location];
            var re_xhr=new XMLHttpRequest();
            var time_start=Date.now();
            re_xhr.addEventListener("load",function(e){
                remote_endpoint_list_with_latency.push({endpoint:remote_endpoint,latency:Date.now()-time_start});
                remote_endpoint_callback();
            });
            re_xhr.open("GET","http://"+remote_endpoint+"/");
            re_xhr.send();
        });
        setTimeout(function(){
            too_long=true;
            remote_endpoint_callback();
        },3000);
        
    });
    xhr.open("GET","http://lobby.celestia.io:8080/welcome");
    xhr.send();
    window.addEventListener("keydown",function(e){
        switch(e.key){
            case "Enter":
                var start_game_handler=function(){
                    if(!game_started){
                        game_started=true;
                        name_textbox.blur();
                        if(dom_game)dom_game.stop();
                        var do_start=function(){
                            ga("send","event","game","start");
                            var options={touch:document.getElementsByClassName("visible")[0].classList.contains("touch"),opposite:document.getElementsByClassName("visible")[0].classList.contains("opposite"),hasGlobalCompositeOperationDifference:hasGlobalCompositeOperationDifference};
                            dom_game=new DomGame(canvas,options,death_callback);
                            dom_game.start(chosen_endpoint,name_textbox.value);
                            document.getElementById("welcome-panel").classList.add("hidden");
                        }
                        if(chosen_endpoint){
                            do_start();
                        }
                        else{
                            found_best=function(){
                                found_best=function(){};
                                do_start();
                            }
                        }
                    }
                }
                if(fontsloaded){
                    start_game_handler();
                }
                else{
                    fontsloadedcallbacks.push(start_game_handler);
                }
                e.preventDefault();
                break;
        }
    });
    
    // title animation
    var title_flexitem=document.getElementById("flex-item-title");
    var canvas_clipper=document.getElementById("canvas-clipper");
    var title_canvas=document.getElementById("title-canvas");
    var title_ctx=title_canvas.getContext("2d");
    var canvas_device_pixel_scale=window.devicePixelRatio||1;
    var title_logical_width;
    var title_logical_height;
    var drawing_width=600;
    var drawing_height=drawing_width/3;
    var baseline_height=150;
    var additional_padding=200; // logical width units
    var prerender_canvas_done=false;
    var resize_handler=function(){
        title_flexitem.style.height="200px";
        
        title_logical_height=Math.min(title_flexitem.offsetHeight,drawing_height);
        title_logical_width=Math.min(title_flexitem.offsetWidth,title_logical_height*drawing_width/drawing_height);
        title_logical_height=Math.ceil(title_logical_width*drawing_height/drawing_width);
        
        canvas_clipper.style.width=title_logical_width+"px";
        canvas_clipper.style.height=title_logical_height+"px";
        title_flexitem.style.height=title_logical_height+"px";
        title_canvas.style.width=(title_logical_width+additional_padding*2)+"px";
        title_canvas.style.height=(title_logical_height+additional_padding*2)+"px";
        title_canvas.style.left=-additional_padding+"px";
        title_canvas.style.top=-additional_padding+"px";
        title_canvas.width=(title_logical_width+additional_padding*2)*canvas_device_pixel_scale;
        title_canvas.height=(title_logical_height+additional_padding*2)*canvas_device_pixel_scale;
        prerender_canvas_done=false;
    }
    window.addEventListener("resize",resize_handler);
    resize_handler();
    var title_animrequest_id;
    var get_title_random_color=function(){
        return [128,255,255];
    };
    var to_canvas_color=function(color_arr){
        return "rgb("+Math.round(color_arr[0]).toString()+","+Math.round(color_arr[1]).toString()+","+Math.round(color_arr[2]).toString()+")";
    };
    var to_canvas_color_with_alpha=function(color_arr){
        return "rgba("+Math.round(color_arr[0]).toString()+","+Math.round(color_arr[1]).toString()+","+Math.round(color_arr[2]).toString()+","+color_arr[3].toString()+")";
    };
    var restart_title_animation=function(){
        if(title_animrequest_id)window.cancelAnimationFrame(title_animrequest_id);
        var time_start=Date.now();
        var text_name="celestia";
        var addn_name=".io";
        var text_parts=[];
        var colors=[];
        for(var i=0;i<text_name.length;++i){
            colors.push(get_title_random_color());
            text_parts.push(text_name.charAt(i));
        }
        colors.push(get_title_random_color());
        text_parts.push(addn_name);
        
        var prerender_canvas=document.createElement("canvas");
        
        var draw=function(){
            
            
            title_ctx.save();
            
            title_ctx.clearRect(0,0,(title_logical_width+additional_padding*2)*canvas_device_pixel_scale,(title_logical_height+additional_padding*2)*canvas_device_pixel_scale);
            
            title_ctx.translate(additional_padding*canvas_device_pixel_scale,additional_padding*canvas_device_pixel_scale);
            
            title_ctx.scale(title_logical_width/drawing_width*canvas_device_pixel_scale,title_logical_width/drawing_width*canvas_device_pixel_scale);
            
            
            
            title_ctx.textAlign="left";
            title_ctx.textBaseline="alphabetic";
            title_ctx.font="168px CandelaBold,sans-serif";
            
            var time_offset=Date.now()-time_start;
            var text_width=title_ctx.measureText(text_name).width;
            
            var offset_hide=(Math.max(drawing_width,drawing_height)+(additional_padding*drawing_width/title_logical_width));/*1000;*/
            var shadowOffsetX=offset_hide*title_logical_width/drawing_width*canvas_device_pixel_scale;
            var shadowOffsetY=offset_hide*title_logical_width/drawing_width*canvas_device_pixel_scale;
            
            
            for(var i=0;i<text_parts.length;++i){
                title_ctx.font=(i<text_name.length)?"168px CandelaBold,sans-serif":"40px CandelaBold,sans-serif";
                var char_offset_left=(i<text_name.length)?(text_width-title_ctx.measureText(text_name.substr(i)).width+(drawing_width-text_width)/2):((drawing_width+text_width)/2);
                
                // fade in 1s, then change color 1s
                var local_time_offset=time_offset-i*100;
                
                // special for 'i' to remove the dot:
                if(i===6 && (!prerender_canvas_done || local_time_offset>1000)){
                    prerender_canvas.width=title_canvas.width;
                    prerender_canvas.height=title_canvas.height;
                    var prerender_ctx=prerender_canvas.getContext("2d");
                    
                    prerender_ctx.save();
                    
                    prerender_ctx.clearRect(0,0,(title_logical_width+additional_padding*2)*canvas_device_pixel_scale,(title_logical_height+additional_padding*2)*canvas_device_pixel_scale);
                    prerender_ctx.translate(additional_padding*canvas_device_pixel_scale,additional_padding*canvas_device_pixel_scale);
                      prerender_ctx.scale(title_logical_width/drawing_width*canvas_device_pixel_scale,title_logical_width/drawing_width*canvas_device_pixel_scale);
            
                    
                    /*prerender_ctx.fillStyle="red";
                    prerender_ctx.fillRect(-additional_padding,-additional_padding,drawing_width+2*additional_padding,drawing_height+2*additional_padding);*/

                    prerender_ctx.textAlign="left";
                    prerender_ctx.textBaseline="alphabetic";
                    prerender_ctx.font="168px CandelaBold,sans-serif";
                    if(local_time_offset<=1000){
                        prerender_ctx.fillStyle=to_canvas_color(colors[i]);
                    }
                    else if(local_time_offset<2000){
                        var fraction=(local_time_offset-1000)/1000;
                        var this_color=to_canvas_color([colors[i][0]*(1-fraction)+255*fraction,colors[i][1]*(1-fraction)+255*fraction,colors[i][2]*(1-fraction)+255*fraction]);
                        prerender_ctx.fillStyle=this_color;
                    }
                    else{
                        prerender_ctx.fillStyle="white";
                    }
                    prerender_ctx.fillText(text_parts[i],char_offset_left,baseline_height);
                    prerender_ctx.globalCompositeOperation="destination-out";
                    prerender_ctx.fillStyle="black";
                    prerender_ctx.beginPath();
                    prerender_ctx.arc(462,49,12,-Math.PI,Math.PI);
                    prerender_ctx.closePath();
                    prerender_ctx.fill();
                    prerender_ctx.restore();
                    
                    prerender_canvas_done=true;
                }
                
                
                
                // shadows only
                title_ctx.save();
                // in drawing units
                var offset_hide=(Math.max(drawing_width,drawing_height)+(additional_padding*drawing_width/title_logical_width));/*1000;*/
                title_ctx.shadowOffsetX=shadowOffsetX;
                title_ctx.shadowOffsetY=shadowOffsetY;
                if(local_time_offset<=0){
                    // don't do anything as this character shouldn't come out yet.
                }
                else if(local_time_offset<=1000){
                    // fade in
                    title_ctx.globalAlpha=local_time_offset/1000;
                    var this_color=to_canvas_color(colors[i]);
                    title_ctx.shadowBlur=20+(1000-local_time_offset)/8;
                    title_ctx.shadowColor=this_color;
                    if(i!==6)title_ctx.fillText(text_parts[i],char_offset_left-offset_hide,baseline_height-offset_hide);
                    else title_ctx.drawImage(prerender_canvas,-additional_padding*drawing_width/title_logical_width-offset_hide,-additional_padding*drawing_width/title_logical_width-offset_hide,drawing_width+additional_padding*drawing_width/title_logical_width*2,drawing_height+additional_padding*drawing_width/title_logical_width*2);
                }
                else if(local_time_offset<2000){
                    var fraction=(local_time_offset-1000)/1000;
                    var this_color=to_canvas_color([colors[i][0]*(1-fraction)+255*fraction,colors[i][1]*(1-fraction)+255*fraction,colors[i][2]*(1-fraction)+255*fraction]);
                    title_ctx.shadowBlur=20;
                    title_ctx.shadowColor=this_color;
                    if(i!==6)title_ctx.fillText(text_parts[i],char_offset_left-offset_hide,baseline_height-offset_hide);
                    else title_ctx.drawImage(prerender_canvas,-additional_padding*drawing_width/title_logical_width-offset_hide,-additional_padding*drawing_width/title_logical_width-offset_hide,drawing_width+additional_padding*drawing_width/title_logical_width*2,drawing_height+additional_padding*drawing_width/title_logical_width*2);
                }
                else{
                    title_ctx.shadowBlur=20;
                    title_ctx.shadowColor="white";
                    if(i!==6)title_ctx.fillText(text_parts[i],char_offset_left-offset_hide,baseline_height-offset_hide);
                    else title_ctx.drawImage(prerender_canvas,-additional_padding*drawing_width/title_logical_width-offset_hide,-additional_padding*drawing_width/title_logical_width-offset_hide,drawing_width+additional_padding*drawing_width/title_logical_width*2,drawing_height+additional_padding*drawing_width/title_logical_width*2);
                }
                title_ctx.restore();
                
                // text only
                title_ctx.save();
                if(local_time_offset<=0){
                    // don't do anything as this character shouldn't come out yet.
                }
                else if(local_time_offset<=1000){
                    // fade in
                    title_ctx.globalAlpha=local_time_offset/1000;
                    var this_color=to_canvas_color(colors[i]);
                    title_ctx.shadowOffsetX=shadowOffsetX;
                    title_ctx.shadowOffsetY=shadowOffsetY;
                    title_ctx.shadowBlur=(1000-local_time_offset)/8;
                    title_ctx.shadowColor=this_color;
                    if(i!==6)title_ctx.fillText(text_parts[i],char_offset_left-offset_hide,baseline_height-offset_hide);
                    else title_ctx.drawImage(prerender_canvas,-additional_padding*drawing_width/title_logical_width-offset_hide,-additional_padding*drawing_width/title_logical_width-offset_hide,drawing_width+additional_padding*drawing_width/title_logical_width*2,drawing_height+additional_padding*drawing_width/title_logical_width*2);
                }
                else if(local_time_offset<2000){
                    var fraction=(local_time_offset-1000)/1000;
                    var this_color=to_canvas_color([colors[i][0]*(1-fraction)+255*fraction,colors[i][1]*(1-fraction)+255*fraction,colors[i][2]*(1-fraction)+255*fraction]);
                    title_ctx.fillStyle=this_color;
                    if(i!==6)title_ctx.fillText(text_parts[i],char_offset_left,baseline_height);
                    else title_ctx.drawImage(prerender_canvas,-additional_padding*drawing_width/title_logical_width,-additional_padding*drawing_width/title_logical_width,drawing_width+additional_padding*drawing_width/title_logical_width*2,drawing_height+additional_padding*drawing_width/title_logical_width*2);
                }
                else{
                    title_ctx.fillStyle="white";
                    if(i!==6)title_ctx.fillText(text_parts[i],char_offset_left,baseline_height);
                    else title_ctx.drawImage(prerender_canvas,-additional_padding*drawing_width/title_logical_width,-additional_padding*drawing_width/title_logical_width,drawing_width+additional_padding*drawing_width/title_logical_width*2,drawing_height+additional_padding*drawing_width/title_logical_width*2);
                }
                title_ctx.restore();
            }
            
            // glowing star
            title_ctx.save();
            title_ctx.translate(462,49);
            var star_color=[255,255,128];
            if(time_offset<=700){
                // do nothing
            }
            else if(time_offset<2200){
                var st_radius=100;
                
                // angle:-60 to -30:
                var st_start=-60*Math.PI/180;
                var st_end=-30*Math.PI/180;
                
                var mid_x=-Math.cos(st_end)*st_radius;
                var mid_y=-Math.sin(st_end)*st_radius;
                
                var fraction=Math.sin((time_offset-700)/(2200-700)*Math.PI/2);
                
                var current_angle=st_start*(1-fraction)+st_end*fraction;
                
                var curr_x=mid_x+Math.cos(current_angle)*st_radius;
                var curr_y=mid_y+Math.sin(current_angle)*st_radius;
                
                var fraction_linear=(time_offset-700)/(2200-700);
                
                if(title_ctx.ellipse){
                    title_ctx.shadowColor=to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],Math.min(fraction_linear*2,1)]);
                    title_ctx.shadowOffsetX=shadowOffsetX;
                    title_ctx.shadowOffsetY=shadowOffsetY;
                    title_ctx.shadowBlur=60*fraction_linear;
                    var radius=18*fraction_linear;
                    for(var i=0;i<8;++i){
                        var ecc2=0.2;
                        var ecc=Math.sqrt(ecc2);
                        var angle=i*Math.PI/4;
                        var dist=radius*Math.sqrt(1/ecc2-ecc2);
                        title_ctx.beginPath();
                        title_ctx.ellipse(curr_x+Math.cos(angle)*dist-offset_hide,curr_y+Math.sin(angle)*dist-offset_hide,radius/ecc,radius*ecc,angle,-Math.PI,Math.PI);
                        //title_ctx.ellipse(0,0,60,40,angle,0,2*Math.PI);
                        title_ctx.fill();
                    }
                    title_ctx.shadowBlur=30*fraction_linear;
                    title_ctx.beginPath();
                    title_ctx.arc(curr_x-offset_hide,curr_y-offset_hide,24*fraction_linear,-Math.PI,Math.PI);
                    title_ctx.closePath();
                    title_ctx.fill();
                }
                else{
                    var st_gradient=title_ctx.createRadialGradient(curr_x,curr_y,0,curr_x,curr_y,fraction_linear*50);
                    st_gradient.addColorStop(0,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],Math.min(fraction_linear*2,1)]));
                    st_gradient.addColorStop(0.1,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],Math.min(fraction_linear*2,1)]));
                    st_gradient.addColorStop(0.4,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],Math.min(fraction_linear*2,1)*0.7]));
                    st_gradient.addColorStop(0.7,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],Math.min(fraction_linear*2,1)*0.3]));
                    st_gradient.addColorStop(1,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],0]));
                    title_ctx.fillStyle=st_gradient;
                    title_ctx.beginPath();
                    title_ctx.arc(curr_x,curr_y,fraction_linear*50,-Math.PI,Math.PI);
                    title_ctx.closePath();
                    title_ctx.fill();
                }
            }
            else{
                if(title_ctx.ellipse){
                    title_ctx.shadowColor=to_canvas_color(star_color);
                    title_ctx.shadowOffsetX=shadowOffsetX;
                    title_ctx.shadowOffsetY=shadowOffsetY;
                    title_ctx.shadowBlur=60;
                    var radius=18;
                    for(var i=0;i<8;++i){
                        var ecc2=0.2;
                        var ecc=Math.sqrt(ecc2);
                        var angle=i*Math.PI/4;
                        var dist=radius*Math.sqrt(1/ecc2-ecc2);
                        title_ctx.beginPath();
                        title_ctx.ellipse(Math.cos(angle)*dist-offset_hide,Math.sin(angle)*dist-offset_hide,radius/ecc,radius*ecc,angle,-Math.PI,Math.PI);
                        //title_ctx.ellipse(0,0,60,40,angle,0,2*Math.PI);
                        title_ctx.fill();
                    }
                    title_ctx.shadowBlur=30;
                    title_ctx.beginPath();
                    title_ctx.arc(-offset_hide,-offset_hide,24,-Math.PI,Math.PI);
                    title_ctx.closePath();
                    title_ctx.fill();
                }
                else{
                    var st_gradient=title_ctx.createRadialGradient(0,0,0,0,0,50);
                    st_gradient.addColorStop(0,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],1]));
                    st_gradient.addColorStop(0.1,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],1]));
                    st_gradient.addColorStop(0.4,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],0.7]));
                    st_gradient.addColorStop(0.7,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],0.3]));
                    st_gradient.addColorStop(1,to_canvas_color_with_alpha([star_color[0],star_color[1],star_color[2],0]));
                    title_ctx.fillStyle=st_gradient;
                    title_ctx.beginPath();
                    title_ctx.arc(0,0,50,-Math.PI,Math.PI);
                    title_ctx.closePath();
                    title_ctx.fill();
                }
            }
            title_ctx.restore();
            //var star_gradient=title_ctx.createRadialGradient()
            
            /*title_ctx.fillStyle="red";
            title_ctx.beginPath();
            title_ctx.arc(462,49,12,-Math.PI,Math.PI);
            title_ctx.closePath();
            title_ctx.fill();*/
            //var star_x=
            title_ctx.restore();
            
            return time_offset>=Math.max(2200,2000+(text_parts.length-1)*100);
            //return false;
        };
        var handler=function(){
            if(!draw())title_animrequest_id=window.requestAnimationFrame(handler);
            else title_animrequest_id=undefined;
        };
        title_animrequest_id=window.requestAnimationFrame(handler);
    };
    if(fontsloaded){
        restart_title_animation();
    }
    else{
        fontsloadedcallbacks.push(restart_title_animation);
    }
    
    
    // interaction mode options
    var interactionmode_el=document.getElementById("interactionmode");
    var interactionlist=[];
    
    Array.prototype.forEach.call(interactionmode_el.childNodes,function(el){
        if(el.nodeType===1&&el.tagName==="SPAN"&&el.classList.contains("interactionoption")){
            interactionlist.push(el);
        }
    });
    interactionmode_el.addEventListener("click",function(e){
        var visibleindex=interactionlist.findIndex(function(el){
            return el.classList.contains("visible");
        });
        interactionlist.forEach(function(el){
            el.classList.remove("visible");
        });
        if(visibleindex!==-1){
            interactionlist[(visibleindex+1)%interactionlist.length].classList.add("visible");
        }
    });
    
    
    // mouse or touch autodetect:
    var suppress_autodetect=false;
    var suppress_autodetector=function(e){
        if(!suppress_autodetect){
            interactionmode_el.removeEventListener("mousedown",suppress_autodetector);
            interactionmode_el.removeEventListener("touchstart",suppress_autodetector);
            window.removeEventListener("mousedown",autodetector);
            window.removeEventListener("touchstart",autodetector);
            suppress_autodetect=true;
        }
    }
    var autodetector=function(e){
        if(!suppress_autodetect){
            if(e.type==="touchstart"){
                interactionlist.forEach(function(el){
                    el.classList.remove("visible");
                });
                document.getElementById("touchdefault").classList.add("visible");
            }
            interactionmode_el.removeEventListener("mousedown",suppress_autodetector);
            interactionmode_el.removeEventListener("touchstart",suppress_autodetector);
            window.removeEventListener("mousedown",autodetector);
            window.removeEventListener("touchstart",autodetector);
            suppress_autodetect=true;
        }
    };
    window.addEventListener("touchstart",autodetector);
    window.addEventListener("mousedown",autodetector);
    interactionmode_el.addEventListener("touchstart",suppress_autodetector);
    interactionmode_el.addEventListener("mousedown",suppress_autodetector);
    
    
    // hasGlobalCompositeOperationDifference
    var globalCompositeTestCanvas=document.createElement("canvas");
    globalCompositeTestCanvas.width=1;
    globalCompositeTestCanvas.height=1;
    var text_ctx=globalCompositeTestCanvas.getContext("2d");
    text_ctx.fillStyle="white";
    text_ctx.fillRect(0,0,1,1);
    text_ctx.globalCompositeOperation="difference";
    text_ctx.fillRect(0,0,1,1);
    if(text_ctx.getImageData(0,0,1,1).data[0]>128){
        hasGlobalCompositeOperationDifference=false;
    }
    text_ctx=undefined;
    globalCompositeTestCanvas=undefined;
    
    
    // font loader:
    var fontLoader=new FontLoader(["CandelaBold:n7"],{
        "complete": function(error){
            if (error !== null) {
                console.log("Could not load font.");
            }
            fontsloaded=true;
            fontsloadedcallbacks.forEach(function(callback){
                callback();
            });
            fontsloadedcallbacks=[];
        }
    }, 5000);
    fontLoader.loadFonts();
});
