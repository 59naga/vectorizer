function Vectorizer(){
  // @version 0.0.6
  // @license MIT
  // @author 59naga 2014-12-06
}
Vectorizer.notFoundSVG='<svg viewBox="0 0 1 1" shape-rendering="crispEdges" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0,0h1v1h-1Z" fill="rgba(0,0,0,0.50)"></path></svg>';
Vectorizer.notFoundSVGURL='data:image/svg+xml;base64,'+btoa(Vectorizer.notFoundSVG);
Vectorizer.createElement=document.createElementNS.bind(document,'http://www.w3.org/2000/svg');

Vectorizer.autoReplace=true;
addEventListener('load',function(){
  if(Vectorizer.autoReplace===false){
    return;
  }

  Vectorizer.replaceToSVGAsync('img.vectorize');
});

//converting async by img.src
Vectorizer.convertToSVG=function(img,callback,convertType){
  convertType= convertType? convertType: '';

  //converting once
  if(img.className&& img.className.indexOf('vectorized')>-1){
    callback&& callback(null,img.src);
    return;
  }
  //break converting if has cache
  var cache=localStorage.getItem(img.src);
  if(cache){
    if(convertType=='dataurl'){
      var dataurl=Vectorizer.getDataURL(cache);
      return callback&& callback(null,dataurl);
    }
    return callback&& callback(null,cache);
  }

  var imgActual=new Image;
  imgActual.src=img.src;//disable css(affected)
  imgActual.addEventListener('load',function(){
    Vectorizer.readImageData(imgActual,function(except,imagedata){
      if(except){
        return callback&& callback(except);
      }

      var svgElement=Vectorizer.createSVG(imagedata);
      var svg=document.createElement('div').appendChild(svgElement).parentNode.innerHTML;
      localStorage.setItem(img.src,svg);

      if(convertType=='dataurl'){
        var dataurl=Vectorizer.getDataURL(data);
        return callback&& callback(null,dataurl);
      }
      return callback&& callback(null,svg);
    });
  });
  imgActual.addEventListener('error',function(event){
      return callback&& callback(event,convertType=='dataurl'? Vectorizer.notFoundSVGURL: Vectorizer.notFoundSVG);
  });
}

//async excecute function queues
Vectorizer.async=function(queues,callback,ignoreExcept){
  ignoreExcept= ignoreExcept!=null? ignoreExcept: false;

  var i=0;
  var next=function(except,result){
    if(except!=null&&ignoreExcept===false){
      return callback&& callback(except);
    }

    var async=queues[i++];
    if(async==null){
      return callback&& callback(null);
    }
    async(next);
  }
  next();
}

//converting async by img.src with selectorAll
Vectorizer.convertToSVGAsync=function(selector,callback){
  var queues=[];
  var imgs=Array.prototype.slice.call(document.querySelectorAll(selector));
  imgs.forEach(function(img){
    queues.push(function(next){
      Vectorizer.convertToSVG(img,function(except,dataurl){
        img.src=dataurl;
        if(img.className.indexOf('vectorized')==-1){
          img.className+=' vectorized';
        }
        next(null,dataurl);
      },'dataurl');
    });
  });
  Vectorizer.async(queues,callback,true);
}

//html string to dataurl
Vectorizer.getDataURL=function(data,mimetype){
  mimetype= mimetype!=null? mimetype: 'image/svg+xml';
  return 'data:'+mimetype+';base64,'+btoa(data);
}

//replace img element by src attribute with selectorAll
Vectorizer.replaceToSVGAsync=function(selector,callback){
  var queues=[];
  var imgs=Array.prototype.slice.call(document.querySelectorAll(selector));
  imgs.forEach(function(img){
    queues.push(function(next){
      Vectorizer.convertToSVG(img,function(except,svg){
        if(except){
          Vectorizer.exchange(img,Vectorizer.notFoundSVG);
          return next(except);
        }
        Vectorizer.exchange(img,svg);

        return next(null,svg);
      });
    });
  });
  Vectorizer.async(queues,callback,true);
}

//replace on newChildInnerHTML for oldChild
Vectorizer.exchange=function(oldChild,newChildInnerHTML){
  var container=document.createElement('div');
  container.innerHTML=newChildInnerHTML;
  var element=container.querySelector('*');
  if(element&& oldChild.parentNode!=null){
    oldChild.parentNode.replaceChild(element,oldChild);
  }
  return element;
}

//localhost doesn't work.
Vectorizer.readImageData=function(image,callback){
  var canvas=document.createElement('canvas');
  var context=canvas.getContext('2d');
  canvas.width=image.width;
  canvas.height=image.height;

  //やばい画像を描写しようとすると落ちるらしい
  try{
    context.drawImage(image,0,0);
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
}

//CanvasPixelArray to <svg>
Vectorizer.createSVG=function(imagedata){
  var svg=Vectorizer.createElement('svg');

  svg.setAttributeNS(null,'viewBox','0 0 '+imagedata.width+' '+imagedata.height);
  svg.setAttributeNS(null,'shape-rendering','crispEdges');
  //for dataurl
  svg.setAttribute('version','1.1');
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  svg.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  svg.appendChild(Vectorizer.convertToG(imagedata));

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
Vectorizer.point=function(x,y){
  this.x=x;
  this.y=y;
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
Vectorizer.rect=function(point){
  this.x=point.x,
  this.y=point.y;
  this.width=1;
  this.height=1;
}

//[{rgba:points},{...}] to "d" attribute
Vectorizer.convertToD=function(rect){
  //point is path.setAttributeNS(null,'d','M0,0 h1 v1 h-1 z');
  return 'M'+rect.x+','+rect.y+'h'+rect.width+'v'+rect.height+'h-'+rect.width+'Z';
}
