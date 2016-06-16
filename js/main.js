(function(){
//Matter.js モジュール 初期設定
var Engine = Matter.Engine, //物理シュミレーションおよびレンダリングを管理する
  Events = Matter.Events,
  Render = Matter.Render, //デバッグ用の描画
	World = Matter.World, //物理演算領域の作成・操作するメソッドを含む
	Body = Matter.Body, //剛体のモデルを作成・操作するメソッドを含む
	Bodies = Matter.Bodies, //一般的な剛体モデルを作成するメソッドを含む
	Constraint = Matter.Constraint, //制約を作成・操作するメソッドを含む
	Composites = Matter.Composites,
	//Common = Matter.Common,
	//Vertices = Matter.Vertices, //頂点のセットを作成・操作するメソッドを含む
	MouseConstraint = Matter.MouseConstraint; //マウスの制約を作成するためのメソッドが含む

const _SCALE = 40;
const _OFFSET = {x:320, y:470};
var GAME = {};
var engine = null;
var mouse = new Vector2(0,0);
var mouseClick = false;
var waitClick = false;

var mouseConstraint,ball;
var branches = [];    // Array( {obj: Constraint, linkA:str, linkB:str, tag:{alpha:int, water: bool} } )
var nodes = {};       // Object{ x,y,obj,hideObj, tag:{alpha:int, value:int, water:bool} }

var loadstack = 0;
GAME.init = function(){
  //Engine作成:
  var container = document.getElementById("canvas-container");
  engine = Engine.create(container, {
    render: {
      options: {
        wireframes: false,
        width: 640,
        height: 480,
        background: "rgba(0,0,0,0)"
      }
    }
  });

  //マウス操作追加
  mouseConstraint = MouseConstraint.create(engine);
  World.add(engine.world, mouseConstraint);

  // グラフを読み込む
  var order = getQuiz(0);

  //床
  var floor = Bodies.rectangle(320, 500, 650, 60, {
    isStatic: true,
    render: {
      fillStyle: "#00ff00",
    }
  });
  World.add(engine.world, floor);


  //節
  nodes = {};
  groundNodes = [];
  for(var i=0; i<order.length; i++){
    for(var j=0; j<2; j++){
      if(! (order[i][j*2+0]+":"+order[i][j*2+1] in nodes) ){
        var x = order[i][j*2+0];
        var y = order[i][j*2+1];

        nodes[ x+":"+y ] = {
          x: x,
          y: y,
          obj: Bodies.circle(_OFFSET.x + x*_SCALE, _OFFSET.y + y*_SCALE, 5, {
            timeScale: 0.5,
            render: {
                strokeStyle: "#008000",
                fillStyle: "#008000"
            }
          }),
          hideObj: null,
          link: [],     // [ String keyname ]
          tag: {
            water: false,
            value: 0,
            earth: false,
            alpha: 1,     // fillStyle alpha
          }
        };
        if( y == 0 ){
          nodes[ x+":"+y ].tag.earth = true;
          continue;
        }
        World.add(engine.world, nodes[ x+":"+y ].obj);

        var invisibleBranch = Constraint.create({
          bodyA: nodes[ x+":"+y ].obj,
          pointB: {x:nodes[ x+":"+y ].obj.position.x, y:nodes[ x+":"+y ].obj.position.y},
          stiffness: 0.02,
          render: {
            visible: false
          },
        });
        World.add(engine.world, invisibleBranch);
        nodes[ x+":"+y ].hideObj = invisibleBranch;
      }
    }
  }

  //枝

  for(var i=0; i<order.length; i++){
    var A = [ order[i][0], order[i][1] ];
    var B = [ order[i][2], order[i][3] ];
    var branch =  Constraint.create({
      bodyA: nodes[A[0]+":"+A[1]].obj,
      bodyB: nodes[B[0]+":"+B[1]].obj,
      stiffness: 0.2,
      render: {
        strokeStyle: "#008000",
        lineWidth: 2,
      },
    });
    if( A[1] == 0 ){
      branch.bodyA = floor;
      branch.pointA = {x:A[0]*_SCALE, y:-30};
    }
    if( B[1] == 0 ){
      branch.bodyB = floor;
      branch.pointB = {x:B[0]*_SCALE, y:-30};
    }
    World.add(engine.world, branch);
    branches.push( {
      obj: branch,
      linkA: A[0]+":"+A[1],
      linkB: B[0]+":"+B[1],
      tag: {
        water: false,
        alpha: 1,
      }
    } );

    // node link
    nodes[A[0]+":"+A[1]].link.push( B[0]+":"+B[1] );
    nodes[B[0]+":"+B[1]].link.push( A[0]+":"+A[1] );
  }


  var softbody = Composites.softBody(100,50,1,5,0,0,true,10,{
    friction: 0.05,
    frictionStatic: 0.1,
    render: { visible: true }
  });
  World.add(engine.world, softbody);

  //ball
  var x = 3;
  var y = 3;
  ball =  Bodies.circle(x, y, 15, {
    isStatic: true,
    density: 0.0005,
    frictionAir: 0.01,
    restitution: 1,
    friction: 0.01,
    render: {
      fillStyle: "#ff0000"
    }
  });
  World.add(engine.world, ball);
  //Body.setPosition(ball, {x:64*4, y:0});

  Engine.run(engine);

  Events.on(engine, "afterUpdate", function(){
    GAME.update();
  });
  engine.render.canvas.addEventListener('mousemove', function(e){
    mouse.x = e.pageX - 5;
    mouse.y = e.pageY - 5;
    //Body.setPosition(ball, {x:x, y:y});
  	// var c = Bodies.circle(64*5, 0, 10, { restitution: 1.2 });
  	// World.add(engine.world, [c]);
  });
  engine.render.canvas.addEventListener("mousedown",function(e){
    mouse.x = e.pageX -5;
    mouse.y = e.pageY -5;
    if(waitClick){
      mouseClick = true;
    }
  });
  // init water
  GAME.waterCalc();

};
GAME.update = function(){
  //mouseover,mouseclick
  {
    var found = false;
    for(var i=0; i<branches.length; i++){
      if(branches[i].tag.alpha != 1){
        continue;
      }

      var obj = branches[i].obj;
      var BtoA = new Vector2(
          (obj.bodyA.position.x+obj.pointA.x) - (obj.bodyB.position.x+obj.pointB.x),
          (obj.bodyA.position.y+obj.pointA.y) - (obj.bodyB.position.y+obj.pointB.y)
      );
      var BtoMouse = new Vector2(
        mouse.x - (obj.bodyB.position.x+obj.pointB.x),
        mouse.y - (obj.bodyB.position.y+obj.pointB.y)
      );
      var AtoMouse = new Vector2(
        mouse.x - (obj.bodyA.position.x+obj.pointA.x),
        mouse.y - (obj.bodyA.position.y+obj.pointA.y)
      );
      obj.render.strokeStyle = "#008000";
      if(found){continue;}
      if( BtoA.dot(BtoMouse) >0 && BtoA.times(-1).dot(AtoMouse) >0 ){
        if( Math.abs(BtoA.cross(BtoMouse)/2/BtoA.length()) < 5 ){
          obj.render.strokeStyle = "#ff0000";
          found = true;
          if(!waitClick){
            waitClick = true;
            mouseClick = false;
          }
          if( mouseClick ){
            mouseClick = false;
            waitClick = false;

            GAME.cutBranch(i);
            i--;
            // update waterData
            GAME.waterCalc();
          }
        }
      }
    }
    if(!found){waitClick = false;}
  }
  // delete isolated graph
  {
    // delete nodes
    for(var key in nodes){
      if(!nodes[key].tag.water){
        World.remove(engine.world,nodes[key].hideObj);
        nodes[key].tag.alpha -= 0.01;
        if(nodes[key].tag.alpha <= 0){
          World.remove(engine.world,nodes[key].obj);
          delete nodes[key];
        } else {
          nodes[key].obj.render.strokeStyle = "rgba(128,128,128,"+nodes[key].tag.alpha+")";
          nodes[key].obj.render.fillStyle = "rgba(128,128,128,"+nodes[key].tag.alpha+")";
        }

      }
    }
    for(var i=0; i<branches.length; i++){
      if(!branches[i].tag.water){
        branches[i].tag.alpha -= 0.01;
        if(branches[i].tag.alpha <= 0){
          World.remove(engine.world,branches[i].obj);
          branches.splice(i,1);
          i--;
          continue;
        } else {
          branches[i].obj.render.strokeStyle = "rgba(128,128,128,"+branches[i].tag.alpha+")";
        }

      }
    }
  }
};
GAME.cutBranch = function(key){
  var i = key;
  for(var j=0; j<nodes[branches[i].linkA].link.length; j++){
    if( nodes[branches[i].linkA].link[j] == branches[i].linkB ){
      nodes[branches[i].linkA].link.splice(j,1);
      break;
    }
  }
  for(var j=0; j<nodes[branches[i].linkB].link.length; j++){
    if( nodes[branches[i].linkB].link[j] == branches[i].linkA ){
      nodes[branches[i].linkB].link.splice(j,1);
      break;
    }
  }
  World.remove(engine.world, branches[i].obj);
  branches.splice(i,1);
};
GAME.waterCalc = function(){
  // init
  for(var key in nodes){
    nodes[key].tag.water = false;
    nodes[key].tag.value = 0;
  }
  for(var i=0; i<branches.length; i++){
    branches[i].tag.water = false;
  }
  // start calc
  var nextKeys = [];
  for(var key in nodes){
    if( nodes[key].tag.earth ){
      nodes[key].tag.water = true;
      nodes[key].tag.value = 1;

      for(var i=0; i<nodes[key].link.length; i++){
        nextKeys.push( nodes[key].link[i] );
        for(var j=0; j<branches.length; j++){
          if( (branches[j].linkA == key && branches[j].linkB == nodes[key].link[i])
            || (branches[j].linkB == key && branches[j].linkA == nodes[key].link[i]) ){
              branches[j].tag.water = true;
          }
        }
      }
    }
  }
  while(nextKeys.length > 0){
    var key = nextKeys[0];
    nodes[key].tag.water = true;
    nodes[key].tag.value = 1;

    for(var i=0; i<nodes[key].link.length; i++){
      if( nodes[ nodes[key].link[i] ].tag.value == 0 ){
        nextKeys.push( nodes[key].link[i] );
        for(var j=0; j<branches.length; j++){
          if( (branches[j].linkA == key && branches[j].linkB == nodes[key].link[i])
            || (branches[j].linkB == key && branches[j].linkA == nodes[key].link[i]) ){
              branches[j].tag.water = true;
          }
        }
      }
    }
    nextKeys.splice(0,1);
  }
};

if( window.addEventListener ){
  window.addEventListener('load', GAME.init);
}else if( window.attachEvent ){
  window.attachEvent('load', GAME.init);
}

})();
