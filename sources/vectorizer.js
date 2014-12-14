function Vectorizer(){
//             0.2.4            @version  
//             MIT              @license
//             2014-12-14    by @horse_n_deer
}
Vectorizer.successClass='vectorized';
Vectorizer.notFoundSVG='<svg viewBox="0 0 1 1" shape-rendering="crispEdges" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0,0h1v1h-1Z" fill="rgba(0,0,0,0.50)"></path></svg>';
Vectorizer.notFoundSVGURL='data:image/svg+xml;base64,'+btoa(Vectorizer.notFoundSVG);
Vectorizer.createElement=document.createElementNS.bind(document,'http://www.w3.org/2000/svg');

Vectorizer.useCache=true;
Vectorizer.autoReplace=true;
addEventListener('load',function(){
  if(Vectorizer.autoReplace===false){
    return;
  }

  Vectorizer.replaceToSVGAsync('img.vectorize');
});

//converting async by img.src
Vectorizer.convertToSVG=function(img,callback,options){
  var convertType= options&& options.convertType? options.convertType: '';

  //converting once
  if(img.className&& img.className.indexOf(Vectorizer.successClass)>-1){
    callback&& callback(null,img.src);
    return;
  }
  //break converting if has cache
  var cache=localStorage.getItem(img.src);
  if(cache&&Vectorizer.useCache){
    if(convertType=='dataurl'){
      var dataurl=Vectorizer.getDataURL(cache);
      return callback&& callback(null,dataurl);
    }
    return callback&& callback(null,cache);
  }

  var url=img.src||img;
  Vectorizer.vectorize(url,callback,options);
}
Vectorizer.vectorize=function(url,callback,options){
  var convertType= options&& options.convertType? options.convertType: '';

  Vectorizer.Gify.Frame(url,function(except,frame){
    if(except){
      return callback&& callback(except,convertType=='dataurl'? Vectorizer.notFoundSVGURL: Vectorizer.notFoundSVG);
    }

    //outerHTML unstable
    var svgElement=frame.channel==null? Vectorizer.createSVG(frame.pixels): Vectorizer.Gify.createAnime(frame);
    var svg=document.createElement('div').appendChild(svgElement).parentNode.innerHTML;
    try{
      if(Vectorizer.useCache){
        localStorage.setItem(img.src,svg);
      }
    }
    catch(except){
      //crush: maybe 1mb byte overflow
    }

    return callback&& callback(null,convertType=='dataurl'? Vectorizer.getDataURL(svg): svg);
  });
}

//converting async by img.src with selectorAll
Vectorizer.convertToSVGAsync=function(selector,callback){
  var queues=[];
  var imgs=[].slice.call(document.querySelectorAll(selector));
  imgs.forEach(function(img){
    queues.push(function(next){
      Vectorizer.convertToSVG(img,function(except,dataurl){
        img.src=dataurl;
        if(img.className.indexOf(Vectorizer.successClass)==-1){
          img.className+=' '+Vectorizer.successClass;
        }
        next(null,dataurl);
      },{
        convertType:'dataurl',
      });
    });
  });
  Vectorizer.async(queues,callback,true);
}

//replace img element by src attribute with selectorAll
Vectorizer.replaceToSVGAsync=function(selector,callback){
  var queues=[];
  var imgs=[].slice.call(document.querySelectorAll(selector));
  imgs.forEach(function(img){
    queues.push(function(next){
      Vectorizer.convertToSVG(img,function(except,svg){
        var newElement=Vectorizer.exchange(img,svg);
        return next(null,newElement);
      });
    });
  });
  Vectorizer.async(queues,callback,true);
}

//event to file(or booleans object)
Vectorizer.getFile=function(event){
  var file=event.dataTransfer? event.dataTransfer.files[0]: event.target.files[0];
  file=file? file: {};
  file.not_image=file.type? file.type.indexOf('image/')===-1: true;
  file.not_sixk=file.size? file.size>=600*1000: true;//byte

  var type=file.type? file.type.split('/',2)[1]: '';
  file.is_eightbit=['gif','png'].indexOf(type)>-1;

  return file;
}

//html string to dataurl
Vectorizer.getDataURL=function(data,mimetype){
  mimetype= mimetype!=null? mimetype: 'image/svg+xml';
  return 'data:'+mimetype+';base64,'+btoa(data);
}

Vectorizer.getImageData=function(image){
  var canvas=document.createElement('canvas');
  var context=canvas.getContext('2d');
  context.canvas.width=image.width;
  context.canvas.height=image.height;
  context.drawImage(image,0,0,image.width,image.height);

  return context.getImageData(0,0,image.width,image.height);
}
Vectorizer.getTransparentColor=function(pixelArray){
  var color=null;
  for(var i=0;i<pixelArray.length;i+=4){
    var is_transparent=pixelArray[i+3]==0;
    if(is_transparent){
      var r=('0'+pixelArray[i+0].toString(16)).slice(-2);
      var g=('0'+pixelArray[i+0].toString(16)).slice(-2);
      var b=('0'+pixelArray[i+0].toString(16)).slice(-2);
      color=Number('0x'+r+g+b);
      break;
    }
  }
  return color;
}

//async excecute function queues
Vectorizer.async=function(queues,callback,ignoreExcept){
  ignoreExcept= ignoreExcept!=null? ignoreExcept: false;

  var i=0;
  var results=[];
  var next=function(except,result){
    if(i>0){
      results.push(result);
    }
    if(except!=null&&ignoreExcept===false){
      return callback&& callback(except,results);
    }

    var async=queues[i++];
    if(async==null){
      return callback&& callback(null,results);
    }
    async(next);
  }
  next();
}

//replace on newChildInnerHTML for oldChild
Vectorizer.exchange=function(oldChild,newChildInnerHTML){
  var container=document.createElement('div');
  container.innerHTML=newChildInnerHTML;
  var element=container.querySelector('*');
  if(element&& oldChild.parentNode!=null){
    oldChild.parentNode.replaceChild(element,oldChild);

    //fix: disabled script by wrap innerHTML
    var script=element.querySelector('script');
    if(script){
      var enableScript=document.createElement('script');
      enableScript.textContent=script.textContent;
      script.parentNode.replaceChild(enableScript,script);
    }
  }
  return element;
}

//wrap div element with class (for wow.js)
Vectorizer.wrap=function(node,className){
  var div=document.createElement('div');
  div.appendChild(node.cloneNode(true));
  div.setAttribute('class',className);

  return node.parentNode.replaceChild(div,node);
}

//localhost doesn't work.
Vectorizer.readImageData=function(img,callback){
  var imgActual=new Image;
  imgActual.src=img.src;//disable css(affected)
  imgActual.addEventListener('load',function(){
    var canvas=document.createElement('canvas');
    var context=canvas.getContext('2d');
    canvas.width=imgActual.width;
    canvas.height=imgActual.height;

    //やばい画像を描写しようとすると落ちるらしい
    try{
      context.drawImage(imgActual,0,0);
    }
    catch(except){
      return callback(except);
    }
    try{
      var imagedata=context.getImageData(0,0,canvas.width,canvas.height);
    }
    catch(except){
      return callback(except);
    }

    callback(null,imagedata);
  });
  imgActual.addEventListener('error',function(event){
    return callback&& callback(event);
  });

}

//CanvasPixelArray to <svg>
Vectorizer.createSVG=function(imagedata){
  var svg=Vectorizer.createElement('svg');

  svg.setAttributeNS(null,'shape-rendering','crispEdges');
  svg.setAttributeNS(null,'version','1.1');
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  svg.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  if(imagedata!=null){
    svg.setAttributeNS(null,'viewBox','0 0 '+imagedata.width+' '+imagedata.height);
    svg.appendChild(Vectorizer.convertToG(imagedata)); 
  }

  return svg;
}

//CanvasPixelArray to <g>
Vectorizer.convertToG=function(imagedata){
  var g=Vectorizer.createElement('g');

  var color_points=Vectorizer.convertToColorAndPoints(imagedata);
  for(var rgba in color_points){
    var d=[];
    var lines=Vectorizer.convertToLines(color_points[rgba]);
    lines.forEach(function(line){
      d.push(Vectorizer.convertToD(line));
    });

    var attributes={};
    attributes.fill=rgba;
    attributes.d=d.join('');

    var path=Vectorizer.createElement('path');
    for(var name in attributes){
      var value=attributes[name];
      path.setAttributeNS(null,name,value);
    }
    g.appendChild(path);
  }

  return g;
}

//CanvasPixelArray to [{rgba:points},{...}]
Vectorizer.convertToColorAndPoints=function(imagedata){
  var colors={};
  for(var i=0;i<imagedata.data.length;i+=4){
    if(imagedata.data[i+3]===0){
      continue;
    }

    var values=[];
    values.push(imagedata.data[i+0]);
    values.push(imagedata.data[i+1]);
    values.push(imagedata.data[i+2]);
    values.push((imagedata.data[i+3]/255).toFixed(2));
    
    var rgba='rgba('+values.join(',')+')';
    if(colors[rgba]==null){
      colors[rgba]=[];
    }

    var x=(i/4)%imagedata.width;
    var y=~~((i/4)/imagedata.width);
    colors[rgba].push(new Vectorizer.point(x,y));
  }
  return colors;
}

//merge of horizontal points
// [{x:1,y:1},{x:2,y:1}] => [{x:1,y:1,width:2,height:1}]
Vectorizer.convertToLines=function(points){
  var lines=[];
  points.forEach(function(point){
    var left=lines[lines.length-1]|| {};
    var is_left=left.y===point.y&& (left.x+left.width)===point.x;
    if(is_left){
      return left.width++;
    }

    var rect=new Vectorizer.rect(point);
    lines.push(rect);
  });
  return lines;
}

//[{rgba:points},{...}] to "d" attribute
Vectorizer.convertToD=function(rect){
  //point is path.setAttributeNS(null,'d','M0,0 h1 v1 h-1 z');
  return 'M'+rect.x+','+rect.y+'h'+rect.width+'v'+rect.height+'h-'+rect.width+'Z';
}

Vectorizer.point=function(x,y){
  this.x=x;
  this.y=y;
}
Vectorizer.rect=function(point){
  this.x=point.x,
  this.y=point.y;
  this.width=1;
  this.height=1;
}

  Vectorizer.Gif=function(){
    //dependencies https://github.com/antimatter15/jsgif
  }
  Vectorizer.Gif.convertToGIF=function(file,callback){
    var image=new Image;
    image.src=URL.createObjectURL(file);
    image.addEventListener('error',callback);
    image.addEventListener('load',function(){
      var pixels=Vectorizer.getImageData(image);
      var transparent_color=Vectorizer.getTransparentColor(pixels.data);

      var gif=new GIF({workers:2,quality:10,transparent:transparent_color});
      gif.addFrame(this);
      gif.render({globalPalette:true});
      gif.on('error',callback);
      gif.on('finished',function(blob){
        callback(null,blob);
      });
    });
  }
  //gifにしてblobかfileで返す
  Vectorizer.Gif.convertToEightbit=function(file,callback){
    var not_eightbit= !(file.is_eightbit && file.has_palette)
    if(not_eightbit){
      return Vectorizer.Gif.convertToGIF(file,function(except,blob){
        return callback(except,blob);
      });
    }
    return callback(null,file);
  }

  Vectorizer.Pixelutil=function(){
    //dependencies https://github.com/59naga/misc/tree/patch-1
  }
  //パレット情報を読む
  Vectorizer.Pixelutil.loadImage=function(file,callback){
    if(file instanceof File|| file instanceof Blob){
      return PixelUtil.read(file,callback);
    }
    return PixelUtil.load(file,callback);
  }

  Vectorizer.Gify=function(){
    //dependencies gify-parse, get-pixels via browserify.js
    // e.g $ browserify -r get-pixels -r gify-parse > browserify.js
  }
  Vectorizer.Gify.Frame=function(filename,callback){
    var frame={};

    var gify=require("gify-parse");
    var getPixels=require("get-pixels");
    getPixels(filename,function(except,pixels){
      if(except){
        return callback&& callback(except);
      }

      frame.pixels=pixels;

      var info=pixels.shape.slice();
      if(info.length===3){
        frame.pixels.width=info[0];
        frame.pixels.height=info[1];
        frame.pixels.channel=info[2];
        frame.pixels.length=frame.pixels.width*frame.pixels.height*frame.pixels.channel;
      }
      frame.width=info[1];
      frame.height=info[2];
      frame.channel=info[3];
      frame.byte=frame.width*frame.height*frame.channel;
      frame.length=info[0];

      var xhr=new XMLHttpRequest;
      xhr.open('GET',filename,true);
      xhr.responseType='arraybuffer';
      xhr.onload=function(){
        var delay_info=gify.getInfo(xhr.response);
        frame.delays=delay_info.images.map(function(image){
          return image.delay;
        });
        frame.disposals=delay_info.images.map(function(image){
          return image.disposal;
        });

        callback(null,frame);
      }
      xhr.send();
    });
  }
  Vectorizer.Gify.createAnime=function(gify_frame){
    var anime=Vectorizer.createSVG();
    anime.setAttribute('id',"A"+(Math.random().toString(36).slice(-8)));
    anime.setAttributeNS(null,'viewBox','0 0 '+gify_frame.width+' '+gify_frame.height);

    var animeCanvas=Vectorizer.createElement('use');
    animeCanvas.setAttributeNS('http://www.w3.org/1999/xlink','href','');
    anime.appendChild(animeCanvas);

    var animeFrames=Vectorizer.Gify.convertToAnimeFrames(gify_frame);
    animeFrames.setAttribute('style','display:none');
    anime.appendChild(animeFrames);

    var animeScript=Vectorizer.createElement('script');
    animeScript.textContent='('+Vectorizer.Gify.AnimeScript.toString()+')("'+anime.getAttribute('id')+'")';
    anime.appendChild(animeScript);

    return anime;
  }
  Vectorizer.Gify.AnimeScript=function(serial){
    new Anime('#'+serial+'>use','#'+serial+'>g');

    function Anime(animeSelector,framesSelector,listener){
      var anime=this;

      anime.i=0;
      anime.element=document.querySelector(animeSelector);

      anime.framesElement=document.querySelector(framesSelector);

      anime.frames=[].slice.call(anime.framesElement.parentNode.querySelectorAll(framesSelector+'>g'));

      anime.id=nextFrame();
      function nextFrame(){
        var frame=anime.frames[anime.i++];
        if(frame==null){
          if(listener){
            listener('ended',anime);
          }

          anime.i=0;
          frame=anime.frames[anime.i++];
          if(frame==null){
            return;
          }
        }
        
        var id=frame.getAttribute('id');
        if(id==null){
          id=serial+'_'+('0000'+anime.i).slice(-5);
          frame.setAttribute('id',id);
        }
        anime.element.setAttributeNS('http://www.w3.org/1999/xlink','href','#'+id);
        
        var delay=frame.getAttribute('delay');
        anime.id=setTimeout(nextFrame,delay);
      }
    }
  }
  
  Vectorizer.Gify.convertToAnimeFrames=function(gify_frame){
    var animeFrames=Vectorizer.createElement('g');

    var canvas=document.createElement('canvas');
    var context=canvas.getContext('2d');canvas.width=gify_frame.width;canvas.height=gify_frame.height;
    var image=context.createImageData(gify_frame.width,gify_frame.height);
    for(var i=0;i<gify_frame.length;i++){
      if(gify_frame.disposals[i]===3){
        image=context.createImageData(gify_frame.width,gify_frame.height);
      }

      for(var j=0;j<gify_frame.byte;j+=4){
        if(gify_frame.pixels.data[j+3+gify_frame.byte*i]===0){
          continue;
        }

        image.data[j+0]=gify_frame.pixels.data[gify_frame.byte*i + j+0];
        image.data[j+1]=gify_frame.pixels.data[gify_frame.byte*i + j+1];
        image.data[j+2]=gify_frame.pixels.data[gify_frame.byte*i + j+2];
        image.data[j+3]=gify_frame.pixels.data[gify_frame.byte*i + j+3];
      }

      var g=Vectorizer.convertToG(image);
      g.setAttribute('delay',gify_frame.delays[i]);
      animeFrames.appendChild(g);
    }

    return animeFrames;
  }
