function Vectorizer(){
  // @version 0.0.1
  // @license MIT
  // @author 59naga 2014-07-19
}
Vectorizer.createElement=document.createElementNS.bind(document,'http://www.w3.org/2000/svg');
Vectorizer.replaceToSVG=function(img){
  Vectorizer.readImageData(img,function(except,imagedata){
    if(except){throw new Error(except)}

    var paths=Vectorizer.convertToPaths(imagedata);
    var svg=Vectorizer.createElement('svg');
    svg.setAttributeNS(null,'viewBox','0 0 '+imagedata.width+' '+imagedata.height);
    svg.setAttributeNS(null,'shape-rendering','crispEdges');
    svg.appendChild(paths);
    img.parentNode.replaceChild(svg,img);
  });
}
Vectorizer.convertToSVG=function(url,callback){
  Vectorizer.loadImageData(url,function(except,imagedata){
    if(except){throw new Error(except)}

    var paths=Vectorizer.convertToPaths(imagedata);
    var svg=Vectorizer.createElement('svg');
    svg.setAttributeNS(null,'viewBox','0 0 '+imagedata.width+' '+imagedata.height);
    svg.setAttributeNS(null,'shape-rendering','crispEdges');
    svg.appendChild(paths);
    document.body.appendChild(svg);
  });
}
Vectorizer.convertToPaths=function(imagedata){
  var paths=Vectorizer.createElement('g');

  var color_list=Vectorizer.convertToColorAndPoints(imagedata);
  for(var rgba in color_list){
    var d=[];
    var lines=Vectorizer.convertToLines(color_list[rgba]);
    lines.forEach(function(line){
      d.push(Vectorizer.convertToD(line));
    });

    var attributes={};
    attributes.fill=rgba;
    attributes.d=d.join('\n');

    var path=Vectorizer.createElement('path');
    for(var name in attributes){
      var value=attributes[name];
      path.setAttributeNS(null,name,value);
    }
    paths.appendChild(path);
  }

  return paths;
}
// point is...
// path.setAttributeNS(null,'d','M0,0 h1 v1 h-1 z');
Vectorizer.convertToD=function(rect){
  return 'M'+rect.x+','+rect.y+'h'+rect.width+'v'+rect.height+'h-'+rect.width+'Z';
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
  return rect={
    x:point.x,
    y:point.y,
    width:1,
    height:1,
  }
}
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
    colors[rgba].push({x:x,y:y});
  }
  return colors;
}
Vectorizer.loadImageData=function(url,callback){
  var image=new Image;
  image.src=url;
  image.addEventListener('error',callback.bind(image));
  image.addEventListener('load',function(){
    Vectorizer.readImageData(image,callback);
  });
}
Vectorizer.readImageData=function(image,callback){
  var canvas=document.createElement('canvas');
  var context=canvas.getContext('2d');
  canvas.width=image.width;
  canvas.height=image.height;
  context.drawImage(image,0,0);

  //localhost doesn't work.
  try{
    var imagedata=context.getImageData(0,0,canvas.width,canvas.height);
    callback(null,imagedata);
  }
  catch(except){
    callback(except);
  }
}