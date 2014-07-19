function Vectorizer(){
  // @version 0.0.1
  // @license MIT
  // @author 59naga 2014-07-19
}
Vectorizer.autoReplace=true;
Vectorizer.createElement=document.createElementNS.bind(document,'http://www.w3.org/2000/svg');

//replaceToSVG runner
addEventListener('load',function(){
  if(Vectorizer.autoReplace===false){
    return;
  }

  var imgs=Array.prototype.slice.call(document.querySelectorAll('img.vectorize'));
  imgs.forEach(function(img){
    Vectorizer.replaceToSVG(img);
  });
});

//<img> to <svg> with crispEdges
Vectorizer.replaceToSVG=function(img){
  Vectorizer.readImageData(img,function(except,imagedata){
    if(except){throw new Error(except)}

    var svg=Vectorizer.createSVG(imagedata);
    img.parentNode.replaceChild(svg,img);
  });
}

//CanvasPixelArray to <svg>
Vectorizer.createSVG=function(imagedata){
  var svg=Vectorizer.createElement('svg');

  svg.setAttributeNS(null,'viewBox','0 0 '+imagedata.width+' '+imagedata.height);
  svg.setAttributeNS(null,'shape-rendering','crispEdges');
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

//localhost doesn't work.
Vectorizer.readImageData=function(image,callback){
  var canvas=document.createElement('canvas');
  var context=canvas.getContext('2d');
  canvas.width=image.width;
  canvas.height=image.height;
  context.drawImage(image,0,0);

  try{
    var imagedata=context.getImageData(0,0,canvas.width,canvas.height);
    callback(null,imagedata);
  }
  catch(except){
    callback(except);
  }
}