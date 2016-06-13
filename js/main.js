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

var mouseConstraint,nodes,ball;
var branches = [];
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

  var order = [     // branches[fromX,fromY,toX,toY]
    [-1,0,0,-2], [1,0,0,-2], [0,-2,0,-4], [0,-4,0,-6],

  ];

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
  for(var i=0; i<order.length; i++){
    for(var j=0; j<2; j++){
      if(! (order[i][j*2+0]+":"+order[i][j*2+1] in nodes) ){
        var x = order[i][j*2+0];
        var y = order[i][j*2+1];

        nodes[ x+":"+y ] = {
          x: x,
          y: y,
          value: 0,
          obj: Bodies.circle(_OFFSET.x + x*_SCALE, _OFFSET.y + y*_SCALE, 5, {
            timeScale: 0.5,
            render: {
                strokeStyle: "#008000",
                fillStyle: "#008000"
            }
          }),
        };
        if( y == 0 ){continue;}
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
    branches.push(branch);
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
};
GAME.update = function(){
  //mouseover,mouseclick
  var found = false;
  for(var i=0; i<branches.length; i++){

    var obj = branches[i];
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
      }
    }
  }
};

if( window.addEventListener ){
  window.addEventListener('load', GAME.init);
}else if( window.attachEvent ){
  window.attachEvent('load', GAME.init);
}

})();
